import { useState, useEffect, useRef } from 'react'
import { Modal } from './ui'
import { API_URL } from '../config/api'
import './GroupCheckInModal.css'

const ACTIVITY_TYPES = [
  { label: 'Musculação', icon: '🏋️' },
  { label: 'Corrida', icon: '🏃' },
  { label: 'Caminhada', icon: '🚶' },
  { label: 'Natação', icon: '🏊' },
  { label: 'Ciclismo', icon: '🚴' },
  { label: 'Yoga', icon: '🧘' },
  { label: 'Pilates', icon: '🤸' },
  { label: 'Crossfit', icon: '💥' },
  { label: 'Funcional', icon: '🦵' },
  { label: 'Dança', icon: '💃' },
  { label: 'Boxe', icon: '🥊' },
  { label: 'Jiu-Jitsu', icon: '🥋' },
  { label: 'Futebol', icon: '⚽' },
  { label: 'Basquete', icon: '🏀' },
  { label: 'Vôlei', icon: '🏐' },
  { label: 'Tênis', icon: '🎾' },
  { label: 'Outro', icon: '✨' }
]

function GroupCheckInModal({ isOpen, onClose, grupoId, onCreated }) {
  const [photoUrl, setPhotoUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activity, setActivity] = useState('')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [calories, setCalories] = useState('')
  const [steps, setSteps] = useState('')
  const [treinoExecutadoId, setTreinoExecutadoId] = useState('')
  const [treinosExecutados, setTreinosExecutados] = useState([])
  
  // Localização
  const [locationName, setLocationName] = useState('')
  const [locationLat, setLocationLat] = useState(null)
  const [locationLng, setLocationLng] = useState(null)
  const [placeSuggestions, setPlaceSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [mapError, setMapError] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const locationInputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // Carregar treinos executados recentes
  useEffect(() => {
    if (isOpen) {
      loadRecentWorkouts()
    }
  }, [isOpen])

  // Obter localização atual
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      getCurrentLocation()
    }
  }, [isOpen])

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  const loadRecentWorkouts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/treinos-executados/recent?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTreinosExecutados(data.treinosExecutados || [])
      }
    } catch (error) {
      console.error('Erro ao carregar treinos:', error)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError(true)
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setCurrentLocation({ lat, lng })
        setLocationLat(lat)
        setLocationLng(lng)
        setLocationName('Local atual')
        setMapError(false)
        setLocationLoading(false)
      },
      (error) => {
        console.error('Erro ao obter localização:', error)
        setLocationLoading(false)
        setMapError(true)
      },
      { timeout: 20000, enableHighAccuracy: true, maximumAge: 5000 }
    )
  }

  const handleLocationSearch = async (value) => {
    setLocationName(value)
    setShowSuggestions(false)

    if (value.length < 2) {
      setPlaceSuggestions([])
      return
    }

    // Debounce
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token')
        const params = new URLSearchParams({ input: value })
        
        if (currentLocation) {
          params.append('lat', currentLocation.lat)
          params.append('lng', currentLocation.lng)
        }

        const response = await fetch(`${API_URL}/places/autocomplete?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setPlaceSuggestions(data.predictions || [])
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Erro ao buscar lugares:', error)
      }
    }, 300)
  }

  const handleSelectPlace = async (prediction) => {
    setLocationName(prediction.description)
    setShowSuggestions(false)

    try {
      const token = localStorage.getItem('token')
      const placeId = prediction.placeId

      // Se for OSM, usar coordenadas diretamente
      if (placeId.startsWith('osm_')) {
        if (prediction.location) {
          setLocationLat(prediction.location.lat)
          setLocationLng(prediction.location.lng)
        }
        return
      }

      // Buscar detalhes do Google Places
      const response = await fetch(`${API_URL}/places/details?placeId=${placeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setLocationName(data.name || prediction.description)
        if (data.location) {
          setLocationLat(data.location.lat)
          setLocationLng(data.location.lng)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do lugar:', error)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo de 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoUrl(reader.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/groups/${grupoId}/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          photoUrl: photoUrl || null,
          title: title.trim() || null,
          description: description.trim() || null,
          locationName: locationName.trim() || null,
          locationLat,
          locationLng,
          activity: activity || null,
          duration: duration ? parseInt(duration) : null,
          distance: distance ? parseFloat(distance) : null,
          calories: calories ? parseInt(calories) : null,
          steps: steps ? parseInt(steps) : null,
          treinoExecutadoId: treinoExecutadoId || null
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar check-in')
      }

      // Limpar formulário
      setPhotoUrl('')
      setTitle('')
      setDescription('')
      setActivity('')
      setDuration('')
      setDistance('')
      setCalories('')
      setSteps('')
      setTreinoExecutadoId('')
      setLocationName('')
      setLocationLat(null)
      setLocationLng(null)
      setCurrentLocation(null)

      if (onCreated) {
        onCreated()
      }
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Erro ao criar check-in:', error)
      setError(error.message || 'Erro ao criar check-in')
    } finally {
      setSaving(false)
    }
  }

  const mapUrl = locationLat && locationLng
    ? `${API_URL}/places/static-map?lat=${locationLat}&lng=${locationLng}&zoom=15&size=600x300&markers=true&ts=${Date.now()}`
    : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Check-in"
      subtitle="Compartilhe seu treino com o grupo"
      size="lg"
      closeOnOverlay={false}
      className="lifefit-modal--scroll-body"
      footer={(
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="checkin-form"
            className="btn-primary"
            disabled={saving || !photoUrl}
          >
            {saving ? 'Salvando...' : 'Publicar'}
          </button>
        </>
      )}
    >
      <form id="checkin-form" onSubmit={handleSubmit} className="group-checkin-form">
        {error && (
          <div className="group-checkin-error">{error}</div>
        )}

        {/* Foto */}
        <div className="group-checkin-photo-section">
          <label className="group-checkin-photo-label">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="group-checkin-photo-input"
            />
            {photoUrl ? (
              <div className="group-checkin-photo-preview">
                <img src={photoUrl} alt="Preview" />
                <button
                  type="button"
                  className="group-checkin-photo-remove"
                  onClick={() => setPhotoUrl('')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="group-checkin-photo-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="M21 15l-5-5L5 21"></path>
                </svg>
                <span>Adicionar foto</span>
              </div>
            )}
          </label>
        </div>

        {/* Título */}
        <div className="group-checkin-field">
          <label>
            Título <span className="optional">(opcional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Treino de pernas incrível!"
            maxLength={100}
            autoFocus
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Descrição */}
        <div className="group-checkin-field">
          <label>
            Descrição <span className="optional">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Conte como foi seu treino..."
            rows={3}
            maxLength={500}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Atividade */}
          <div className="group-checkin-field">
            <label>
              Tipo de atividade <span className="optional">(opcional)</span>
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              style={{ fontSize: '16px' }}
            >
              <option value="">Selecione...</option>
              {ACTIVITY_TYPES.map(type => (
                <option key={type.label} value={type.label}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

        {/* Treino executado */}
        {treinosExecutados.length > 0 && (
          <div className="group-checkin-field">
            <label>
              Vincular a um treino <span className="optional">(opcional)</span>
            </label>
            <select
              value={treinoExecutadoId}
              onChange={(e) => setTreinoExecutadoId(e.target.value)}
              style={{ fontSize: '16px' }}
            >
              <option value="">Nenhum</option>
              {treinosExecutados.map(treino => (
                <option key={treino.id} value={treino.id}>
                  {treino.prescricao?.nome} - {treino.divisao?.nome} ({new Date(treino.updatedAt).toLocaleDateString('pt-BR')})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Localização */}
        <div className="group-checkin-field">
          <label>
            Localização <span className="optional">(opcional)</span>
          </label>
          <div className="group-checkin-location-wrapper">
            <div className="location-row">
              <input
                ref={locationInputRef}
                type="text"
                value={locationName}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Buscar local (ex: Smart Fit, academia...)"
                style={{ fontSize: '16px' }}
              />
              <button
                type="button"
                className="btn-use-location"
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? 'Buscando...' : 'Usar localização atual'}
              </button>
            </div>
            {locationLoading && (
              <div className="group-checkin-location-loading">📍</div>
            )}
            {showSuggestions && placeSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="group-checkin-suggestions">
                {placeSuggestions.map((prediction, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="group-checkin-suggestion-item"
                    onClick={() => handleSelectPlace(prediction)}
                  >
                    <div className="suggestion-main">{prediction.structured_formatting?.main_text || prediction.description.split(',')[0]}</div>
                    {prediction.structured_formatting?.secondary_text && (
                      <div className="suggestion-secondary">{prediction.structured_formatting.secondary_text}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {mapUrl && (
            <div className="group-checkin-map-preview">
              {!mapError ? (
                <img
                  src={mapUrl}
                  alt="Mapa"
                  onError={() => setMapError(true)}
                />
              ) : (
                <div className="group-checkin-map-fallback">
                  <span>Não foi possível carregar o mapa.</span>
                  <button type="button" onClick={() => setMapError(false)}>
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Métricas */}
        <div className="group-checkin-metrics">
          <h3>Métricas <span className="optional">(opcional)</span></h3>
          <div className="group-checkin-metrics-grid">
            <div className="group-checkin-metric">
              <label>Duração (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                min="1"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="group-checkin-metric">
              <label>Distância (km)</label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="5.0"
                step="0.1"
                min="0"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="group-checkin-metric">
              <label>Calorias</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="300"
                min="0"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="group-checkin-metric">
              <label>Passos</label>
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="5000"
                min="0"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default GroupCheckInModal
