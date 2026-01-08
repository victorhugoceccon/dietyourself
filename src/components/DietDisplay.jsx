import { useState, useEffect } from 'react'
import Card from './ui/Card'
import Badge from './ui/Badge'
import Chip from './ui/Chip'
// import FoodSwapModal from './FoodSwapModal' // Desativado temporariamente
import { API_URL } from '../config/api'
import './DietDisplay.css'

function DietDisplay({ onGenerateDiet, refreshTrigger, onMealToggle, nutritionalNeeds }) {
  const [dieta, setDieta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [selectedSubstitutions, setSelectedSubstitutions] = useState({})
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [selectedFoodItem, setSelectedFoodItem] = useState(null)
  const [selectedMealIndex, setSelectedMealIndex] = useState(null)
  const [selectedItemIndex, setSelectedItemIndex] = useState(null)
  const [consumedMeals, setConsumedMeals] = useState([])
  const [togglingMeal, setTogglingMeal] = useState(null)

  useEffect(() => {
    loadDiet()
    loadConsumedMeals()
  }, [refreshTrigger])

<<<<<<< HEAD
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'DietDisplay.jsx:viewport',
      message: 'Viewport render',
      data: { width: typeof window !== 'undefined' ? window.innerWidth : null },
      timestamp: Date.now()
    })
  }).catch(() => {})
  // #endregion

=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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

  const handleMealToggle = async (mealIndex, mealName, e) => {
<<<<<<< HEAD
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
=======
    e.preventDefault() // Prevenir comportamento padrão
    e.stopPropagation() // Evitar expandir/colapsar a refeição
    
    // Garantir que não expande a refeição ao clicar no checkbox
    if (expandedMeals.has(mealIndex)) {
      // Se está expandida, não fazer nada além de marcar/desmarcar
    }
    
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
    setTogglingMeal(mealIndex)
    try {
      const token = localStorage.getItem('token')
      const isCurrentlyConsumed = consumedMeals.includes(mealIndex)
      
      if (isCurrentlyConsumed) {
<<<<<<< HEAD
=======
        // Desmarcar - deletar consumo
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
        const response = await fetch(`${API_URL}/consumed-meals/${mealIndex}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
<<<<<<< HEAD
        if (response.ok) {
          setConsumedMeals(prev => prev.filter(index => index !== mealIndex))
          onMealToggle && onMealToggle()
=======

        if (response.ok) {
          setConsumedMeals(prev => prev.filter(index => index !== mealIndex))
          // Notificar componente pai para atualizar dashboard
          if (onMealToggle) {
            onMealToggle()
          }
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
        } else {
          throw new Error('Erro ao desmarcar refeição')
        }
      } else {
<<<<<<< HEAD
=======
        // Marcar - criar consumo
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
        const response = await fetch(`${API_URL}/consumed-meals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            mealIndex,
            mealName
          })
        })
<<<<<<< HEAD
        if (response.ok) {
          setConsumedMeals(prev => [...prev, mealIndex])
          onMealToggle && onMealToggle()
=======

        if (response.ok) {
          setConsumedMeals(prev => [...prev, mealIndex])
          // Notificar componente pai para atualizar dashboard
          if (onMealToggle) {
            onMealToggle()
          }
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao marcar refeição')
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar refeição:', error)
      alert(error.message || 'Erro ao marcar refeição. Tente novamente.')
    } finally {
      setTogglingMeal(null)
    }
  }

  const loadDiet = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📥 Dieta carregada do servidor:', data.dieta ? 'presente' : 'ausente')
        if (data.dieta) {
          setDieta(data.dieta)
          // Não expandir nenhuma refeição por padrão - deixar usuário escolher
          setExpandedMeals(new Set())
        } else {
          console.warn('⚠️ Nenhuma dieta encontrada na resposta')
          setDieta(null)
        }
      } else {
        console.error('❌ Erro ao carregar dieta:', response.status)
      }
    } catch (error) {
      console.error('Erro ao carregar dieta:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMeal = (index) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
<<<<<<< HEAD

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H2',
          location: 'DietDisplay.jsx:toggleMeal',
          message: 'Toggle meal expand',
          data: { mealIndex: index, expanded: !expandedMeals.has(index) },
          timestamp: Date.now()
        })
      }).catch(() => {})
      // #endregion

