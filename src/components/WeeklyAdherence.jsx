import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './WeeklyAdherence.css'

function WeeklyAdherence({ refreshTrigger }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDailyDetail, setShowDailyDetail] = useState(false)
  const [dailyCheckIns, setDailyCheckIns] = useState([])

  useEffect(() => {
    loadStats()
    if (showDailyDetail) {
      loadDailyCheckIns()
    }
  }, [refreshTrigger, showDailyDetail])

  const loadStats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/checkin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDailyCheckIns = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/checkin?limit=7`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDailyCheckIns(data.checkIns || [])
      }
    } catch (error) {
      console.error('Erro ao carregar check-ins diários:', error)
    }
  }

  const getAdherencePercentage = () => {
    if (!stats || !stats.weekly || stats.weekly.total === 0) return 0
    return parseFloat(stats.weekly.adherenceRate || 0)
  }

  const getAdherenceColor = (percentage) => {
    if (percentage >= 80) return '#7A9B7D' // Verde suave
    if (percentage >= 60) return '#9FAF7D' // Verde oliva suave
    if (percentage >= 40) return '#B5C57D' // Verde claro
    return '#C5D5A0' // Verde muito suave
  }

  const getProgressMessage = (percentage) => {
    const messages = [
      { threshold: 80, text: 'Você está mantendo o ritmo', emoji: '🌿', subtext: 'Boa semana até aqui' },
      { threshold: 60, text: 'Você está construindo constância', emoji: '✨', subtext: 'Cada dia conta' },
      { threshold: 40, text: 'Você está no caminho', emoji: '🌱', subtext: 'Não precisa ser perfeito, só consistente' },
      { threshold: 20, text: 'Primeiro passo dado', emoji: '💚', subtext: 'Seu progresso começa aqui' },
      { threshold: 0, text: 'Começando sua jornada', emoji: '🌱', subtext: 'Cada dia conta' }
    ]

    for (const msg of messages) {
      if (percentage >= msg.threshold) {
        return msg
      }
    }
    return messages[messages.length - 1]
  }

  const getStreakMessage = () => {
    if (!stats || stats.currentStreak === 0) return null
    
    if (stats.currentStreak >= 7) {
      return { 
        message: 'Sequência sólida!', 
        emoji: '🔥', 
        subtext: `${stats.currentStreak} dias seguidos`,
        description: 'Você está criando um hábito. Parabéns!'
      }
    }
    if (stats.currentStreak >= 3) {
      return { 
        message: 'Sequência iniciada', 
        emoji: '💚', 
        subtext: `${stats.currentStreak} dias seguidos`,
        description: 'Continue assim! Cada dia conta.'
      }
    }
    return { 
      message: 'Primeiro passo dado', 
      emoji: '✨', 
      subtext: `${stats.currentStreak} dia${stats.currentStreak > 1 ? 's' : ''} seguido${stats.currentStreak > 1 ? 's' : ''}`,
      description: 'Você está construindo constância.'
    }
  }

  const getDayLabel = (date) => {
    const checkInDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    checkInDate.setHours(0, 0, 0, 0)
    const diffTime = today - checkInDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) {
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      return days[checkInDate.getDay()]
    }
    return checkInDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const getAdherenceInfo = (adherence) => {
    switch (adherence) {
      case 'TOTAL':
        return { 
          emoji: '✅', 
          label: 'Segui totalmente', 
          color: '#7A9B7D',
          description: 'Dia completo registrado'
        }
      case 'PARCIAL':
        return { 
          emoji: '⚡', 
          label: 'Segui parcialmente', 
          color: '#9FAF7D',
          description: 'Registro parcial também conta'
        }
      case 'NAO_SEGUIU':
        return { 
          emoji: '🔄', 
          label: 'Não segui hoje', 
          color: '#B5C57D',
          description: 'Amanhã é uma nova chance'
        }
      default:
        return { 
          emoji: '○', 
          label: 'Sem registro', 
          color: '#E0E0E0',
          description: 'Ainda não registrado'
        }
    }
  }

  if (loading) {
    return (
      <div className="weekly-adherence-card">
        <div className="adherence-loading">Carregando...</div>
      </div>
    )
  }

  const adherencePercentage = getAdherencePercentage()
  const streakInfo = getStreakMessage()
  const progressMessage = getProgressMessage(adherencePercentage)
  const adherenceColor = getAdherenceColor(adherencePercentage)

  return (
    <div className="weekly-adherence-card">
      <div className="adherence-header">
        <h2 className="adherence-title">Constância Semanal</h2>
        <p className="adherence-subtitle">Consistência acima de perfeição</p>
      </div>

      {stats && stats.weekly.total > 0 ? (
        <>
          {/* Indicador circular suavizado */}
          <div className="adherence-circle-wrapper">
            <div 
              className="adherence-circle"
              style={{ 
                background: `conic-gradient(${adherenceColor} ${adherencePercentage * 3.6}deg, #F5F5F5 ${adherencePercentage * 3.6}deg)`
              }}
            >
              <div className="adherence-circle-inner">
                <span className="adherence-emoji-large">{progressMessage.emoji}</span>
                <span className="adherence-message-main">{progressMessage.text}</span>
                <span className="adherence-message-sub">{progressMessage.subtext}</span>
                <span className="adherence-percentage-subtle">{Math.round(adherencePercentage)}%</span>
              </div>
            </div>
          </div>

          {/* Streak emocional */}
          {streakInfo && (
            <div className="streak-card">
              <div className="streak-icon-wrapper">
                <span className="streak-emoji">{streakInfo.emoji}</span>
              </div>
              <div className="streak-content">
                <h3 className="streak-title">{streakInfo.message}</h3>
                <p className="streak-subtext">{streakInfo.subtext}</p>
                <p className="streak-description">{streakInfo.description}</p>
              </div>
            </div>
          )}

          {/* Indicadores visuais simplificados */}
          <div className="adherence-indicators">
            <div className="indicator-item">
              <div className="indicator-icon" style={{ backgroundColor: '#7A9B7D15', borderColor: '#7A9B7D' }}>
                <span className="indicator-emoji">✅</span>
              </div>
              <div className="indicator-content">
                <span className="indicator-value">{stats.weekly.totalAdherence || 0}</span>
                <span className="indicator-label">Dias completos</span>
              </div>
            </div>
            <div className="indicator-item">
              <div className="indicator-icon" style={{ backgroundColor: '#9FAF7D15', borderColor: '#9FAF7D' }}>
                <span className="indicator-emoji">⚡</span>
              </div>
              <div className="indicator-content">
                <span className="indicator-value">{stats.weekly.parcialAdherence || 0}</span>
                <span className="indicator-label">Dias parciais</span>
              </div>
            </div>
            <div className="indicator-item">
              <div className="indicator-icon" style={{ backgroundColor: '#B5C57D15', borderColor: '#B5C57D' }}>
                <span className="indicator-emoji">🔄</span>
              </div>
              <div className="indicator-content">
                <span className="indicator-value">{stats.weekly.naoSeguiu || 0}</span>
                <span className="indicator-label">Sem registro</span>
              </div>
            </div>
          </div>

          {/* Microcopy LifeFit */}
          <div className="lifefit-message">
            <p className="lifefit-message-text">Cada dia conta. Você está construindo constância.</p>
          </div>

          {/* Detalhamento diário (opcional) */}
          <button 
            className="detail-toggle"
            onClick={() => setShowDailyDetail(!showDailyDetail)}
          >
            <span>{showDailyDetail ? 'Ocultar' : 'Ver'} detalhes da semana</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ transform: showDailyDetail ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showDailyDetail && (
            <div className="daily-detail">
              <div className="daily-list">
                {dailyCheckIns.length > 0 ? (
                  dailyCheckIns.map((checkIn, index) => {
                    const adherenceInfo = getAdherenceInfo(checkIn.adherence)
                    return (
                      <div key={index} className="daily-item">
                        <div className="daily-item-header">
                          <div className="daily-date-info">
                            <span className="daily-day">{getDayLabel(checkIn.checkInDate)}</span>
                            <span className="daily-date-full">
                              {new Date(checkIn.checkInDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                          <div className="daily-adherence-badge" style={{ backgroundColor: `${adherenceInfo.color}15`, borderColor: adherenceInfo.color }}>
                            <span className="daily-emoji">{adherenceInfo.emoji}</span>
                            <span className="daily-label">{adherenceInfo.label}</span>
                          </div>
                        </div>
                        {checkIn.pesoAtual && (
                          <div className="daily-weight">
                            <span className="daily-weight-value">{checkIn.pesoAtual} kg</span>
                          </div>
                        )}
                        {checkIn.observacao && (
                          <div className="daily-note">
                            <p className="daily-note-text">"{checkIn.observacao}"</p>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="daily-empty">Nenhum check-in registrado ainda esta semana.</p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="adherence-empty">
          <div className="empty-icon">🌱</div>
          <h3 className="empty-title">Seu progresso começa aqui</h3>
          <p className="adherence-empty-text">Registrar hoje já é um avanço. O LifeFit acompanha sua jornada desde o início, sem julgamento.</p>
          <p className="adherence-empty-hint">Cada dia conta. Você está construindo constância.</p>
        </div>
      )}
    </div>
  )
}

export default WeeklyAdherence
