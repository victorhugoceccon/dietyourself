import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './WeeklyAdherence.css'

function WeeklyAdherence({ refreshTrigger }) {
  const [stats, setStats] = useState(null)
  const [insights, setInsights] = useState([])
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
        setInsights(data.insights || [])
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
    if (percentage >= 80) return '#4CAF50'
    if (percentage >= 60) return '#FF9800'
    return '#F44336'
  }

  const getAdherenceMessage = (percentage) => {
    if (percentage >= 80) {
      return {
        message: 'Você está no caminho certo para alcançar seus objetivos!',
        emoji: '🎯',
        color: '#4CAF50'
      }
    }
    if (percentage >= 60) {
      return {
        message: 'Boa adesão! Continue assim e você verá resultados consistentes.',
        emoji: '💪',
        color: '#FF9800'
      }
    }
    if (percentage > 0) {
      return {
        message: 'Cada dia é uma nova oportunidade. Pequenos passos levam a grandes mudanças.',
        emoji: '🌱',
        color: '#F44336'
      }
    }
    return {
      message: 'Comece registrando seus check-ins diários para acompanhar seu progresso.',
      emoji: '✨',
      color: '#999'
    }
  }

  const getStreakMessage = () => {
    if (!stats || stats.currentStreak === 0) return null
    
    if (stats.currentStreak >= 7) {
      return { 
        message: `${stats.currentStreak} dias seguidos!`, 
        emoji: '🔥', 
        color: '#FF6B35',
        description: 'Sequência incrível! Você está criando um hábito sólido.'
      }
    }
    if (stats.currentStreak >= 3) {
      return { 
        message: `${stats.currentStreak} dias seguidos!`, 
        emoji: '💪', 
        color: '#4CAF50',
        description: 'Ótimo! Mantenha essa consistência.'
      }
    }
    return { 
      message: `${stats.currentStreak} dia${stats.currentStreak > 1 ? 's' : ''} seguido${stats.currentStreak > 1 ? 's' : ''}!`, 
      emoji: '✨', 
      color: '#66BB6A',
      description: 'Continue assim!'
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

  const getAdherenceIcon = (adherence) => {
    switch (adherence) {
      case 'TOTAL':
        return { emoji: '✅', label: 'Total', color: '#4CAF50' }
      case 'PARCIAL':
        return { emoji: '⚡', label: 'Parcial', color: '#FF9800' }
      case 'NAO_SEGUIU':
        return { emoji: '🔄', label: 'Não seguiu', color: '#F44336' }
      default:
        return { emoji: '⏸️', label: 'Sem registro', color: '#999' }
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
  const adherenceMessage = getAdherenceMessage(adherencePercentage)

  return (
    <div className="weekly-adherence-card">
      <div className="adherence-header">
        <h3 className="adherence-title">Aderência Semanal</h3>
        <p className="adherence-subtitle">Últimos 7 dias</p>
      </div>

      {stats && stats.weekly.total > 0 ? (
        <>
          {/* Indicador visual interativo */}
          <div 
            className="adherence-circle-container"
            onClick={() => setShowDailyDetail(!showDailyDetail)}
            style={{ cursor: 'pointer' }}
            title="Clique para ver detalhamento diário"
          >
            <div 
              className="adherence-circle"
              style={{ 
                background: `conic-gradient(${getAdherenceColor(adherencePercentage)} ${adherencePercentage * 3.6}deg, #e0e0e0 ${adherencePercentage * 3.6}deg)`
              }}
            >
              <div className="adherence-circle-inner">
                <span className="adherence-percentage">{Math.round(adherencePercentage)}%</span>
                <span className="adherence-label-small">de adesão</span>
                <span className="adherence-click-hint">👆 Ver detalhes</span>
              </div>
            </div>
          </div>

          {/* Micro explicação sobre impacto */}
          <div className="adherence-impact" style={{ borderLeftColor: adherenceMessage.color }}>
            <span className="impact-emoji">{adherenceMessage.emoji}</span>
            <p className="impact-message">{adherenceMessage.message}</p>
          </div>

          {/* Breakdown resumido */}
          <div className="adherence-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-emoji">✅</span>
              <span className="breakdown-label">Total:</span>
              <span className="breakdown-value">{stats.weekly.totalAdherence}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-emoji">⚡</span>
              <span className="breakdown-label">Parcial:</span>
              <span className="breakdown-value">{stats.weekly.parcialAdherence}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-emoji">🔄</span>
              <span className="breakdown-label">Não seguiu:</span>
              <span className="breakdown-value">{stats.weekly.naoSeguiu}</span>
            </div>
          </div>

          {/* Streak destacado */}
          {streakInfo && (
            <div className="streak-badge" style={{ borderColor: streakInfo.color, backgroundColor: `${streakInfo.color}15` }}>
              <span className="streak-emoji">{streakInfo.emoji}</span>
              <div className="streak-content">
                <span className="streak-text">{streakInfo.message}</span>
                <span className="streak-description">{streakInfo.description}</span>
              </div>
            </div>
          )}

          {/* Detalhamento diário (expandido) */}
          {showDailyDetail && (
            <div className="daily-detail">
              <h4 className="daily-detail-title">Detalhamento Diário</h4>
              <div className="daily-list">
                {dailyCheckIns.length > 0 ? (
                  dailyCheckIns.map((checkIn, index) => {
                    const adherenceInfo = getAdherenceIcon(checkIn.adherence)
                    return (
                      <div key={index} className="daily-item" style={{ borderLeftColor: adherenceInfo.color }}>
                        <div className="daily-date">
                          <span className="daily-day">{getDayLabel(checkIn.checkInDate)}</span>
                          <span className="daily-date-full">
                            {new Date(checkIn.checkInDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <div className="daily-adherence" style={{ color: adherenceInfo.color }}>
                          <span className="daily-emoji">{adherenceInfo.emoji}</span>
                          <span className="daily-label">{adherenceInfo.label}</span>
                        </div>
                        {checkIn.pesoAtual && (
                          <div className="daily-weight">
                            <span className="daily-weight-label">Peso:</span>
                            <span className="daily-weight-value">{checkIn.pesoAtual} kg</span>
                          </div>
                        )}
                        {checkIn.observacao && (
                          <div className="daily-note">
                            <span className="daily-note-text">"{checkIn.observacao}"</span>
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
          <p>Nenhum check-in esta semana ainda.</p>
          <p className="adherence-empty-hint">Registre seus check-ins diários para ver sua adesão!</p>
        </div>
      )}

      {insights.length > 0 && (
        <div className="adherence-insights">
          {insights
            // Filtrar insights duplicados - se a mensagem principal já foi mostrada, não repetir
            .filter(insight => {
              // Se for mensagem de "excelente adesão" e já foi mostrada na seção impact, remover
              const isDuplicated = insight.message?.toLowerCase().includes('excelente adesão') && 
                                  adherenceMessage.message.toLowerCase().includes('excelente adesão')
              return !isDuplicated
            })
            .map((insight, index) => (
              <div key={index} className={`insight-item insight-${insight.type}`}>
                <span className="insight-emoji">{insight.emoji}</span>
                <span className="insight-message">{insight.message}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default WeeklyAdherence
