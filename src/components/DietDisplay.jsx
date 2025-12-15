import { useState, useEffect } from 'react'
import Card from './ui/Card'
import Badge from './ui/Badge'
import Chip from './ui/Chip'
import FoodSwapModal from './FoodSwapModal'
import './DietDisplay.css'

const API_URL = 'http://localhost:5000/api'

function DietDisplay({ onGenerateDiet, refreshTrigger, onMealToggle }) {
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
    e.stopPropagation() // Evitar expandir/colapsar a refeição
    
    setTogglingMeal(mealIndex)
    try {
      const token = localStorage.getItem('token')
      const isCurrentlyConsumed = consumedMeals.includes(mealIndex)
      
      if (isCurrentlyConsumed) {
        // Desmarcar - deletar consumo
        const response = await fetch(`${API_URL}/consumed-meals/${mealIndex}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setConsumedMeals(prev => prev.filter(index => index !== mealIndex))
          // Notificar componente pai para atualizar dashboard
          if (onMealToggle) {
            onMealToggle()
          }
        } else {
          throw new Error('Erro ao desmarcar refeição')
        }
      } else {
        // Marcar - criar consumo
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

        if (response.ok) {
          setConsumedMeals(prev => [...prev, mealIndex])
          // Notificar componente pai para atualizar dashboard
          if (onMealToggle) {
            onMealToggle()
          }
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
          // Expandir primeira refeição por padrão
          setExpandedMeals(new Set([0]))
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
            kcal: newItem.kcal || newItem.kcalAproximada || 0
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
          <p>Clique no botão "Gerar Dieta" acima para criar seu plano alimentar personalizado baseado no seu questionário</p>
        </div>
      </div>
    )
  }

  const isExpanded = (index) => expandedMeals.has(index)

  return (
    <div className="diet-display">
      {/* Refeições colapsáveis */}
      <div className="diet-meals">
        {dieta.refeicoes && dieta.refeicoes.map((refeicao, mealIndex) => (
          <Card key={mealIndex} className="meal-card" hoverable>
            <div className={`meal-header-wrapper ${isExpanded(mealIndex) ? 'expanded' : ''}`}>
              <label className="meal-checkbox-label" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={consumedMeals.includes(mealIndex)}
                  onChange={(e) => handleMealToggle(mealIndex, refeicao.nome, e)}
                  disabled={togglingMeal === mealIndex}
                  className="meal-checkbox"
                />
                <span className="meal-checkbox-custom"></span>
                {togglingMeal === mealIndex && (
                  <span className="meal-checkbox-loading">...</span>
                )}
              </label>
              <button
                className="meal-header"
                onClick={() => toggleMeal(mealIndex)}
                type="button"
              >
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
              </button>
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
                          <button
                            className="swap-food-button"
                            onClick={() => handleFoodItemClick(mealIndex, itemIndex, item, refeicao.nome)}
                            title="Trocar este alimento"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 4V1M12 4C10.8954 4 10 4.89543 10 6C10 7.10457 10.8954 8 12 8M12 4C13.1046 4 14 4.89543 14 6C14 7.10457 13.1046 8 12 8M12 20V23M12 20C10.8954 20 10 19.1046 10 18C10 16.8954 10.8954 16 12 16M12 20C13.1046 20 14 19.1046 14 18C14 16.8954 13.1046 16 12 16M6 12H3M21 12H18M6 12C6 10.8954 6.89543 10 8 10M6 12C6 13.1046 6.89543 14 8 14M18 12C18 10.8954 17.1046 10 16 10M18 12C18 13.1046 17.1046 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Trocar alimento</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {dieta.observacoesPlano && (
        <Card className="diet-notes">
          <h4 className="notes-title">Observações do Plano</h4>
          <p className="notes-content">{dieta.observacoesPlano}</p>
        </Card>
      )}

      {/* Modal de troca de alimento */}
      <FoodSwapModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        foodItem={selectedFoodItem}
        mealName={dieta?.refeicoes?.[selectedMealIndex]?.nome || ''}
        mealIndex={selectedMealIndex}
        itemIndex={selectedItemIndex}
        onConfirm={handleSwapConfirm}
        dieta={dieta}
      />
    </div>
  )
}

export default DietDisplay
