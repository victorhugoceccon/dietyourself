import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import './EstadoDoDia.css'

function EstadoDoDia({ refreshTrigger }) {
  const [dayStatus, setDayStatus] = useState(null)
  const [nextAction, setNextAction] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDayStatus()
  }, [refreshTrigger])

  const loadDayStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Buscar estatísticas do dia
      const statsResponse = await fetch(`${API_URL}/consumed-meals/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Buscar dieta
      const dietResponse = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (statsResponse.ok && dietResponse.ok) {
        const statsData = await statsResponse.json()
        const dietData = await dietResponse.json()
        
        const consumedMeals = statsData.consumedMeals || []
        const totalMeals = dietData.dieta?.refeicoes?.length || 0
        const consumedKcal = statsData.totals?.consumedKcal || 0
        const totalKcal = dietData.nutritionalNeeds?.calorias || 0
        
        // Calcular status geral
        const mealsProgress = totalMeals > 0 ? (consumedMeals.length / totalMeals) * 100 : 0
        const caloriesProgress = totalKcal > 0 ? (consumedKcal / totalKcal) * 100 : 0
        const overallProgress = (mealsProgress + caloriesProgress) / 2

        // Determinar status do dia
        let status = 'iniciando'
        let statusMessage = 'Seu progresso começa com o primeiro registro.'
        let statusColor = 'var(--lifefit-blue-gray)'
        
        if (overallProgress >= 80) {
          status = 'excelente'
          statusMessage = 'Você manteve sua constância hoje. Continue assim!'
          statusColor = '#90c22c'
        } else if (overallProgress >= 50) {
          status = 'bom'
          statusMessage = 'Bom progresso! Você está no caminho certo.'
          statusColor = 'var(--lifefit-green-olive)'
        } else if (overallProgress > 0) {
          status = 'em-andamento'
          statusMessage = 'Um passo de cada vez. Você está fazendo acontecer.'
          statusColor = 'var(--lifefit-warning)'
        }

        setDayStatus({
          status,
          message: statusMessage,
          color: statusColor,
          progress: overallProgress
        })

        // Determinar próxima ação
        const nextMealIndex = dietData.dieta?.refeicoes?.findIndex((_, idx) => !consumedMeals.includes(idx))
        if (nextMealIndex !== undefined && nextMealIndex !== -1) {
          const nextMeal = dietData.dieta.refeicoes[nextMealIndex]
          setNextAction({
            type: 'meal',
            title: 'Registrar refeição',
            description: nextMeal.nome,
            action: () => navigate('/paciente/dieta')
          })
        } else if (consumedMeals.length === 0) {
          setNextAction({
            type: 'start',
            title: 'Começar o dia',
            description: 'Registre sua primeira refeição',
            action: () => navigate('/paciente/dieta')
          })
        } else {
          setNextAction({
            type: 'maintain',
            title: 'Manter constância',
            description: 'Você está no caminho certo',
            action: null
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status do dia:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="estado-do-dia">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const getMotivationalMessage = () => {
    const messages = [
      'Hoje, foque no simples',
      'Um passo de cada vez',
      'Menos esforço. Mais constância.',
      'Seu corpo, no seu ritmo',
      'Faça o que cabe na sua rotina'
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  return (
    <div className="estado-do-dia">
      <div className="day-status-card">
        <div className="status-header">
          <h2 className="status-title">Seu dia no LifeFit</h2>
          <div className="status-badge" style={{ backgroundColor: dayStatus?.color || 'var(--lifefit-blue-gray)' }}>
            {dayStatus?.status === 'excelente' && '✨ Excelente'}
            {dayStatus?.status === 'bom' && '👍 Bom'}
            {dayStatus?.status === 'em-andamento' && '🌱 Em andamento'}
            {dayStatus?.status === 'iniciando' && '🚀 Começando'}
          </div>
        </div>
        
        <div className="status-content">
          <p className="status-message">{dayStatus?.message || 'Seu progresso começa com o primeiro registro.'}</p>
          <p className="motivational-message">{getMotivationalMessage()}</p>
        </div>
      </div>

      {nextAction && (
        <div className="next-action-card" onClick={nextAction.action || undefined}>
          <div className="action-icon">
            {nextAction.type === 'meal' && '🍽️'}
            {nextAction.type === 'start' && '✨'}
            {nextAction.type === 'maintain' && '💚'}
          </div>
          <div className="action-content">
            <h3 className="action-title">{nextAction.title}</h3>
            <p className="action-description">{nextAction.description}</p>
          </div>
          {nextAction.action && (
            <div className="action-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EstadoDoDia




