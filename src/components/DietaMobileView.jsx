import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import './DietaMobileView.css'

function DietaMobileView() {
  const [loading, setLoading] = useState(true)
  const [dieta, setDieta] = useState(null)
  const [nutritionalNeeds, setNutritionalNeeds] = useState(null)
  const [consumedMeals, setConsumedMeals] = useState([])
  const [expandedMeal, setExpandedMeal] = useState(null)
  const [generatingDiet, setGeneratingDiet] = useState(false)
  const [dietError, setDietError] = useState('')
  const [togglingMeal, setTogglingMeal] = useState(null)
  const isGeneratingRef = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    checkAndLoadData()
  }, [])

  const checkAndLoadData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Verificar questionário
      const questionnaireRes = await fetch(`${API_URL}/questionnaire/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (questionnaireRes.ok) {
        const qData = await questionnaireRes.json()
        if (!qData.hasCompleted) {
          navigate('/paciente/perfil', { replace: true })
          return
        }
      }

      // Carregar dieta
      await loadDiet()
      await loadConsumedMeals()
    } catch (err) {
      console.error('Erro ao verificar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDiet = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/diet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDieta(data.dieta || null)
        if (data.nutritionalNeeds) {
          setNutritionalNeeds(data.nutritionalNeeds)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dieta:', error)
    }
  }

  const loadConsumedMeals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/consumed-meals/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const mealIndices = (data.consumedMeals || []).map(cm => cm.mealIndex)
        setConsumedMeals(mealIndices)
      }
    } catch (error) {
      console.error('Erro ao carregar refeições consumidas:', error)
    }
  }

  const handleMealToggle = async (mealIndex, mealName, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setTogglingMeal(mealIndex)
    try {
      const token = localStorage.getItem('token')
      const isCurrentlyConsumed = consumedMeals.includes(mealIndex)
      
      if (isCurrentlyConsumed) {
        const response = await fetch(`${API_URL}/consumed-meals/${mealIndex}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          setConsumedMeals(prev => prev.filter(index => index !== mealIndex))
        }
      } else {
        const response = await fetch(`${API_URL}/consumed-meals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ mealIndex, mealName })
        })
        if (response.ok) {
          setConsumedMeals(prev => [...prev, mealIndex])
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar refeição:', error)
    } finally {
      setTogglingMeal(null)
    }
  }

  const handleGenerateDiet = async () => {
    if (generatingDiet || isGeneratingRef.current) return

    isGeneratingRef.current = true
    setGeneratingDiet(true)
    setDietError('')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 660000)

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/diet/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar dieta')
      }

      if (data.nutritionalNeeds) {
        setNutritionalNeeds(data.nutritionalNeeds)
      }

      await loadDiet()
    } catch (error) {
      console.error('Erro ao gerar dieta:', error)
      if (error.name === 'AbortError') {
        setDietError('A criação está demorando mais que o esperado. Por favor, tente novamente.')
      } else {
        setDietError(error.message || 'Algo deu errado. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
      setGeneratingDiet(false)
      isGeneratingRef.current = false
    }
  }

  const totalMeals = dieta?.refeicoes?.length || 0
  const consumedCount = consumedMeals.length
  const progressPercent = totalMeals > 0 ? Math.round((consumedCount / totalMeals) * 100) : 0

  // Estado vazio - sem dieta
  const renderEmptyState = () => (
    <div className="giba-dieta-page">
      {/* Hero de boas-vindas */}
      <div className="giba-dieta-welcome">
        <div className="giba-dieta-badge">
          <span className="giba-dieta-badge-icon">🥗</span>
          <span className="giba-dieta-badge-text">GIBA</span>
        </div>
        <h1 className="giba-dieta-welcome-title">Seu plano alimentar personalizado</h1>
        <p className="giba-dieta-welcome-sub">
          Em poucos minutos você terá um cardápio completo, feito especialmente para o seu corpo e seus objetivos.
        </p>
      </div>

      {/* CTA para gerar dieta */}
      <section className="giba-dieta-section">
        <div className="giba-dieta-section-header">
          <span className="giba-dieta-step">Passo único</span>
          <h2 className="giba-dieta-section-title">Gere sua dieta</h2>
        </div>
        <p className="giba-dieta-section-desc">
          Com base no seu questionário, vamos criar um plano alimentar que respeita suas preferências, restrições e metas.
        </p>

        {dietError && <div className="giba-dieta-error">{dietError}</div>}

        {generatingDiet && (
          <div className="giba-dieta-progress">
            <div className="giba-dieta-progress-bar">
              <div className="giba-dieta-progress-fill"></div>
            </div>
            <p className="giba-dieta-progress-text">Criando seu plano alimentar... isso pode levar alguns minutos</p>
          </div>
        )}

        <button
          className="giba-dieta-btn-primary"
          onClick={handleGenerateDiet}
          disabled={generatingDiet}
        >
          {generatingDiet ? 'Criando sua dieta...' : 'Criar minha dieta'}
        </button>
      </section>

      {/* Cards informativos */}
      <section className="giba-dieta-info-section">
        <div className="giba-dieta-info-card">
          <span className="giba-dieta-info-icon">🎯</span>
          <div>
            <h3>Feito para você</h3>
            <p>Calculamos as calorias e nutrientes ideais para o seu objetivo.</p>
          </div>
        </div>
        <div className="giba-dieta-info-card">
          <span className="giba-dieta-info-icon">🔄</span>
          <div>
            <h3>Opções de troca</h3>
            <p>Cada alimento tem alternativas para você variar o cardápio.</p>
          </div>
        </div>
        <div className="giba-dieta-info-card">
          <span className="giba-dieta-info-icon">✅</span>
          <div>
            <h3>Acompanhe suas refeições</h3>
            <p>Marque o que você consumiu e veja seu progresso do dia.</p>
          </div>
        </div>
      </section>
    </div>
  )

  // Com dieta
  const renderDietView = () => (
    <div className="giba-dieta-page">
      {/* Hero */}
      <div className="giba-dieta-hero">
        <div className="giba-dieta-hero-badge">
          <span>🥗</span>
          <span>GIBA</span>
        </div>
        <h1 className="giba-dieta-hero-title">Seu plano alimentar</h1>
        <p className="giba-dieta-hero-sub">
          Siga as refeições abaixo e marque conforme for consumindo
        </p>
      </div>

      {/* Progresso do dia */}
      <section className="giba-dieta-section">
        <div className="giba-dieta-day-progress">
          <div className="giba-dieta-day-header">
            <h2 className="giba-dieta-day-title">Progresso de hoje</h2>
            <span className="giba-dieta-day-count">{consumedCount} de {totalMeals}</span>
          </div>
          <div className="giba-dieta-day-bar">
            <div 
              className="giba-dieta-day-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="giba-dieta-day-text">
            {progressPercent === 100 
              ? '🎉 Parabéns! Você completou todas as refeições do dia!'
              : progressPercent >= 50 
                ? `Ótimo! Você já consumiu ${progressPercent}% das refeições.`
                : 'Continue assim! Cada refeição conta para seus resultados.'}
          </p>
        </div>
      </section>

      {/* Metas nutricionais */}
      {nutritionalNeeds && (
        <section className="giba-dieta-section">
          <div className="giba-dieta-section-header">
            <h2 className="giba-dieta-section-title">Suas metas diárias</h2>
          </div>
          <p className="giba-dieta-section-desc">
            Esses são os valores calculados para o seu corpo e objetivo. Não se preocupe em decorar, apenas siga as refeições!
          </p>

          <div className="giba-dieta-macros">
            <div className="giba-dieta-macro-card calories">
              <span className="giba-dieta-macro-icon">🔥</span>
              <div className="giba-dieta-macro-info">
                <span className="giba-dieta-macro-value">{Math.round(nutritionalNeeds.calorias || 0)}</span>
                <span className="giba-dieta-macro-label">Calorias</span>
                <span className="giba-dieta-macro-desc">Energia total do dia</span>
              </div>
            </div>

            <div className="giba-dieta-macro-card protein">
              <span className="giba-dieta-macro-icon">💪</span>
              <div className="giba-dieta-macro-info">
                <span className="giba-dieta-macro-value">{Math.round(nutritionalNeeds.macros?.proteina || 0)}g</span>
                <span className="giba-dieta-macro-label">Proteína</span>
                <span className="giba-dieta-macro-desc">Para músculos e saciedade</span>
              </div>
            </div>

            <div className="giba-dieta-macro-card carbs">
              <span className="giba-dieta-macro-icon">🍞</span>
              <div className="giba-dieta-macro-info">
                <span className="giba-dieta-macro-value">{Math.round(nutritionalNeeds.macros?.carboidrato || 0)}g</span>
                <span className="giba-dieta-macro-label">Carboidratos</span>
                <span className="giba-dieta-macro-desc">Sua fonte de energia</span>
              </div>
            </div>

            <div className="giba-dieta-macro-card fats">
              <span className="giba-dieta-macro-icon">🥑</span>
              <div className="giba-dieta-macro-info">
                <span className="giba-dieta-macro-value">{Math.round(nutritionalNeeds.macros?.gordura || 0)}g</span>
                <span className="giba-dieta-macro-label">Gorduras</span>
                <span className="giba-dieta-macro-desc">Hormônios e vitaminas</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Refeições */}
      <section className="giba-dieta-section">
        <div className="giba-dieta-section-header">
          <h2 className="giba-dieta-section-title">Suas refeições</h2>
        </div>
        <p className="giba-dieta-section-desc">
          Toque em cada refeição para ver os detalhes. Marque como "consumida" após comer.
        </p>

        <div className="giba-dieta-meals">
          {dieta.refeicoes?.map((refeicao, idx) => {
            const isConsumed = consumedMeals.includes(idx)
            const isExpanded = expandedMeal === idx

            return (
              <div 
                className={`giba-dieta-meal-card ${isConsumed ? 'consumed' : ''} ${isExpanded ? 'expanded' : ''}`}
                key={idx}
              >
                <div 
                  className="giba-dieta-meal-header"
                  onClick={() => setExpandedMeal(isExpanded ? null : idx)}
                >
                  <div className="giba-dieta-meal-num">
                    {isConsumed ? '✓' : idx + 1}
                  </div>
                  <div className="giba-dieta-meal-info">
                    <h3 className="giba-dieta-meal-name">{refeicao.nome}</h3>
                    <p className="giba-dieta-meal-kcal">
                      {refeicao.totalRefeicaoKcal} calorias nessa refeição
                    </p>
                  </div>
                  <span className="giba-dieta-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div className="giba-dieta-meal-content">
                    {/* Botão de marcar como consumida */}
                    <button
                      className={`giba-dieta-consume-btn ${isConsumed ? 'consumed' : ''}`}
                      onClick={(e) => handleMealToggle(idx, refeicao.nome, e)}
                      disabled={togglingMeal === idx}
                    >
                      {togglingMeal === idx 
                        ? 'Atualizando...' 
                        : isConsumed 
                          ? '✓ Já consumi essa refeição' 
                          : 'Marcar como consumida'}
                    </button>

                    {/* Lista de alimentos */}
                    <div className="giba-dieta-foods">
                      {refeicao.itens?.map((item, itemIdx) => (
                        <div className="giba-dieta-food-card" key={itemIdx}>
                          <div className="giba-dieta-food-main">
                            <div className="giba-dieta-food-info">
                              <h4 className="giba-dieta-food-name">{item.alimento}</h4>
                              <div className="giba-dieta-food-details">
                                <span className="giba-dieta-food-portion">
                                  📏 Porção: {item.porcao}
                                </span>
                                <span className="giba-dieta-food-kcal">
                                  🔥 {item.kcal} calorias
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Macros do alimento se disponível */}
                          {item.macros && (
                            <div className="giba-dieta-food-macros">
                              <span title="Proteína">💪 {item.macros.proteina || 0}g</span>
                              <span title="Carboidratos">🍞 {item.macros.carboidrato || 0}g</span>
                              <span title="Gorduras">🥑 {item.macros.gordura || 0}g</span>
                            </div>
                          )}

                          {/* Substituições */}
                          {item.substituicoes?.length > 0 && (
                            <div className="giba-dieta-subs">
                              <span className="giba-dieta-subs-label">
                                🔄 Não tem esse alimento? Você pode trocar por:
                              </span>
                              <div className="giba-dieta-subs-list">
                                {item.substituicoes.map((sub, subIdx) => (
                                  <div className="giba-dieta-sub-item" key={subIdx}>
                                    <span className="giba-dieta-sub-name">{sub.alimento}</span>
                                    <span className="giba-dieta-sub-portion">
                                      ({sub.porcaoEquivalente || sub.porcao})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Observações do plano */}
      {dieta.observacoesPlano && (
        <section className="giba-dieta-section">
          <div className="giba-dieta-section-header">
            <h2 className="giba-dieta-section-title">Dicas importantes</h2>
          </div>
          <div className="giba-dieta-obs">
            <span className="giba-dieta-obs-icon">💡</span>
            <p>{dieta.observacoesPlano}</p>
          </div>
        </section>
      )}

      {/* Dicas gerais */}
      <section className="giba-dieta-section">
        <div className="giba-dieta-section-header">
          <h2 className="giba-dieta-section-title">Para melhores resultados</h2>
        </div>
        <div className="giba-dieta-tips">
          <div className="giba-dieta-tip">
            <span className="giba-dieta-tip-num">1</span>
            <p>Beba pelo menos 2 litros de água por dia. Hidratação é essencial!</p>
          </div>
          <div className="giba-dieta-tip">
            <span className="giba-dieta-tip-num">2</span>
            <p>Tente manter horários regulares para suas refeições.</p>
          </div>
          <div className="giba-dieta-tip">
            <span className="giba-dieta-tip-num">3</span>
            <p>Mastigue bem os alimentos. Isso ajuda na digestão e saciedade.</p>
          </div>
        </div>
      </section>
    </div>
  )

  if (loading) {
    return (
      <div className="giba-dieta-page">
        <div className="giba-dieta-loading">
          <div className="giba-dieta-loading-spinner"></div>
          <p>Carregando seu plano alimentar...</p>
        </div>
      </div>
    )
  }

  return dieta ? renderDietView() : renderEmptyState()
}

export default DietaMobileView
