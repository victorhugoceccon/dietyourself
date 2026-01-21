import { useState, useEffect } from 'react'
import { ArrowsClockwise, ChartLineUp, CheckCircle, Circle, Lightning } from '@phosphor-icons/react'
import { API_URL } from '../config/api'
import './ProgressTimeline.css'

function ProgressTimeline({ refreshTrigger }) {
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCheckIns()
  }, [refreshTrigger])

  const loadCheckIns = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/checkin?limit=30`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCheckIns(data.checkIns || [])
      }
    } catch (error) {
      console.error('Erro ao carregar check-ins:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAdherenceColor = (adherence) => {
    switch (adherence) {
      case 'TOTAL':
        return '#4CAF50'
      case 'PARCIAL':
        return '#FF9800'
      case 'NAO_SEGUIU':
        return '#F44336'
      default:
        return '#ccc'
    }
  }

  const getAdherenceIcon = (adherence) => {
    switch (adherence) {
      case 'TOTAL':
        return CheckCircle
      case 'PARCIAL':
        return Lightning
      case 'NAO_SEGUIU':
        return ArrowsClockwise
      default:
        return Circle
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const checkInDate = new Date(date)
    checkInDate.setHours(0, 0, 0, 0)

    const diffTime = today - checkInDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="progress-timeline-card">
        <div className="timeline-loading">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="progress-timeline-card">
      <div className="timeline-header">
        <h3 className="timeline-title">Seu progresso</h3>
        <p className="timeline-subtitle">Últimos 30 dias</p>
      </div>

      {checkIns.length === 0 ? (
        <div className="timeline-empty">
          <div className="empty-icon">
            <ChartLineUp size={24} weight="bold" />
          </div>
          <h3 className="empty-title">Seu progresso começa aqui</h3>
          <p className="timeline-empty-hint">Registrar hoje já é um avanço. O LifeFit acompanha sua jornada desde o início, sem julgamento.</p>
        </div>
      ) : (
        <div className="timeline-container">
          {checkIns.map((checkIn, index) => (
            <div key={checkIn.id} className="timeline-item">
              <div className="timeline-dot" style={{ backgroundColor: getAdherenceColor(checkIn.adherence) }}>
                <span className="timeline-emoji">
                  {(() => {
                    const Icon = getAdherenceIcon(checkIn.adherence)
                    return <Icon size={14} weight="fill" />
                  })()}
                </span>
              </div>
              {index < checkIns.length - 1 && (
                <div 
                  className="timeline-line" 
                  style={{ backgroundColor: getAdherenceColor(checkIn.adherence) }}
                />
              )}
              <div className="timeline-content">
                <div className="timeline-date">{formatDate(checkIn.checkInDate)}</div>
                <div className="timeline-adherence">
                  {checkIn.adherence === 'TOTAL' && 'Seguiu totalmente'}
                  {checkIn.adherence === 'PARCIAL' && 'Seguiu parcialmente'}
                  {checkIn.adherence === 'NAO_SEGUIU' && 'Não seguiu hoje'}
                </div>
                {checkIn.pesoAtual && (
                  <div className="timeline-weight">Peso: {checkIn.pesoAtual} kg</div>
                )}
                {checkIn.observacao && (
                  <div className="timeline-note">"{checkIn.observacao}"</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProgressTimeline


