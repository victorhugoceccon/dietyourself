import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './DailySummary.css'

function DailySummary({ refreshTrigger }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [diet, setDiet] = useState(null)

  useEffect(() => {
    loadSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const loadSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Buscar estatísticas do dia
      const statsResponse = await fetch(`${API_URL}/consumed-meals/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Buscar dieta para saber quantas refeições tem
      const dietResponse = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setSummary(statsData)
      }

      if (dietResponse.ok) {
        const dietData = await dietResponse.json()
        if (dietData.dieta) {
          setDiet(dietData.dieta)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar resumo do dia:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="daily-summary">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  if (!diet || !diet.refeicoes) {
    return null
  }

  const totalMeals = diet.refeicoes.length
  const consumedMeals = summary?.consumedMeals?.length || 0
  const mealsPercentage = totalMeals > 0 ? Math.round((consumedMeals / totalMeals) * 100) : 0

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const getNextMeal = () => {
    if (!diet?.refeicoes) return null
    
    const consumedIndices = summary?.consumedMeals || []
    const nextMeal = diet.refeicoes.find((_, index) => !consumedIndices.includes(index))
    
    return nextMeal ? {
      name: nextMeal.nome,
      index: diet.refeicoes.indexOf(nextMeal),
      kcal: nextMeal.totalRefeicaoKcal
    } : null
  }

  const nextMeal = getNextMeal()

  return (
    <div className="daily-summary">
      <div className="summary-header">
        <h2>{getTimeOfDay()}</h2>
        <p className="summary-subtitle">Seu progresso de hoje</p>
      </div>

      <div className="summary-cards">
        <div className="summary-card meals-card">
          <div className="card-icon">🍽️</div>
          <div className="card-content">
            <div className="card-value">{consumedMeals}/{totalMeals}</div>
            <div className="card-label">Refeições registradas</div>
            <div className="card-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${mealsPercentage}%`,
                    backgroundColor: mealsPercentage >= 80 ? '#4CAF50' : mealsPercentage >= 50 ? '#FF9800' : '#F44336'
                  }}
                ></div>
              </div>
              <span className="progress-text">{mealsPercentage}%</span>
            </div>
          </div>
        </div>

        {summary?.totals && (
          <>
            <div className="summary-card calories-card">
              <div className="card-icon">⚡</div>
              <div className="card-content">
                <div className="card-value">{Math.round(summary.totals.consumedKcal || 0)}</div>
                <div className="card-label">kcal Consumidas</div>
              </div>
            </div>

            <div className="summary-card protein-card">
              <div className="card-icon">💪</div>
              <div className="card-content">
                <div className="card-value">{Math.round(summary.totals.consumedProtein || 0)}g</div>
                <div className="card-label">Proteína</div>
              </div>
            </div>
          </>
        )}
      </div>

      {nextMeal && (
        <div className="next-meal-card">
          <div className="next-meal-header">
            <span className="next-meal-icon">⏭️</span>
            <span className="next-meal-label">Próxima refeição</span>
          </div>
          <div className="next-meal-content">
            <h3>{nextMeal.name}</h3>
            <p>{nextMeal.kcal} kcal</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DailySummary




