import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Barbell,
  Camera,
  ChartBar,
  Check,
  Circle,
  Drop,
  Fire,
  ForkKnife,
  Lightbulb,
  Lightning,
  MoonStars,
  NotePencil,
  Rocket,
  Scales,
  Smiley,
  Sun,
  Target,
  Trophy,
  User
} from '@phosphor-icons/react'
import { API_URL } from '../config/api'
import ChefVirtual from './ChefVirtual'
import PhotoMealCapture from './PhotoMealCapture'
import './DashboardMobileView.css'

function DashboardMobileView() {
  const gibaLogoUrl = `${import.meta.env.BASE_URL}giba-team-app.png`
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
        fetch(`${API_URL}/checkin/today`, { headers: { Authorization: `Bearer ${token}` } })
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

  const getAdherenceLabel = (value) => {
    if (value === 'TOTAL') return 'Adesão total'
    if (value === 'PARCIAL') return 'Adesão parcial'
    if (value === 'NAO_SEGUIU') return 'Não seguiu'
    return 'Adesão não registrada'
  }

  const parseMealsCount = () => {
    if (!checkInData?.refeicoesConsumidas) return 0
    if (Array.isArray(checkInData.refeicoesConsumidas)) return checkInData.refeicoesConsumidas.length
    if (typeof checkInData.refeicoesConsumidas === 'string') {
      try {
        const parsed = JSON.parse(checkInData.refeicoesConsumidas)
        return Array.isArray(parsed) ? parsed.length : 0
      } catch {
        return 0
      }
    }
    return 0
  }

  const getDailyScore = () => {
    if (!checkInData) return 0
    let score = 0
    if (checkInData.adherence === 'TOTAL') score += 45
    if (checkInData.adherence === 'PARCIAL') score += 25
    if (checkInData.adherence === 'NAO_SEGUIU') score += 10

    if (checkInData.nivelEnergia) score += checkInData.nivelEnergia * 4
    if (checkInData.qualidadeSono) score += checkInData.qualidadeSono * 4
    if (checkInData.humorGeral) score += checkInData.humorGeral * 4
    if (checkInData.aguaMetaLitros) score += 8
    if (checkInData.treinoPlanejado !== null && checkInData.treinoPlanejado !== undefined) score += 6
    if (checkInData.focoDia) score += 6

    const mealsCount = parseMealsCount()
    const totalMealsToday = dieta?.refeicoes?.length || 0
    if (mealsCount && totalMealsToday) {
      score += Math.min(10, Math.round((mealsCount / totalMealsToday) * 10))
    }

    return Math.min(100, score)
  }

  const buildDailyStory = () => {
    if (!checkInData) return []
    const story = []
    story.push(`Você marcou: ${getAdherenceLabel(checkInData.adherence).toLowerCase()}.`)

    if (checkInData.nivelEnergia || checkInData.humorGeral) {
      story.push(`Energia ${checkInData.nivelEnergia || '—'}/5 e humor ${checkInData.humorGeral || '—'}/5.`)
    }

    if (checkInData.qualidadeSono) {
      story.push(`Seu sono foi ${checkInData.qualidadeSono}/5 — amanhã podemos elevar mais.`)
    }

    if (checkInData.aguaMetaLitros) {
      story.push(`Meta de água definida em ${checkInData.aguaMetaLitros}L.`)
    }

    if (checkInData.treinoPlanejado !== null && checkInData.treinoPlanejado !== undefined) {
      story.push(`Treino hoje: ${checkInData.treinoPlanejado ? 'sim' : 'não'} — vamos manter o foco.`)
    }

    if (checkInData.focoDia) {
      story.push(`Foco do dia: ${checkInData.focoDia}.`)
    }

    if (parseMealsCount() > 0) {
      story.push(`Refeições do dia registradas: ${parseMealsCount()}/${dieta?.refeicoes?.length || parseMealsCount()}.`)
    }

    if (story.length < 2) {
      story.push('Cada check-in fortalece sua consistência e acelera seus resultados.')
    }

    return story.slice(0, 3)
  }

  const dailyScore = getDailyScore()
  const dailyStory = buildDailyStory()

  // Status geral do dia
  const getOverallStatus = () => {
    const avg = (mealsProgress + kcalProgress) / 2
    if (avg >= 80) return { icon: Fire, text: 'Excelente!', color: '#4ade80' }
    if (avg >= 50) return { icon: Barbell, text: 'Bom progresso', color: '#f59e0b' }
    if (avg > 0) return { icon: Rocket, text: 'Começando bem', color: '#3b82f6' }
    return { icon: Sun, text: 'Novo dia', color: '#8b95a5' }
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
          <img src={gibaLogoUrl} alt="GIBA" />
        </div>
        <h1 className="giba-dash-hero-title">Seu dia</h1>
        <div className="giba-dash-hero-status">
          <span className="giba-dash-status-emoji">
            <status.icon size={18} weight="fill" style={{ color: status.color }} />
          </span>
          <span className="giba-dash-status-text" style={{ color: status.color }}>{status.text}</span>
        </div>
      </div>

      {/* Progresso Geral */}
      <section className="giba-dash-section">
        <div className="giba-dash-progress-cards">
          {/* Card de Refeições */}
          <div className="giba-dash-progress-card">
            <div className="giba-dash-progress-header">
              <span className="giba-dash-progress-icon">
                <ForkKnife size={18} weight="fill" />
              </span>
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
              <span className="giba-dash-progress-icon">
                <Fire size={18} weight="fill" />
              </span>
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
                <Camera size={16} weight="bold" />
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
              <span className="giba-dash-progress-icon">
                <Barbell size={18} weight="fill" />
              </span>
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
            <div className="giba-dash-next-icon">
              <ForkKnife size={18} weight="fill" />
            </div>
            <div className="giba-dash-next-info">
              <h3 className="giba-dash-next-name">{nextMeal.meal.nome}</h3>
              <p className="giba-dash-next-kcal">{nextMeal.meal.totalRefeicaoKcal} calorias</p>
            </div>
            <span className="giba-dash-next-arrow">
              <ArrowRight size={18} weight="bold" />
            </span>
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
            <div className="giba-dash-checkin-badge">
              <Check size={14} weight="bold" /> Realizado
            </div>
            <div className="giba-dash-checkin-score">
              <div className="giba-dash-checkin-score-header">
                <span>Pontuação do dia</span>
                <strong>{dailyScore}/100</strong>
              </div>
              <div className="giba-dash-checkin-score-bar">
                <span style={{ width: `${dailyScore}%` }} />
              </div>
            </div>
            <div className="giba-dash-checkin-data">
              {checkInData.pesoAtual && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">
                    <Scales size={18} weight="fill" />
                  </span>
                  <div>
                    <span className="giba-dash-checkin-label">Peso</span>
                    <span className="giba-dash-checkin-value">{checkInData.pesoAtual} kg</span>
                  </div>
                </div>
              )}
              {checkInData.nivelEnergia && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">
                    <Lightning size={18} weight="fill" />
                  </span>
                  <div>
                    <span className="giba-dash-checkin-label">Energia</span>
                    <span className="giba-dash-checkin-value">{checkInData.nivelEnergia}/5</span>
                  </div>
                </div>
              )}
              {checkInData.qualidadeSono && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">
                    <MoonStars size={18} weight="fill" />
                  </span>
                  <div>
                    <span className="giba-dash-checkin-label">Sono</span>
                    <span className="giba-dash-checkin-value">{checkInData.qualidadeSono}/5</span>
                  </div>
                </div>
              )}
              {checkInData.humorGeral && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">
                    <Smiley size={18} weight="fill" />
                  </span>
                  <div>
                    <span className="giba-dash-checkin-label">Humor</span>
                    <span className="giba-dash-checkin-value">{checkInData.humorGeral}/5</span>
                  </div>
                </div>
              )}
              {checkInData.aguaMetaLitros && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">
                    <Drop size={18} weight="fill" />
                  </span>
                  <div>
                    <span className="giba-dash-checkin-label">Meta água</span>
                    <span className="giba-dash-checkin-value">{checkInData.aguaMetaLitros} L</span>
                  </div>
                </div>
              )}
              {checkInData.treinoPlanejado !== null && checkInData.treinoPlanejado !== undefined && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">
                    <Barbell size={18} weight="fill" />
                  </span>
                  <div>
                    <span className="giba-dash-checkin-label">Treino</span>
                    <span className="giba-dash-checkin-value">{checkInData.treinoPlanejado ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
              )}
              {checkInData.focoDia && (
                <div className="giba-dash-checkin-item">
                  <span className="giba-dash-checkin-icon">
                    <Target size={18} weight="fill" />
                  </span>
                  <div>
                    <span className="giba-dash-checkin-label">Foco</span>
                    <span className="giba-dash-checkin-value">{checkInData.focoDia}</span>
                  </div>
                </div>
              )}
            </div>

            {dailyStory.length > 0 && (
              <div className="giba-dash-checkin-story">
                <span className="giba-dash-checkin-story-title">História do seu dia</span>
                <ul>
                  {dailyStory.map((line, index) => (
                    <li key={`story-${index}`}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="giba-dash-checkin-pending">
            <span className="giba-dash-checkin-pending-icon">
              <NotePencil size={18} weight="fill" />
            </span>
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
                  {day.completed ? <Check size={12} weight="bold" /> : day.isToday ? <Circle size={8} weight="fill" /> : null}
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
                    {idx === today ? <Circle size={8} weight="fill" /> : null}
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
              <Fire size={14} weight="fill" /> Continue assim!
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
            <span className="giba-dash-shortcut-icon">
              <ForkKnife size={18} weight="fill" />
            </span>
            <span className="giba-dash-shortcut-text">Ver dieta</span>
          </button>
          <button 
            className="giba-dash-shortcut"
            onClick={() => navigate('/paciente/treino')}
          >
            <span className="giba-dash-shortcut-icon">
              <Barbell size={18} weight="fill" />
            </span>
            <span className="giba-dash-shortcut-text">Ver treino</span>
          </button>
          <button 
            className="giba-dash-shortcut"
            onClick={() => navigate('/paciente/projetos')}
          >
            <span className="giba-dash-shortcut-icon">
              <Trophy size={18} weight="fill" />
            </span>
            <span className="giba-dash-shortcut-text">Projetos</span>
          </button>
          <button 
            className="giba-dash-shortcut"
            onClick={() => navigate('/paciente/perfil')}
          >
            <span className="giba-dash-shortcut-icon">
              <User size={18} weight="fill" />
            </span>
            <span className="giba-dash-shortcut-text">Perfil</span>
          </button>
        </div>
      </section>

      {/* Dica do dia */}
      <section className="giba-dash-section">
        <div className="giba-dash-tip">
          <span className="giba-dash-tip-icon">
            <Lightbulb size={18} weight="fill" />
          </span>
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
