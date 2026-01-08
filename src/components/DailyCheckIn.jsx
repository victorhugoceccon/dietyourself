<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react'
import { API_URL, loadGoogleMapsScript } from '../config/api'
=======
import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
import './DailyCheckIn.css'

function DailyCheckIn({ onCheckInComplete }) {
  const [adherence, setAdherence] = useState(null)
  const [pesoAtual, setPesoAtual] = useState('')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
<<<<<<< HEAD
  
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
=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e

  useEffect(() => {
    loadTodayCheckIn()
  }, [])

<<<<<<< HEAD
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

=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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
<<<<<<< HEAD
          setLocationName(data.checkIn.locationName || '')
          const lat = data.checkIn.locationLat || null
          const lng = data.checkIn.locationLng || null
          setLocationLat(lat)
          setLocationLng(lng)
          setPhotoUrl(data.checkIn.photoUrl || null)
          setPhotoPreview(data.checkIn.photoUrl || null)
          
          // Atualizar mapa se houver localização
          if (lat && lng) {
            loadGoogleMapsScript(() => {
              setTimeout(() => {
                updateMap(lat, lng)
              }, 500)
            })
          }
=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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
<<<<<<< HEAD
          observacao: observacao.trim() || null,
          locationName: locationName.trim() || null,
          locationLat: locationLat || null,
          locationLng: locationLng || null,
          photoUrl: photoUrl || null
=======
          observacao: observacao.trim() || null
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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

<<<<<<< HEAD
  // Função para obter localização atual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador')
      return
    }

    // Mostrar loading
    const loadingBtn = document.querySelector('.btn-location')
    if (loadingBtn) {
      loadingBtn.disabled = true
      loadingBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"><animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/></path></svg>'
    }

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

        // Restaurar botão
        if (loadingBtn) {
          loadingBtn.disabled = false
          loadingBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4 12H2M6.314 12.314l-2.828 2.828M17.686 12.314l2.828 2.828M2 12h2M20 12h2M6.314 11.686l-2.828-2.828M17.686 11.686l2.828-2.828"/><circle cx="12" cy="12" r="3"/></svg>'
        }
      },
      (error) => {
        console.error('Erro ao obter localização:', error)
        alert('Erro ao obter localização. Verifique as permissões do navegador.')
        
        // Restaurar botão
        if (loadingBtn) {
          loadingBtn.disabled = false
          loadingBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4 12H2M6.314 12.314l-2.828 2.828M17.686 12.314l2.828 2.828M2 12h2M20 12h2M6.314 11.686l-2.828-2.828M17.686 11.686l2.828-2.828"/><circle cx="12" cy="12" r="3"/></svg>'
        }
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

=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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
          <span className="success-icon">✓</span>
          <span>Check-in registrado com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="checkin-form">
        <div className="checkin-section">
          <label className="checkin-section-label">
            Como foi a adesão à dieta hoje? *
          </label>
          <div className="adherence-options">
            <button
              type="button"
              onClick={() => setAdherence('TOTAL')}
              className={`adherence-btn ${adherence === 'TOTAL' ? 'selected' : ''}`}
            >
              <span className="adherence-emoji">✅</span>
              <span className="adherence-label">Segui totalmente</span>
            </button>
            <button
              type="button"
              onClick={() => setAdherence('PARCIAL')}
              className={`adherence-btn ${adherence === 'PARCIAL' ? 'selected' : ''}`}
            >
              <span className="adherence-emoji">⚡</span>
              <span className="adherence-label">Segui parcialmente</span>
            </button>
            <button
              type="button"
              onClick={() => setAdherence('NAO_SEGUIU')}
              className={`adherence-btn ${adherence === 'NAO_SEGUIU' ? 'selected' : ''}`}
            >
              <span className="adherence-emoji">🔄</span>
              <span className="adherence-label">Não segui</span>
            </button>
          </div>
        </div>

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

<<<<<<< HEAD
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
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4 12H2M6.314 12.314l-2.828 2.828M17.686 12.314l2.828 2.828M2 12h2M20 12h2M6.314 11.686l-2.828-2.828M17.686 11.686l2.828-2.828"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          
          {/* Mapa do Google Maps */}
          <div className="map-container">
            <div ref={mapRef} className="google-map"></div>
            {(!locationLat || !locationLng) && (
              <div className="map-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
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
                  ×
                </button>
              </div>
            ) : (
              <div className="photo-upload-buttons">
                <label htmlFor="photo-upload" className="btn-upload-photo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
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

=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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


