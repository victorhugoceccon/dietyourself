import express from 'express'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY
const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1/places:autocomplete'
const GOOGLE_PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places'
const GOOGLE_STATIC_MAPS_URL = 'https://maps.googleapis.com/maps/api/staticmap'

// GET /api/places/autocomplete - Buscar lugares com autocomplete (Google Places API)
router.get('/autocomplete', authenticate, async (req, res) => {
  try {
    const { input, lat, lng } = req.query

    if (!input || input.trim().length < 2) {
      return res.json({ predictions: [] })
    }

    // Se não tiver API key do Google, usar fallback para Nominatim/OSM
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ GOOGLE_MAPS_API_KEY não configurada, usando fallback Nominatim')
      return await fallbackNominatimAutocomplete(req, res, input, lat, lng)
    }

    // Configurar bias para Brasil
    const locationBias = lat && lng 
      ? { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: 50000 } }
      : { circle: { center: { latitude: -23.5505, longitude: -46.6333 }, radius: 50000 } } // São Paulo como padrão

    const requestBody = {
      input: input.trim(),
      locationBias,
      includedRegionCodes: ['BR'], // Restringir ao Brasil
      languageCode: 'pt-BR'
    }

    const response = await fetch(GOOGLE_PLACES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro na API do Google Places:', response.status, errorText)
      // Fallback para Nominatim se Google falhar
      return await fallbackNominatimAutocomplete(req, res, input, lat, lng)
    }

    const data = await response.json()
    
    // Transformar resposta do Google Places para formato compatível
    const predictions = (data.suggestions || []).map(suggestion => {
      const prediction = suggestion.placePrediction
      return {
        placeId: prediction.placeId,
        description: prediction.text.text,
        structured_formatting: {
          main_text: prediction.text.text.split(',')[0],
          secondary_text: prediction.text.text.split(',').slice(1).join(',').trim()
        }
      }
    })

    res.json({ predictions })
  } catch (error) {
    console.error('Erro ao buscar autocomplete:', error)
    // Fallback para Nominatim em caso de erro
    try {
      return await fallbackNominatimAutocomplete(req, res, req.query.input, req.query.lat, req.query.lng)
    } catch (fallbackError) {
      res.status(500).json({ error: 'Erro ao buscar lugares' })
    }
  }
})

// GET /api/places/details - Buscar detalhes de um lugar por placeId
router.get('/details', authenticate, async (req, res) => {
  try {
    const { placeId } = req.query

    if (!placeId) {
      return res.status(400).json({ error: 'placeId é obrigatório' })
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key não configurada' })
    }

    const response = await fetch(`${GOOGLE_PLACES_DETAILS_URL}/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro ao buscar detalhes do lugar:', response.status, errorText)
      return res.status(response.status).json({ error: 'Erro ao buscar detalhes do lugar' })
    }

    const data = await response.json()
    
    res.json({
      placeId: data.id,
      name: data.displayName?.text || '',
      formattedAddress: data.formattedAddress || '',
      location: data.location ? {
        lat: data.location.latitude,
        lng: data.location.longitude
      } : null
    })
  } catch (error) {
    console.error('Erro ao buscar detalhes do lugar:', error)
    res.status(500).json({ error: 'Erro ao buscar detalhes do lugar' })
  }
})

// GET /api/places/static-map - Proxy para Google Static Maps (sem auth para permitir <img>)
router.get('/static-map', async (req, res) => {
  try {
    const { lat, lng, zoom = 15, size = '600x400', markers } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat e lng são obrigatórios' })
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key não configurada' })
    }

    let url = `${GOOGLE_STATIC_MAPS_URL}?center=${lat},${lng}&zoom=${zoom}&size=${size}&key=${GOOGLE_MAPS_API_KEY}`
    
    if (markers) {
      url += `&markers=color:red|${lat},${lng}`
    }

    // Fazer proxy da imagem
    const response = await fetch(url)
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro ao gerar mapa' })
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(Buffer.from(imageBuffer))
  } catch (error) {
    console.error('Erro ao gerar mapa estático:', error)
    res.status(500).json({ error: 'Erro ao gerar mapa' })
  }
})

// Função fallback usando Nominatim/OSM
async function fallbackNominatimAutocomplete(req, res, input, lat, lng) {
  try {
    const viewbox = lat && lng 
      ? `&viewbox=${parseFloat(lng) - 0.1},${parseFloat(lat) - 0.1},${parseFloat(lng) + 0.1},${parseFloat(lat) + 0.1}&bounded=1`
      : '&viewbox=-47.0,-24.0,-46.0,-23.0&bounded=1' // São Paulo

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5&countrycodes=br&addressdetails=1${viewbox}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LifeFit App'
      }
    })

    if (!response.ok) {
      return res.json({ predictions: [] })
    }

    const data = await response.json()
    
    const predictions = data.map(item => ({
      placeId: `osm_${item.place_id}`,
      description: item.display_name,
      structured_formatting: {
        main_text: item.name || item.display_name.split(',')[0],
        secondary_text: item.display_name.split(',').slice(1).join(',').trim()
      },
      location: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }
    }))

    res.json({ predictions })
  } catch (error) {
    console.error('Erro no fallback Nominatim:', error)
    res.json({ predictions: [] })
  }
}

export default router
