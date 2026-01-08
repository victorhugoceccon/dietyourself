import { useState, useEffect, useMemo } from 'react'
import { API_URL } from '../config/api'
import './NextMealWidget.css'

/**
 * NextMealWidget - Mostra a próxima refeição do dia que ainda não foi consumida.
 */
function NextMealWidget({ refreshTrigger }) {
  const [dieta, setDieta] = useState(null)
  const [consumedMeals, setConsumedMeals] = useState([])
  const [loading, setLoading] = useState(true)

  // Carregar dieta e refeições consumidas
  useEffect(() => {
    loadDieta()
    loadConsumedMeals()
  }, [refreshTrigger])

  // Atualizar refeições consumidas periodicamente (a cada 30 segundos)
  // e quando a janela ganha foco (usuário volta para a aba)
  useEffect(() => {
    const interval = setInterval(() => {
      loadConsumedMeals()
    }, 30000) // 30 segundos

    const handleFocus = () => {
      loadConsumedMeals()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadDieta = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/diet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.dieta) {
          // Processar estrutura da dieta
          let dietaData = data.dieta.dieta || data.dieta
          if (dietaData.refeicoes) {
            setDieta(dietaData)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dieta:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConsumedMeals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/consumed-meals/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Converter array de objetos para array de índices
        const mealIndices = (data.consumedMeals || []).map(cm => cm.mealIndex)
        setConsumedMeals(mealIndices)
      }
    } catch (error) {
      console.error('Erro ao carregar refeições consumidas:', error)
    }
  }

  // Encontrar a primeira refeição não consumida do dia
  const nextMeal = useMemo(() => {
    if (!dieta?.refeicoes) return null
    
    // Encontrar a primeira refeição que ainda não foi consumida
    for (let i = 0; i < dieta.refeicoes.length; i++) {
      if (!consumedMeals.includes(i)) {
        return {
          ...dieta.refeicoes[i],
          mealIndex: i
        }
      }
    }
    
    // Se todas foram consumidas, retornar null ou a primeira (dependendo do comportamento desejado)
    // Por enquanto, retornamos null para indicar que todas foram consumidas
    return null
  }, [dieta, consumedMeals])

  if (loading) {
    return (
      <div className="next-meal-widget next-meal-widget--loading">
        <div className="next-meal-skeleton">
          <div className="skeleton-circle" />
          <div className="skeleton-content">
            <div className="skeleton-line" style={{ width: '60%' }} />
            <div className="skeleton-line" style={{ width: '40%' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!nextMeal) {
    // Verificar se não tem dieta ou se todas as refeições foram consumidas
    const allMealsConsumed = dieta?.refeicoes && consumedMeals.length === dieta.refeicoes.length
    
    return (
      <div className="next-meal-widget next-meal-widget--empty">
        <div className="next-meal-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <p className="next-meal-empty-text">
          {allMealsConsumed 
            ? 'Todas as refeições do dia foram consumidas! 🎉' 
            : 'Nenhuma dieta cadastrada'}
        </p>
      </div>
    )
  }

  return (
    <div className="next-meal-widget next-meal-widget--normal">
      {/* Meal Info */}
      <div className="next-meal-content">
        <div className="next-meal-header">
          <h3 className="next-meal-title">{nextMeal.nome}</h3>
        </div>

        <div className="next-meal-kcal">
          <span className="kcal-value">{nextMeal.totalRefeicaoKcal || 0}</span>
          <span className="kcal-label">kcal</span>
        </div>

        {/* Lista de itens (primeiros 3) */}
        {nextMeal.itens && nextMeal.itens.length > 0 && (
          <div className="next-meal-items">
            {nextMeal.itens.slice(0, 3).map((item, idx) => (
              <div key={idx} className="next-meal-item">
                <span className="item-bullet">•</span>
                <span className="item-name">{item.alimento}</span>
                <span className="item-portion">{item.porcao}</span>
              </div>
            ))}
            {nextMeal.itens.length > 3 && (
              <div className="next-meal-more">
                +{nextMeal.itens.length - 3} {nextMeal.itens.length - 3 === 1 ? 'item' : 'itens'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Macros Mini */}
      {nextMeal.itens && (
        <div className="next-meal-macros">
          <div className="macro-mini macro-protein">
            <span className="macro-value">
              {nextMeal.itens.reduce((sum, item) => sum + (item.macros?.proteina_g || 0), 0).toFixed(0)}g
            </span>
            <span className="macro-label">P</span>
          </div>
          <div className="macro-mini macro-carbs">
            <span className="macro-value">
              {nextMeal.itens.reduce((sum, item) => sum + (item.macros?.carbo_g || 0), 0).toFixed(0)}g
            </span>
            <span className="macro-label">C</span>
          </div>
          <div className="macro-mini macro-fat">
            <span className="macro-value">
              {nextMeal.itens.reduce((sum, item) => sum + (item.macros?.gordura_g || 0), 0).toFixed(0)}g
            </span>
            <span className="macro-label">G</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default NextMealWidget