=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
      return newSet
    })
  }

  const handleSubstitutionClick = (mealIndex, itemIndex, subIndex, substitution) => {
    const key = `${mealIndex}-${itemIndex}-${subIndex}`
    setSelectedSubstitutions(prev => {
      const newState = { ...prev }
      if (newState[key]) {
        delete newState[key]
      } else {
        newState[key] = substitution
      }
      return newState
    })
  }

  const handleFoodItemClick = (mealIndex, itemIndex, foodItem, mealName) => {
    setSelectedFoodItem(foodItem)
    setSelectedMealIndex(mealIndex)
    setSelectedItemIndex(itemIndex)
    setSwapModalOpen(true)
  }

  const handleSwapConfirm = async (mealIndex, itemIndex, newItem) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/diet/update-item`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mealIndex,
          itemIndex,
          newItem: {
            alimento: newItem.alimento,
            porcao: newItem.porcao || newItem.porcaoEquivalente || '',
            kcal: newItem.kcal || newItem.kcalAproximada || 0,
            // Incluir macros se disponíveis (novo formato)
            macros: newItem.macros || null,
            macrosAproximados: newItem.macrosAproximados || null
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar item')
      }

      // Atualizar estado local com a dieta atualizada
      if (data.dieta) {
        setDieta(data.dieta)
      } else {
        // Recarregar dieta do servidor
        loadDiet()
      }

    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      alert('Erro ao atualizar alimento. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="diet-display">
        <div className="diet-loading">
          <div className="loading-spinner"></div>
          <p>Carregando dieta...</p>
        </div>
      </div>
    )
  }

  if (!dieta) {
    return (
      <div className="diet-display">
        <div className="no-diet">
          <div className="no-diet-icon">
            <svg viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="3" strokeDasharray="5 5" opacity="0.3"/>
              <path d="M30 50L42 62L70 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Nenhuma dieta gerada ainda</h3>
          <p>Gere sua dieta para criar seu plano alimentar personalizado baseado no seu perfil</p>
        </div>
      </div>
    )
  }

  const isExpanded = (index) => expandedMeals.has(index)

<<<<<<< HEAD
  const totalMeals = dieta?.refeicoes?.length || 0
  const consumedCount = consumedMeals.length

  return (
    <div className="diet-display">
      {totalMeals > 0 && (
        <div className="meals-progress">
          <div className="meals-progress-top">
            <span className="meals-progress-label">Refeições do dia</span>
            <span className="meals-progress-count">{consumedCount}/{totalMeals} consumidas</span>
          </div>
          <div className="meals-progress-bar">
            <div
              className="meals-progress-fill"
              style={{ width: `${Math.min(100, (consumedCount / totalMeals) * 100)}%` }}
            />
          </div>
        </div>
      )}
=======
  return (
    <div className="diet-display">
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
      {/* Necessidades Nutricionais - Mesmo layout do Dashboard */}
      {nutritionalNeeds && (
        <div className="nutrition-needs-dashboard">
          <div className="needs-dashboard-header">
            <h3>Necessidades Nutricionais</h3>
            <p className="needs-subtitle">Suas metas diárias</p>
          </div>
          <div className="nutrition-cards-row">
            {/* Card de Calorias */}
            <div className="nutrition-card">
              <div className="card-icon-wrapper" style={{ backgroundColor: '#4A6B4D15', borderColor: '#4A6B4D40' }}>
                <span className="card-icon-emoji">🔥</span>
              </div>
              <div className="card-content">
                <div className="card-value">{Math.round(nutritionalNeeds.calorias || 0)}</div>
                <div className="card-label">Calorias diárias</div>
                <div className="card-progress-wrapper">
                  <div className="card-progress-bar">
                    <div 
                      className="card-progress-fill" 
                      style={{ 
                        width: '100%',
                        backgroundColor: '#4A6B4D'
                      }}
                    ></div>
                  </div>
                  <div className="card-status" style={{ color: '#4A6B4D' }}>
                    Meta diária
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Proteína */}
            <div className="nutrition-card">
              <div className="card-icon-wrapper" style={{ backgroundColor: '#5B7A9B15', borderColor: '#5B7A9B40' }}>
                <span className="card-icon-emoji">💪</span>
              </div>
              <div className="card-content">
                <div className="card-value">{Math.round(nutritionalNeeds.macros?.proteina || 0)}</div>
                <div className="card-label">Proteína diária</div>
                <div className="card-progress-wrapper">
                  <div className="card-progress-bar">
                    <div 
                      className="card-progress-fill" 
                      style={{ 
                        width: '100%',
                        backgroundColor: '#5B7A9B'
                      }}
                    ></div>
                  </div>
                  <div className="card-status" style={{ color: '#5B7A9B' }}>
                    Meta diária
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Carboidratos */}
            <div className="nutrition-card">
              <div className="card-icon-wrapper" style={{ backgroundColor: '#C99A5A15', borderColor: '#C99A5A40' }}>
                <span className="card-icon-emoji">🍞</span>
              </div>
              <div className="card-content">
                <div className="card-value">{Math.round(nutritionalNeeds.macros?.carboidrato || 0)}</div>
                <div className="card-label">Carboidratos diários</div>
                <div className="card-progress-wrapper">
                  <div className="card-progress-bar">
                    <div 
                      className="card-progress-fill" 
                      style={{ 
                        width: '100%',
                        backgroundColor: '#C99A5A'
                      }}
                    ></div>
                  </div>
                  <div className="card-status" style={{ color: '#C99A5A' }}>
                    Meta diária
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Gorduras */}
            <div className="nutrition-card">
              <div className="card-icon-wrapper" style={{ backgroundColor: '#8B7A9B15', borderColor: '#8B7A9B40' }}>
                <span className="card-icon-emoji">🧈</span>
              </div>
              <div className="card-content">
                <div className="card-value">{Math.round(nutritionalNeeds.macros?.gordura || 0)}</div>
                <div className="card-label">Gorduras diárias</div>
                <div className="card-progress-wrapper">
                  <div className="card-progress-bar">
                    <div 
                      className="card-progress-fill" 
                      style={{ 
                        width: '100%',
                        backgroundColor: '#8B7A9B'
                      }}
                    ></div>
                  </div>
                  <div className="card-status" style={{ color: '#8B7A9B' }}>
                    Meta diária
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refeições colapsáveis */}
      <div className="diet-meals">
<<<<<<< HEAD
        {dieta.refeicoes && dieta.refeicoes.map((refeicao, mealIndex) => {
          const isConsumed = consumedMeals.includes(mealIndex)
          const isExpanded = expandedMeals.has(mealIndex)
          
          return (
            <div 
              key={mealIndex}
              className={`meal-card-new ${isConsumed ? 'consumed' : ''}`}
            >
              {/* Header - Mobile-first: coluna, Desktop: linha */}
              <div 
                className="meal-card-header"
                onClick={() => toggleMeal(mealIndex)}
              >
                <div className="meal-card-header-content">
                  {/* Título e Badge */}
                  <div className="meal-card-title-section">
                    <h3 className="meal-card-name">{refeicao.nome}</h3>
                    <Badge variant="calories" size="medium" className="meal-card-badge">
                      {refeicao.totalRefeicaoKcal} kcal
                    </Badge>
                  </div>
                  
                  {/* Botão de ação - sempre centralizado no mobile */}
                  <button
                    className={`meal-card-action ${isConsumed ? 'consumed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMealToggle(mealIndex, refeicao.nome, e)
                    }}
                    disabled={togglingMeal === mealIndex}
                    type="button"
                  >
                    {isConsumed ? 'Consumida' : 'Consumir'}
                  </button>
                  
                  {/* Ícone de expandir */}
                  <button
                    className={`meal-card-expand ${isExpanded ? 'expanded' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleMeal(mealIndex)
                    }}
                    type="button"
                    aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Conteúdo expandido */}
              {isExpanded && (
                <div className="meal-card-content">
                  <div className="meal-card-items">
                    {refeicao.itens && refeicao.itens.map((item, itemIndex) => (
                      <div key={itemIndex} className="meal-card-food-item">
                        <div className="meal-card-food-main">
                          <div className="meal-card-food-info">
                            <h4 className="meal-card-food-name">{item.alimento}</h4>
                            <p className="meal-card-food-portion">{item.porcao}</p>
                          </div>
                          <Badge variant="secondary" size="small" className="meal-card-food-kcal">
                            {item.kcal} kcal
                          </Badge>
                        </div>
                        
                        {item.substituicoes && item.substituicoes.length > 0 && (
                          <div className="meal-card-substitutions">
                            <div className="meal-card-substitutions-list">
                              <div className="meal-card-substitutions-label">Alternativas:</div>
                              {item.substituicoes.map((sub, subIndex) => (
                                <div key={subIndex} className="meal-card-substitution-item">
                                  <span className="meal-card-substitution-name">{sub.alimento}</span>
                                  <span className="meal-card-substitution-details">
                                    {sub.porcaoEquivalente || sub.porcao}
                                    {sub.kcalAproximada && ` • ${sub.kcalAproximada} kcal`}
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
=======
        {dieta.refeicoes && dieta.refeicoes.map((refeicao, mealIndex) => (
          <Card 
            key={mealIndex} 
            className={`meal-card ${consumedMeals.includes(mealIndex) ? 'consumed' : ''}`} 
            hoverable
          >
            <div 
              className={`meal-header-wrapper ${isExpanded(mealIndex) ? 'expanded' : ''}`}
              onClick={() => toggleMeal(mealIndex)}
            >
              <label 
                className="meal-checkbox-label" 
                onClick={(e) => {
                  e.stopPropagation()
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={consumedMeals.includes(mealIndex)}
                  onChange={(e) => handleMealToggle(mealIndex, refeicao.nome, e)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={togglingMeal === mealIndex}
                  className="meal-checkbox"
                />
                <span className="meal-checkbox-custom"></span>
                {togglingMeal === mealIndex && (
                  <span className="meal-checkbox-loading">...</span>
                )}
              </label>
              <div className="meal-header-content">
                <h3 className="meal-name">{refeicao.nome}</h3>
                <Badge variant="calories" size="medium" className="meal-badge">
                  {refeicao.totalRefeicaoKcal} kcal
                </Badge>
              </div>
              <svg
                className={`meal-expand-icon ${isExpanded(mealIndex) ? 'expanded' : ''}`}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {isExpanded(mealIndex) && (
              <div className="meal-content">
                <div className="meal-items">
                  {refeicao.itens && refeicao.itens.map((item, itemIndex) => (
                    <div key={itemIndex} className="food-item">
                      <div className="food-item-main">
                        <div className="food-info">
                          <h4 className="food-name">{item.alimento}</h4>
                          <p className="food-portion">{item.porcao}</p>
                        </div>
                        <Badge variant="secondary" size="small" className="food-kcal">
                          {item.kcal} kcal
                        </Badge>
                      </div>
                      
                      {item.substituicoes && item.substituicoes.length > 0 && (
                        <div className="substitutions-section">
                          <div className="substitutions-list">
                            <div className="substitutions-label">Alternativas:</div>
                            {item.substituicoes.map((sub, subIndex) => (
                              <div key={subIndex} className="substitution-item">
                                <span className="substitution-name">{sub.alimento}</span>
                                <span className="substitution-details">
                                  {sub.porcaoEquivalente || sub.porcao}
                                  {sub.kcalAproximada && ` • ${sub.kcalAproximada} kcal`}
                                </span>
                              </div>
                            ))}
                          </div>
                          {/* Botão de troca desativado temporariamente */}
                          {/* <button
                            className="swap-food-button"
                            onClick={() => handleFoodItemClick(mealIndex, itemIndex, item, refeicao.nome)}
                            title="Trocar este alimento"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 4V1M12 4C10.8954 4 10 4.89543 10 6C10 7.10457 10.8954 8 12 8M12 4C13.1046 4 14 4.89543 14 6C14 7.10457 13.1046 8 12 8M12 20V23M12 20C10.8954 20 10 19.1046 10 18C10 16.8954 10.8954 16 12 16M12 20C13.1046 20 14 19.1046 14 18C14 16.8954 13.1046 16 12 16M6 12H3M21 12H18M6 12C6 10.8954 6.89543 10 8 10M6 12C6 13.1046 6.89543 14 8 14M18 12C18 10.8954 17.1046 10 16 10M18 12C18 13.1046 17.1046 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Trocar</span>
                          </button> */}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
      </div>

      {dieta.observacoesPlano && (
        <Card className="diet-notes">
          <h4 className="notes-title">Observações do Plano</h4>
          <p className="notes-content">{dieta.observacoesPlano}</p>
        </Card>
      )}

      {/* Modal de troca de alimento - Desativado temporariamente */}
      {/* <FoodSwapModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        foodItem={selectedFoodItem}
        mealName={dieta?.refeicoes?.[selectedMealIndex]?.nome || ''}
        mealIndex={selectedMealIndex}
        itemIndex={selectedItemIndex}
        onConfirm={handleSwapConfirm}
        dieta={dieta}
      /> */}
    </div>
  )
}

export default DietDisplay
