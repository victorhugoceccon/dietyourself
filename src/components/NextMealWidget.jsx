import { useState, useEffect, useMemo } from 'react'
import { API_URL } from '../config/api'
import './NextMealWidget.css'

/**
<<<<<<< HEAD
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

=======
 * NextMealWidget - Mostra a próxima refeição do dia com timer countdown.
 */
function NextMealWidget({ refreshTrigger }) {
  const [dieta, setDieta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Horários típicos das refeições (configurável no futuro)
  const mealSchedule = useMemo(() => ({
    'Café da Manhã': { hour: 7, minute: 0 },
    'Lanche da Manhã': { hour: 10, minute: 0 },
    'Almoço': { hour: 12, minute: 30 },
    'Lanche da Tarde': { hour: 15, minute: 30 },
    'Jantar': { hour: 19, minute: 0 },
    'Ceia': { hour: 21, minute: 30 },
  }), [])

  // Atualizar relógio a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Carregar dieta
  useEffect(() => {
    loadDieta()
  }, [refreshTrigger])

>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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

<<<<<<< HEAD
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
=======
  // Encontrar próxima refeição
  const nextMeal = useMemo(() => {
    if (!dieta?.refeicoes) return null

    const now = currentTime
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // Encontrar a próxima refeição que ainda não passou
    for (const refeicao of dieta.refeicoes) {
      const schedule = mealSchedule[refeicao.nome]
      if (schedule) {
        const mealMinutes = schedule.hour * 60 + schedule.minute
        if (mealMinutes > currentMinutes) {
          return {
            ...refeicao,
            scheduledTime: schedule,
            minutesUntil: mealMinutes - currentMinutes
          }
        }
      }
    }

    // Se todas as refeições de hoje já passaram, mostrar a primeira de amanhã
    const firstMeal = dieta.refeicoes[0]
    if (firstMeal) {
      const schedule = mealSchedule[firstMeal.nome] || { hour: 7, minute: 0 }
      const mealMinutes = schedule.hour * 60 + schedule.minute
      const minutesUntilTomorrow = (24 * 60 - currentMinutes) + mealMinutes

      return {
        ...firstMeal,
        scheduledTime: schedule,
        minutesUntil: minutesUntilTomorrow,
        isTomorrow: true
      }
    }

    return null
  }, [dieta, currentTime, mealSchedule])

  // Formatar tempo restante
  const formatTimeRemaining = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) {
      return `${hours}h`
    }
    return `${hours}h ${mins}min`
  }

  // Formatar horário
  const formatTime = (schedule) => {
    const hour = schedule.hour.toString().padStart(2, '0')
    const minute = schedule.minute.toString().padStart(2, '0')
    return `${hour}:${minute}`
  }

  // Determinar urgência do timer
  const getTimerUrgency = (minutes) => {
    if (minutes <= 15) return 'urgent'
    if (minutes <= 30) return 'soon'
    return 'normal'
  }
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e

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
<<<<<<< HEAD
    // Verificar se não tem dieta ou se todas as refeições foram consumidas
    const allMealsConsumed = dieta?.refeicoes && consumedMeals.length === dieta.refeicoes.length
    
=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
    return (
      <div className="next-meal-widget next-meal-widget--empty">
        <div className="next-meal-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
<<<<<<< HEAD
        <p className="next-meal-empty-text">
          {allMealsConsumed 
            ? 'Todas as refeições do dia foram consumidas! 🎉' 
            : 'Nenhuma dieta cadastrada'}
        </p>
=======
        <p className="next-meal-empty-text">Nenhuma dieta cadastrada</p>
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
      </div>
    )
  }

<<<<<<< HEAD
  return (
    <div className="next-meal-widget next-meal-widget--normal">
=======
  const urgency = getTimerUrgency(nextMeal.minutesUntil)

  return (
    <div className={`next-meal-widget next-meal-widget--${urgency}`}>
      {/* Timer Badge */}
      <div className={`next-meal-timer timer-${urgency}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span>{formatTimeRemaining(nextMeal.minutesUntil)}</span>
        {nextMeal.isTomorrow && <span className="tomorrow-badge">amanhã</span>}
      </div>

>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
      {/* Meal Info */}
      <div className="next-meal-content">
        <div className="next-meal-header">
          <h3 className="next-meal-title">{nextMeal.nome}</h3>
<<<<<<< HEAD
=======
          <span className="next-meal-time">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {formatTime(nextMeal.scheduledTime)}
          </span>
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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


