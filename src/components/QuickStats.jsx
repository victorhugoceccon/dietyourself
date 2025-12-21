import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './QuickStats.css'

function QuickStats({ refreshTrigger }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [questionnaireData, setQuestionnaireData] = useState(null)

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Buscar estatísticas de check-in
      const checkInResponse = await fetch(`${API_URL}/checkin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Buscar dados do questionário para objetivo
      const questionnaireResponse = await fetch(`${API_URL}/questionnaire/check`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (checkInResponse.ok) {
        const data = await checkInResponse.json()
        setStats(data.stats)
      }

      if (questionnaireResponse.ok) {
        const data = await questionnaireResponse.json()
        if (data.data) {
          setQuestionnaireData(data.data)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="quick-stats">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  const currentStreak = stats?.currentStreak || 0
  const weeklyAdherence = stats?.weekly?.adherenceRate || 0
  const objective = questionnaireData?.objetivo || 'Não definido'

  const getObjectiveIcon = () => {
    switch (objective) {
      case 'Emagrecer':
        return '📉'
      case 'Ganhar massa muscular':
        return '💪'
      case 'Manter peso':
        return '⚖️'
      default:
        return '🎯'
    }
  }

  return (
    <div className="quick-stats">
      <div className="stats-grid">
        <div className="stat-card streak-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{currentStreak}</div>
            <div className="stat-label">Dias de constância</div>
            {currentStreak > 0 && (
              <div className="stat-hint">Você manteve sua constância hoje</div>
            )}
          </div>
        </div>

        <div className="stat-card adherence-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(weeklyAdherence)}%</div>
            <div className="stat-label">Aderência Semanal</div>
            <div className="stat-hint">Últimos 7 dias</div>
          </div>
        </div>

        <div className="stat-card objective-card">
          <div className="stat-icon">{getObjectiveIcon()}</div>
          <div className="stat-content">
            <div className="stat-value-text">{objective}</div>
            <div className="stat-label">Seu objetivo</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickStats




