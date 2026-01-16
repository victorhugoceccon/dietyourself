import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import ChefVirtual from './ChefVirtual'
import PhotoMealCapture from './PhotoMealCapture'
import './DashboardMobileView.css'

function DashboardMobileView() {
  const [loading, setLoading] = useState(true)
  const [hasDiet, setHasDiet] = useState(false)
  const [dieta, setDieta] = useState(null)
  const [nutritionalNeeds, setNutritionalNeeds] = useState(null)
  const [consumedMeals, setConsumedMeals] = useState([])
  const [consumedStats, setConsumedStats] = useState(null)
  const [weeklyData, setWeeklyData] = useState([])
  const [checkInData, setCheckInData] = useState(null)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const photoButtonRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Carregar todas as informações em paralelo
      const [dietRes, statsRes, weeklyRes, checkInRes] = await Promise.all([
        fetch(`${API_URL}/diet`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/consumed-meals/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/progress/weekly`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/daily-checkin/today`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      // Processar dieta
      if (dietRes.ok) {
        const data = await dietRes.json()
        if (data.dieta) {
          setHasDiet(true)
          setDieta(data.dieta)
          setNutritionalNeeds(data.nutritionalNeeds)
        } else {
          navigate('/paciente/dieta', { replace: true })
          return
        }
      }

      // Processar estatísticas de refeições consumidas
      if (statsRes.ok) {
        const data = await statsRes.json()
        setConsumedMeals(data.consumedMeals || [])
        setConsumedStats(data.totals || {})
      }

      // Processar dados semanais
      if (weeklyRes.ok) {
        const data = await weeklyRes.json()
        setWeeklyData(data.weeklyData || [])
      }

      // Processar check-in de hoje
      if (checkInRes.ok) {
        const data = await checkInRes.json()
        setCheckInData(data.checkIn || null)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cálculos
  const totalMeals = dieta?.refeicoes?.length || 0
  const consumedCount = consumedMeals.length
  const mealsProgress = totalMeals > 0 ? Math.round((consumedCount / totalMeals) * 100) : 0

  const targetKcal = nutritionalNeeds?.calorias || 0
  const consumedKcal = consumedStats?.consumedKcal || 0
  const kcalProgress = targetKcal > 0 ? Math.round((consumedKcal / targetKcal) * 100) : 0

  const targetProtein = nutritionalNeeds?.macros?.proteina || 0
  const consumedProtein = consumedStats?.consumedProtein || 0
  const proteinProgress = targetProtein > 0 ? Math.round((consumedProtein / targetProtein) * 100) : 0

  // Status geral do dia
  const getOverallStatus = () => {
    const avg = (mealsProgress + kcalProgress) / 2
    if (avg >= 80) return { emoji: '🔥', text: 'Excelente!', color: '#4ade80' }
    if (avg >= 50) return { emoji: '💪', text: 'Bom progresso', color: '#f59e0b' }
    if (avg > 0) return { emoji: '🚀', text: 'Começando bem', color: '#3b82f6' }
    return { emoji: '☀️', text: 'Novo dia', color: '#8b95a5' }
  }

  const status = getOverallStatus()

  // Próxima refeição
  const getNextMeal = () => {
    if (!dieta?.refeicoes) return null
    const nextIndex = dieta.refeicoes.findIndex((_, idx) => !consumedMeals.includes(idx))
    if (nextIndex === -1) return null
    return { index: nextIndex, meal: dieta.refeicoes[nextIndex] }
  }

  const nextMeal = getNextMeal()

  // Dias da semana para constância
  const getDayName = (date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return days[new Date(date).getDay()]
  }

  if (loading) {
    return (
      <div className="giba-dash-page">
        <div className="giba-dash-loading">
          <div className="giba-dash-loading-spinner"></div>
          <p>Carregando seu dia...</p>
        </div>
      </div>
    )
  }

  if (!hasDiet) return null

  return (
    <div className="giba-dash-page">
      {/* Hero */}
      <div className="giba-dash-hero">
        <div className="giba-dash-hero-badge">
          <span>📊</span>
          <span>GIBA</span>
        </div>
        <h1 className="giba-dash-hero-title">Seu dia</h1>
        <div className="giba-dash-hero-status">
          <span className="giba-dash-status-emoji">{status.emoji}</span>
          <span className="giba-dash-status-text" style={{ color: status.color }}>{status.text}</span>
        </div>
      </div>

      {/* Progresso Geral */}
      <section className="giba-dash-section">
        <div className="giba-dash-progress-cards">
          {/* Card de Refeições */}
          <div className="giba-dash-progress-card">
            <div className="giba-dash-progress-header">
              <span className="giba-dash-progress-icon">🍽️</span>
              <span className="giba-dash-progress-label">Refeições</span>
            </div>
            <div className="giba-dash-progress-value">
              <span className="giba-dash-value-main">{consumedCount}</span>
              <span className="giba-dash-value-total">/ {totalMeals}</span>
            </div>
            <div className="giba-dash-progress-bar">
              <div 
                className="giba-dash-progress-fill meals" 
                style={{ width: `${Math.min(mealsProgress, 100)}%` }}
              ></div>
            </div>
            <span className="giba-dash-progress-percent">{mealsProgress}%</span>
          </div>

          {/* Card de Calorias */}
          <div className="giba-dash-progress-card" style={{ position: 'relative', overflow: 'visible' }}>
            <div className="giba-dash-progress-header" style={{ position: 'relative', overflow: 'visible' }}>
              <span className="giba-dash-progress-icon">🔥</span>
              <span className="giba-dash-progress-label">Calorias</span>
              <button
                ref={photoButtonRef}
                className="giba-dash-photo-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPhotoCapture(true)
                }}
                title="Adicionar refeição por foto"
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  zIndex: 100,
                  display: 'flex',
                  visibility: 'visible',
                  opacity: 1,
                  background: '#4A6B4D',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  minWidth: '36px',
                  minHeight: '32px'
                }}
              >
                📸
              </button>
            </div>
            <div className="giba-dash-progress-value">
              <span className="giba-dash-value-main">{Math.round(consumedKcal)}</span>
              <span className="giba-dash-value-total">/ {Math.round(targetKcal)}</span>
            </div>
            <div className="giba-dash-progress-bar">
              <div 
                className="giba-dash-progress-fill kcal" 
                style={{ width: `${Math.min(kcalProgress, 100)}%` }}
              ></div>
            </div>
            <span className="giba-dash-progress-percent">{kcalProgress}%</span>
          </div>

          {/* Card de Proteína */}
          <div className="giba-dash-progress-card">
            <div className="giba-dash-progress-header">
              <span className="giba-dash-progress-icon">💪</span>
              <span className="giba-dash-progress-label">Proteína</span>
            </div>
            <div className="giba-dash-progress-value">
              <span className="giba-dash-value-main">{Math.round(consumedProtein)}g</span>
              <span className="giba-dash-value-total">/ {Math.round(targetProtein)}g</span>
            </div>
            <div className="giba-dash-progress-bar">
              <div 
                className="giba-dash-progress-fill protein" 
                style={{ width: `${Math.min(proteinProgress, 100)}%` }}
              ></div>
            </div>
            <span className="giba-dash-progress-percent">{proteinProgress}%</span>
          </div>
        </div>
      </section>

      {/* Próxima Refeição */}
      {nextMeal && (
        <section className="giba-dash-section">
          <div className="giba-dash-section-header">
            <h2 className="giba-dash-section-title">Próxima refeição</h2>
          </div>
          
          <div 
            className="giba-dash-next-meal"
            onClick={() => navigate('/paciente/dieta')}
          >
            <div className="giba-dash-next-icon">🍴</div>
            <div className="giba-dash-next-info">
              <h3 className="giba-dash-next-name">{nextMeal.meal.nome}</h3>
              <p className="giba-dash-next-kcal">{nextMeal.meal.totalRefeicaoKcal} calorias</p>
            </div>
            <span className="giba-dash-next-arrow">→</span>
          </div>
          
          {/* Chef Virtual */}
          <ChefVirtual 
            refeicao={nextMeal.meal}
          />
        </section>
      )}

      {/* Check-in de Hoje */}
      <section className="giba-dash-section">
        <div className="giba-dash-section-header">
          <h2 className="giba-dash-section-title">Seu check-in de hoje</h2>
        </div>
        
        {checkInData ? (
          <div className="giba-dash-checkin-done">
            <div className="giba-dash-checkin-badge">✓ Realizado</div>
            <div className="giba-dash-checkin-data">
              {checkInData.peso && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">⚖️</span>
                  <div>
                    <span className="giba-dash-checkin-label">Peso</span>
                    <span className="giba-dash-checkin-value">{checkInData.peso} kg</span>
                  </div>
                </div>
              )}
              {checkInData.nivelEnergia && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">⚡</span>
                  <div>
                    <span className="giba-dash-checkin-label">Energia</span>
                    <span className="giba-dash-checkin-value">{checkInData.nivelEnergia}/5</span>
                  </div>
                </div>
              )}
              {checkInData.qualidadeSono && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">😴</span>
                  <div>
                    <span className="giba-dash-checkin-label">Sono</span>
                    <span className="giba-dash-checkin-value">{checkInData.qualidadeSono}/5</span>
                  </div>
                </div>
              )}
              {checkInData.humorGeral && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">😊</span>
                  <div>
                    <span className="giba-dash-checkin-label">Humor</span>
                    <span className="giba-dash-checkin-value">{checkInData.humorGeral}/5</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="giba-dash-checkin-pending">
            <span className="giba-dash-checkin-pending-icon">📝</span>
            <div className="giba-dash-checkin-pending-info">
              <h3>Registre seu dia</h3>
              <p>Anote como você está se sentindo hoje</p>
            </div>
            <button className="giba-dash-checkin-btn">
              Fazer check-in
            </button>
          </div>
        )}
      </section>

      {/* Constância Semanal */}
      <section className="giba-dash-section">
        <div className="giba-dash-section-header">
          <h2 className="giba-dash-section-title">Sua semana</h2>
        </div>
        <p className="giba-dash-section-desc">
          Cada dia que você registra suas refeições conta para sua constância.
        </p>

        <div className="giba-dash-week">
          {weeklyData.length > 0 ? (
            weeklyData.map((day, idx) => (
              <div 
                key={idx} 
                className={`giba-dash-day ${day.completed ? 'completed' : ''} ${day.isToday ? 'today' : ''}`}
              >
                <span className="giba-dash-day-name">{getDayName(day.date)}</span>
                <div className="giba-dash-day-status">
                  {day.completed ? '✓' : day.isToday ? '•' : ''}
                </div>
              </div>
            ))
          ) : (
            // Fallback: mostrar semana atual
            ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => {
              const today = new Date().getDay()
              return (
                <div 
                  key={idx} 
                  className={`giba-dash-day ${idx === today ? 'today' : ''}`}
                >
                  <span className="giba-dash-day-name">{day}</span>
                  <div className="giba-dash-day-status">
                    {idx === today ? '•' : ''}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {weeklyData.length > 0 && (
          <div className="giba-dash-week-summary">
            <span className="giba-dash-week-completed">
              {weeklyData.filter(d => d.completed).length} dias completados
            </span>
            <span className="giba-dash-week-streak">
              🔥 Continue assim!
            </span>
          </div>
        )}
      </section>

      {/* Atalhos rápidos */}
      <section className="giba-dash-section">
        <div className="giba-dash-section-header">
          <h2 className="giba-dash-section-title">Atalhos</h2>
        </div>

        <div className="giba-dash-shortcuts">
          <button 
            className="giba-dash-shortcut"
            onClick={() => navigate('/paciente/dieta')}
          >
            <span className="giba-dash-shortcut-icon">🥗</span>
            <span className="giba-dash-shortcut-text">Ver dieta</span>
          </button>
          <button 
            className="giba-dash-shortcut"
            onClick={() => navigate('/paciente/treino')}
          >
            <span className="giba-dash-shortcut-icon">💪</span>
            <span className="giba-dash-shortcut-text">Ver treino</span>
          </button>
          <button 
            className="giba-dash-shortcut"
            onClick={() => navigate('/paciente/projetos')}
          >
            <span className="giba-dash-shortcut-icon">🏆</span>
            <span className="giba-dash-shortcut-text">Projetos</span>
          </button>
          <button 
            className="giba-dash-shortcut"
            onClick={() => navigate('/paciente/perfil')}
          >
            <span className="giba-dash-shortcut-icon">👤</span>
            <span className="giba-dash-shortcut-text">Perfil</span>
          </button>
        </div>
      </section>

      {/* Dica do dia */}
      <section className="giba-dash-section">
        <div className="giba-dash-tip">
          <span className="giba-dash-tip-icon">💡</span>
          <div className="giba-dash-tip-content">
            <h4>Dica do dia</h4>
            <p>
              {mealsProgress < 50 
                ? 'Lembre-se de registrar suas refeições para acompanhar seu progresso!'
                : proteinProgress < 50
                  ? 'Tente incluir uma fonte de proteína em cada refeição.'
                  : 'Ótimo trabalho! Continue mantendo a consistência.'}
            </p>
          </div>
        </div>
      </section>

      {/* Modal de captura de foto */}
      {showPhotoCapture && (
        <PhotoMealCapture
          onClose={() => setShowPhotoCapture(false)}
          onSuccess={() => {
            loadAllData()
            setShowPhotoCapture(false)
          }}
        />
      )}
    </div>
  )
}

export default DashboardMobileView
