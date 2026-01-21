import { useState, useEffect, useRef } from 'react'
import {
  ArrowsClockwise,
  Barbell,
  Camera,
  CheckCircle,
  CircleNotch,
  Crosshair,
  Drop,
  Lightning,
  MoonStars,
  Smiley,
  Target,
  Trophy,
  MapPin,
  UploadSimple,
  X
} from '@phosphor-icons/react'
import { API_URL, loadGoogleMapsScript } from '../config/api'
import './DailyCheckIn.css'

function DailyCheckIn({ onCheckInComplete }) {
  const [adherence, setAdherence] = useState(null)
  const [pesoAtual, setPesoAtual] = useState('')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const [nivelEnergia, setNivelEnergia] = useState(null)
  const [qualidadeSono, setQualidadeSono] = useState(null)
  const [humorGeral, setHumorGeral] = useState(null)
  const [aguaMetaLitros, setAguaMetaLitros] = useState('')
  const [treinoPlanejado, setTreinoPlanejado] = useState(null)
  const [focoDia, setFocoDia] = useState('')
  const [dietMeals, setDietMeals] = useState([])
  const [refeicoesConsumidas, setRefeicoesConsumidas] = useState([])
  
  // Localização
  const [locationName, setLocationName] = useState('')
  const [locationLat, setLocationLat] = useState(null)
  const [locationLng, setLocationLng] = useState(null)
  const locationInputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  
  // Foto
  const [photoUrl, setPhotoUrl] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    loadTodayCheckIn()
    loadDietMeals()
  }, [])

  const loadDietMeals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/diet`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setDietMeals(data.dieta?.refeicoes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dieta:', error)
    }
  }

  const toggleMeal = (mealIndex) => {
    setRefeicoesConsumidas(prev => (
      prev.includes(mealIndex)
        ? prev.filter(index => index !== mealIndex)
        : [...prev, mealIndex]
    ))
  }

  const getDailyScore = () => {
    let score = 0
    if (adherence === 'TOTAL') score += 45
    if (adherence === 'PARCIAL') score += 25
    if (adherence === 'NAO_SEGUIU') score += 10

    if (nivelEnergia) score += nivelEnergia * 4
    if (qualidadeSono) score += qualidadeSono * 4
    if (humorGeral) score += humorGeral * 4
    if (aguaMetaLitros) score += 8
    if (treinoPlanejado !== null) score += 6
    if (focoDia) score += 6
    if (dietMeals.length > 0 && refeicoesConsumidas.length > 0) {
      score += Math.min(10, Math.round((refeicoesConsumidas.length / dietMeals.length) * 10))
    }

    return Math.min(100, score)
  }

  // Inicializar Google Maps Autocomplete e Mapa
  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (window.google && window.google.maps) {
        // Inicializar Autocomplete
        if (locationInputRef.current) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            locationInputRef.current,
            {
              types: ['establishment', 'geocode'],
              componentRestrictions: { country: 'br' },
              fields: ['formatted_address', 'geometry', 'name']
            }
          )

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (place.geometry) {
              const lat = place.geometry.location.lat()
              const lng = place.geometry.location.lng()
              setLocationName(place.formatted_address || place.name || '')
              setLocationLat(lat)
              setLocationLng(lng)
              updateMap(lat, lng)
            }
          })

          autocompleteRef.current = autocomplete
        }

        // Inicializar Mapa
        if (mapRef.current && !mapInstanceRef.current) {
          const defaultCenter = locationLat && locationLng 
            ? { lat: locationLat, lng: locationLng }
            : { lat: -23.5505, lng: -46.6333 } // São Paulo como padrão

          const map = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: locationLat && locationLng ? 15 : 10,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true
          })

          mapInstanceRef.current = map

          // Adicionar marcador se já houver localização
          if (locationLat && locationLng) {
            updateMap(locationLat, locationLng)
          }
        }
      }
    })
  }, [])

  // Atualizar mapa quando localização mudar
  useEffect(() => {
    if (mapInstanceRef.current && locationLat && locationLng) {
      updateMap(locationLat, locationLng)
    }
  }, [locationLat, locationLng])

  // Função para atualizar o mapa com nova localização
  const updateMap = (lat, lng) => {
    if (!mapInstanceRef.current || !window.google) return

    const position = { lat, lng }
    
    // Mover mapa para a nova posição
    mapInstanceRef.current.setCenter(position)
    mapInstanceRef.current.setZoom(15)

    // Remover marcador anterior se existir
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    // Criar novo marcador
    markerRef.current = new window.google.maps.Marker({
      position: position,
      map: mapInstanceRef.current,
      title: locationName || 'Localização do check-in',
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(32, 32)
      }
    })

    // Adicionar info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div style="padding: 8px; max-width: 250px;"><strong>${locationName || 'Localização do check-in'}</strong><br/><small>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small></div>`
    })

    // Abrir info window automaticamente quando atualizar
    infoWindow.open(mapInstanceRef.current, markerRef.current)

    // Também permitir abrir ao clicar
    markerRef.current.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, markerRef.current)
    })
  }

  const loadTodayCheckIn = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/checkin/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.checkIn) {
          setTodayCheckIn(data.checkIn)
          setAdherence(data.checkIn.adherence)
          setPesoAtual(data.checkIn.pesoAtual ? data.checkIn.pesoAtual.toString() : '')
          setObservacao(data.checkIn.observacao || '')
          setLocationName(data.checkIn.locationName || '')
          const lat = data.checkIn.locationLat || null
          const lng = data.checkIn.locationLng || null
          setLocationLat(lat)
          setLocationLng(lng)
          setPhotoUrl(data.checkIn.photoUrl || null)
          setPhotoPreview(data.checkIn.photoUrl || null)
          setNivelEnergia(data.checkIn.nivelEnergia ?? null)
          setQualidadeSono(data.checkIn.qualidadeSono ?? null)
          setHumorGeral(data.checkIn.humorGeral ?? null)
          setAguaMetaLitros(data.checkIn.aguaMetaLitros ? data.checkIn.aguaMetaLitros.toString() : '')
          setTreinoPlanejado(typeof data.checkIn.treinoPlanejado === 'boolean' ? data.checkIn.treinoPlanejado : null)
          setFocoDia(data.checkIn.focoDia || '')

          const refeicoesRaw = data.checkIn.refeicoesConsumidas
          if (Array.isArray(refeicoesRaw)) {
            setRefeicoesConsumidas(refeicoesRaw)
          } else if (typeof refeicoesRaw === 'string') {
            try {
              setRefeicoesConsumidas(JSON.parse(refeicoesRaw))
            } catch {
              setRefeicoesConsumidas([])
            }
          }
          
          // Atualizar mapa se houver localização
          if (lat && lng) {
            loadGoogleMapsScript(() => {
              setTimeout(() => {
                updateMap(lat, lng)
              }, 500)
            })
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar check-in de hoje:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!adherence) return

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adherence,
          pesoAtual: pesoAtual ? parseFloat(pesoAtual) : null,
          observacao: observacao.trim() || null,
          nivelEnergia,
          qualidadeSono,
          humorGeral,
          aguaMetaLitros: aguaMetaLitros ? parseFloat(aguaMetaLitros) : null,
          treinoPlanejado,
          focoDia: focoDia || null,
          refeicoesConsumidas: refeicoesConsumidas.length ? refeicoesConsumidas : null,
          locationName: locationName.trim() || null,
          locationLat: locationLat || null,
          locationLng: locationLng || null,
          photoUrl: photoUrl || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTodayCheckIn(data.checkIn)
        setShowSuccess(true)
        
        // Feedback visual
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)

        if (onCheckInComplete) {
          onCheckInComplete()
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao salvar check-in')
      }
    } catch (error) {
      console.error('Erro ao salvar check-in:', error)
      alert('Erro ao salvar check-in. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="daily-checkin-card">
        <div className="checkin-loading">Carregando...</div>
      </div>
    )
  }

  // Função para obter localização atual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador')
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setLocationLat(lat)
        setLocationLng(lng)

        // Atualizar mapa imediatamente
        updateMap(lat, lng)

        // Usar Geocoding para obter o nome do local
        loadGoogleMapsScript(() => {
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results[0]) {
                setLocationName(results[0].formatted_address)
              } else {
                setLocationName(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`)
              }
            })
          } else {
            setLocationName(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`)
          }
        })

        setIsLocating(false)
      },
      (error) => {
        console.error('Erro ao obter localização:', error)
        alert('Erro ao obter localização. Verifique as permissões do navegador.')
        setIsLocating(false)
      }
    )
  }

  // Função para lidar com upload de foto
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoUrl(reader.result)
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // Função para remover foto
  const removePhoto = () => {
    setPhotoUrl(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const today = new Date()
  const todayFormatted = today.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })

  return (
    <div className="daily-checkin-card">
      <div className="checkin-header">
        <h3 className="checkin-title">Check-in de Hoje</h3>
        <p className="checkin-date">{todayFormatted}</p>
      </div>

      {showSuccess && (
        <div className="checkin-success-message">
          <span className="success-icon">
            <CheckCircle size={18} weight="fill" />
          </span>
          <span>Check-in registrado com sucesso!</span>
        </div>
      )}

      <div className="checkin-score-card">
        <div className="checkin-score-header">
          <span className="checkin-score-badge">
            <Trophy size={16} weight="fill" /> Pontuação do dia
          </span>
          <strong>{getDailyScore()}/100</strong>
        </div>
        <div className="checkin-score-bar">
          <span style={{ width: `${getDailyScore()}%` }} />
        </div>
        <p className="checkin-score-hint">
          {getDailyScore() >= 80 ? 'Dia de alta performance' : getDailyScore() >= 60 ? 'Dia consistente' : 'Dia de progresso'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="checkin-form">
        <div className="checkin-section">
          <label className="checkin-section-label">
            Como você pretende seguir a dieta hoje? *
          </label>
          <div className="adherence-options">
            <button
              type="button"
              onClick={() => setAdherence('TOTAL')}
              className={`adherence-btn ${adherence === 'TOTAL' ? 'selected' : ''}`}
            >
              <span className="adherence-emoji">
                <CheckCircle size={18} weight="fill" />
              </span>
              <span className="adherence-label">Segui totalmente</span>
            </button>
            <button
              type="button"
              onClick={() => setAdherence('PARCIAL')}
              className={`adherence-btn ${adherence === 'PARCIAL' ? 'selected' : ''}`}
            >
              <span className="adherence-emoji">
                <Lightning size={18} weight="fill" />
              </span>
              <span className="adherence-label">Segui parcialmente</span>
            </button>
            <button
              type="button"
              onClick={() => setAdherence('NAO_SEGUIU')}
              className={`adherence-btn ${adherence === 'NAO_SEGUIU' ? 'selected' : ''}`}
            >
              <span className="adherence-emoji">
                <ArrowsClockwise size={18} weight="fill" />
              </span>
              <span className="adherence-label">Não segui</span>
            </button>
          </div>
        </div>

        <div className="checkin-section">
          <label className="checkin-section-label">
            Como você se sentiu hoje?
          </label>
          <div className="checkin-metric-grid">
            <div className="checkin-metric-card">
              <div className="checkin-metric-header">
                <Lightning size={18} weight="fill" />
                <span>Energia</span>
              </div>
              <div className="checkin-metric-scale">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={`energia-${value}`}
                    type="button"
                    className={`checkin-scale-btn ${nivelEnergia === value ? 'active' : ''}`}
                    onClick={() => setNivelEnergia(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="checkin-metric-card">
              <div className="checkin-metric-header">
                <MoonStars size={18} weight="fill" />
                <span>Sono</span>
              </div>
              <div className="checkin-metric-scale">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={`sono-${value}`}
                    type="button"
                    className={`checkin-scale-btn ${qualidadeSono === value ? 'active' : ''}`}
                    onClick={() => setQualidadeSono(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="checkin-metric-card">
              <div className="checkin-metric-header">
                <Smiley size={18} weight="fill" />
                <span>Humor</span>
              </div>
              <div className="checkin-metric-scale">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={`humor-${value}`}
                    type="button"
                    className={`checkin-scale-btn ${humorGeral === value ? 'active' : ''}`}
                    onClick={() => setHumorGeral(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="checkin-section">
          <label className="checkin-section-label">Plano do dia</label>
          <div className="checkin-metric-grid two-columns">
            <div className="checkin-metric-card">
              <div className="checkin-metric-header">
                <Drop size={18} weight="fill" />
                <span>Meta de água (L)</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={aguaMetaLitros}
                onChange={(e) => setAguaMetaLitros(e.target.value)}
                placeholder="Ex: 2.0"
                className="checkin-input"
              />
            </div>
            <div className="checkin-metric-card">
              <div className="checkin-metric-header">
                <Barbell size={18} weight="fill" />
                <span>Treino hoje?</span>
              </div>
              <div className="checkin-toggle">
                <button
                  type="button"
                  className={`checkin-toggle-btn ${treinoPlanejado === true ? 'active' : ''}`}
                  onClick={() => setTreinoPlanejado(true)}
                >
                  Sim
                </button>
                <button
                  type="button"
                  className={`checkin-toggle-btn ${treinoPlanejado === false ? 'active' : ''}`}
                  onClick={() => setTreinoPlanejado(false)}
                >
                  Não
                </button>
              </div>
            </div>
            <div className="checkin-metric-card">
              <div className="checkin-metric-header">
                <Target size={18} weight="fill" />
                <span>Foco do dia</span>
              </div>
              <div className="checkin-focus-chips">
                {['Disciplina', 'Hidratação', 'Energia', 'Leveza', 'Constância'].map((foco) => (
                  <button
                    key={foco}
                    type="button"
                    className={`checkin-focus-chip ${focoDia === foco ? 'selected' : ''}`}
                    onClick={() => setFocoDia(foco)}
                  >
                    {foco}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {dietMeals.length > 0 && (
          <div className="checkin-section">
            <label className="checkin-section-label">Refeições do dia</label>
            <div className="checkin-meal-chips">
              {dietMeals.map((refeicao, index) => (
                <button
                  key={`${refeicao.nome || 'refeicao'}-${index}`}
                  type="button"
                  className={`checkin-meal-chip ${refeicoesConsumidas.includes(index) ? 'selected' : ''}`}
                  onClick={() => toggleMeal(index)}
                >
                  {refeicao.nome || `Refeição ${index + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="checkin-section">
          <label htmlFor="peso-atual" className="checkin-section-label">
            Peso atual (kg) <span className="optional-label">opcional</span>
          </label>
          <input
            id="peso-atual"
            type="number"
            step="0.1"
            min="1"
            max="500"
            value={pesoAtual}
            onChange={(e) => setPesoAtual(e.target.value)}
            placeholder="Ex: 75.5"
            className="checkin-input"
          />
        </div>

        <div className="checkin-section">
          <label htmlFor="observacao" className="checkin-section-label">
            Como foi o dia? <span className="optional-label">opcional</span>
          </label>
          <textarea
            id="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Conte como foi seu dia em relação à dieta..."
            maxLength={500}
            rows={3}
            className="checkin-textarea"
          />
          <div className="char-counter">{observacao.length}/500</div>
        </div>

        <div className="checkin-section">
          <label htmlFor="location" className="checkin-section-label">
            Localização <span className="optional-label">opcional</span>
          </label>
          <div className="location-input-group">
            <input
              id="location"
              ref={locationInputRef}
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Digite o endereço ou nome do local..."
              className="checkin-input"
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              className="btn-location"
              title="Usar localização atual"
              disabled={isLocating}
            >
              {isLocating ? (
                <CircleNotch size={20} weight="bold" className="spin" />
              ) : (
                <Crosshair size={20} weight="bold" />
              )}
            </button>
          </div>
          
          {/* Mapa do Google Maps */}
          <div className="map-container">
            <div ref={mapRef} className="google-map"></div>
            {(!locationLat || !locationLng) && (
              <div className="map-placeholder">
                <MapPin size={48} weight="regular" />
                <p>Use o botão de localização ou digite um endereço para ver no mapa</p>
              </div>
            )}
          </div>
        </div>

        <div className="checkin-section">
          <label className="checkin-section-label">
            Foto do Check-in <span className="optional-label">opcional</span>
          </label>
          <div className="photo-upload-section">
            {photoPreview ? (
              <div className="photo-preview-container">
                <img src={photoPreview} alt="Preview" className="photo-preview" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="btn-remove-photo"
                  title="Remover foto"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            ) : (
              <div className="photo-upload-buttons">
                <label htmlFor="photo-upload" className="btn-upload-photo">
                  <UploadSimple size={20} weight="bold" />
                  Carregar Foto
                </label>
                <input
                  id="photo-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="photo-camera" className="btn-upload-photo">
                  <Camera size={20} weight="bold" />
                  Tirar Foto
                </label>
                <input
                  id="photo-camera"
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!adherence || saving}
          className="checkin-submit-btn"
        >
          {saving ? 'Salvando...' : todayCheckIn ? 'Atualizar Check-in' : 'Registrar Check-in'}
        </button>
      </form>
    </div>
  )
}

export default DailyCheckIn
