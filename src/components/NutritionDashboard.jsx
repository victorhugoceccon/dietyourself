import { useState, useEffect } from 'react'
import './NutritionDashboard.css'

const API_URL = 'http://localhost:5000/api'

// Tooltips educativos sobre macronutrientes
const MACRO_TOOLTIPS = {
  calorias: {
    title: 'Calorias',
    description: 'As calorias são a energia que seu corpo precisa para funcionar. Manter o equilíbrio entre o que você consome e o que gasta é fundamental para alcançar seus objetivos.',
    icon: '⚡'
  },
  proteina: {
    title: 'Proteína',
    description: 'A proteína ajuda a construir e reparar músculos, mantém você saciado por mais tempo e é essencial para o bom funcionamento do organismo. Priorize fontes magras como frango, peixe, ovos e leguminosas.',
    icon: '💪'
  },
  carboidrato: {
    title: 'Carboidratos',
    description: 'Os carboidratos são a principal fonte de energia do seu corpo. Escolha versões integrais e naturais, como frutas, batata-doce e grãos integrais, que fornecem energia de forma mais estável.',
    icon: '🌾'
  },
  gordura: {
    title: 'Gorduras',
    description: 'As gorduras boas são importantes para a absorção de vitaminas, saúde do cérebro e produção de hormônios. Priorize fontes como abacate, castanhas, azeite e peixes gordurosos.',
    icon: '🥑'
  }
}

function NutritionDashboard({ refreshTrigger }) {
  const [nutritionData, setNutritionData] = useState(null)
  const [consumedData, setConsumedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tooltipOpen, setTooltipOpen] = useState(null)

  useEffect(() => {
    loadNutritionData()
    loadConsumedMeals()
  }, [refreshTrigger])
  
  const loadConsumedMeals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/consumed-meals/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConsumedData(data.totals || null)
      }
    } catch (error) {
      console.error('Erro ao carregar refeições consumidas:', error)
      setConsumedData(null)
    }
  }

  const loadNutritionData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Primeiro, tentar buscar do localStorage (dados salvos da geração de dieta)
      const savedNutritionalNeeds = localStorage.getItem('nutritionalNeeds')
      if (savedNutritionalNeeds) {
        try {
          const parsed = JSON.parse(savedNutritionalNeeds)
          if (parsed && parsed.calorias && parsed.macros) {
            setNutritionData(parsed)
            setLoading(false)
            return
          }
        } catch (e) {
          console.error('Erro ao parsear nutritionalNeeds do localStorage:', e)
        }
      }
      
      // Se não tiver no localStorage, tentar buscar da dieta gerada (que vem do N8N)
      const dietResponse = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (dietResponse.ok) {
        const dietData = await dietResponse.json()
        
        // Se a dieta tiver nutritionalNeeds (gerada pelo N8N), usar
        if (dietData.nutritionalNeeds) {
          setNutritionData(dietData.nutritionalNeeds)
          // Salvar no localStorage para próxima vez
          localStorage.setItem('nutritionalNeeds', JSON.stringify(dietData.nutritionalNeeds))
          setLoading(false)
          return
        }
      }
      
      setNutritionData(null)
    } catch (error) {
      console.error('Erro ao carregar dados nutricionais:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="nutrition-dashboard">
        <div className="loading">Carregando dados nutricionais...</div>
      </div>
    )
  }

  if (!nutritionData || !nutritionData.macros) {
    return (
      <div className="nutrition-dashboard">
        <div className="no-data">
          <p>Clique em "Gerar Dieta" para ver suas necessidades nutricionais calculadas pela IA</p>
        </div>
      </div>
    )
  }

  // Usar dados consumidos da API
  const consumedNutrition = consumedData || { 
    consumedKcal: 0, 
    consumedProtein: 0, 
    consumedCarbs: 0, 
    consumedFat: 0 
  }

  const totalCalories = nutritionData.calorias || 0
  const totalProtein = nutritionData.macros?.proteina || 0
  const totalCarbs = nutritionData.macros?.carboidrato || 0
  const totalFat = nutritionData.macros?.gordura || 0

  const consumedKcal = consumedNutrition.consumedKcal || 0
  const consumedProtein = consumedNutrition.consumedProtein || 0
  const consumedCarbs = consumedNutrition.consumedCarbs || 0
  const consumedFat = consumedNutrition.consumedFat || 0

  const remainingCalories = Math.max(0, totalCalories - consumedKcal)
  const remainingProtein = Math.max(0, totalProtein - consumedProtein)
  const remainingCarbs = Math.max(0, totalCarbs - consumedCarbs)
  const remainingFat = Math.max(0, totalFat - consumedFat)

  const caloriesPercentage = totalCalories > 0 ? Math.round((consumedKcal / totalCalories) * 100) : 0
  const proteinPercentage = totalProtein > 0 ? Math.round((consumedProtein / totalProtein) * 100) : 0
  const carbsPercentage = totalCarbs > 0 ? Math.round((consumedCarbs / totalCarbs) * 100) : 0
  const fatPercentage = totalFat > 0 ? Math.round((consumedFat / totalFat) * 100) : 0

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#F44336'
    if (percentage >= 80) return '#FF9800'
    return '#4CAF50'
  }

  return (
    <div className="nutrition-dashboard">
      <div className="dashboard-header">
        <h2>Suas Necessidades Nutricionais</h2>
        <p className="subtitle">Baseado no seu perfil e objetivos</p>
      </div>

      <div className="nutrition-cards">
        {/* Card de Calorias */}
        <div className="nutrition-card calories">
          <div className="card-header">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="card-title-wrapper">
              <h3>Calorias Diárias</h3>
              <button
                className="tooltip-trigger"
                onClick={() => setTooltipOpen(tooltipOpen === 'calorias' ? null : 'calorias')}
                onMouseEnter={() => setTooltipOpen('calorias')}
                onMouseLeave={() => setTooltipOpen(null)}
                aria-label="Informações sobre calorias"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {tooltipOpen === 'calorias' && (
                <div className="tooltip">
                  <div className="tooltip-header">
                    <span className="tooltip-icon">{MACRO_TOOLTIPS.calorias.icon}</span>
                    <span className="tooltip-title">{MACRO_TOOLTIPS.calorias.title}</span>
                  </div>
                  <p className="tooltip-description">{MACRO_TOOLTIPS.calorias.description}</p>
                </div>
              )}
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">{totalCalories}</div>
            <div className="card-unit">kcal/dia</div>
            <div className="card-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(caloriesPercentage, 100)}%`,
                    backgroundColor: getProgressColor(caloriesPercentage)
                  }}
                ></div>
              </div>
              <div className="progress-comparison">
                <span className="progress-consumed">{consumedKcal} kcal</span>
                <span className="progress-separator">de</span>
                <span className="progress-total">{totalCalories} kcal</span>
              </div>
              <div className="progress-remaining">
                {remainingCalories > 0 ? (
                  <span className="remaining-text">{remainingCalories} kcal restantes</span>
                ) : (
                  <span className="over-limit-text">Meta atingida!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Proteína */}
        <div className="nutrition-card protein">
          <div className="card-header">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="card-title-wrapper">
              <h3>Proteína</h3>
              <button
                className="tooltip-trigger"
                onClick={() => setTooltipOpen(tooltipOpen === 'proteina' ? null : 'proteina')}
                onMouseEnter={() => setTooltipOpen('proteina')}
                onMouseLeave={() => setTooltipOpen(null)}
                aria-label="Informações sobre proteína"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {tooltipOpen === 'proteina' && (
                <div className="tooltip">
                  <div className="tooltip-header">
                    <span className="tooltip-icon">{MACRO_TOOLTIPS.proteina.icon}</span>
                    <span className="tooltip-title">{MACRO_TOOLTIPS.proteina.title}</span>
                  </div>
                  <p className="tooltip-description">{MACRO_TOOLTIPS.proteina.description}</p>
                </div>
              )}
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">{totalProtein.toFixed(0)}</div>
            <div className="card-unit">gramas/dia</div>
            <div className="card-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(proteinPercentage, 100)}%`,
                    backgroundColor: getProgressColor(proteinPercentage)
                  }}
                ></div>
              </div>
              <div className="progress-comparison">
                <span className="progress-consumed">{consumedProtein.toFixed(1)}g</span>
                <span className="progress-separator">de</span>
                <span className="progress-total">{totalProtein.toFixed(0)}g</span>
              </div>
              <div className="progress-remaining">
                {remainingProtein > 0 ? (
                  <span className="remaining-text">{remainingProtein.toFixed(1)}g restantes</span>
                ) : (
                  <span className="over-limit-text">Meta atingida!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Carboidrato */}
        <div className="nutrition-card carbs">
          <div className="card-header">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="card-title-wrapper">
              <h3>Carboidratos</h3>
              <button
                className="tooltip-trigger"
                onClick={() => setTooltipOpen(tooltipOpen === 'carboidrato' ? null : 'carboidrato')}
                onMouseEnter={() => setTooltipOpen('carboidrato')}
                onMouseLeave={() => setTooltipOpen(null)}
                aria-label="Informações sobre carboidratos"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {tooltipOpen === 'carboidrato' && (
                <div className="tooltip">
                  <div className="tooltip-header">
                    <span className="tooltip-icon">{MACRO_TOOLTIPS.carboidrato.icon}</span>
                    <span className="tooltip-title">{MACRO_TOOLTIPS.carboidrato.title}</span>
                  </div>
                  <p className="tooltip-description">{MACRO_TOOLTIPS.carboidrato.description}</p>
                </div>
              )}
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">{totalCarbs.toFixed(0)}</div>
            <div className="card-unit">gramas/dia</div>
            <div className="card-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(carbsPercentage, 100)}%`,
                    backgroundColor: getProgressColor(carbsPercentage)
                  }}
                ></div>
              </div>
              <div className="progress-comparison">
                <span className="progress-consumed">{consumedCarbs.toFixed(1)}g</span>
                <span className="progress-separator">de</span>
                <span className="progress-total">{totalCarbs.toFixed(0)}g</span>
              </div>
              <div className="progress-remaining">
                {remainingCarbs > 0 ? (
                  <span className="remaining-text">{remainingCarbs.toFixed(1)}g restantes</span>
                ) : (
                  <span className="over-limit-text">Meta atingida!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Gordura */}
        <div className="nutrition-card fat">
          <div className="card-header">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="card-title-wrapper">
              <h3>Gorduras</h3>
              <button
                className="tooltip-trigger"
                onClick={() => setTooltipOpen(tooltipOpen === 'gordura' ? null : 'gordura')}
                onMouseEnter={() => setTooltipOpen('gordura')}
                onMouseLeave={() => setTooltipOpen(null)}
                aria-label="Informações sobre gorduras"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {tooltipOpen === 'gordura' && (
                <div className="tooltip">
                  <div className="tooltip-header">
                    <span className="tooltip-icon">{MACRO_TOOLTIPS.gordura.icon}</span>
                    <span className="tooltip-title">{MACRO_TOOLTIPS.gordura.title}</span>
                  </div>
                  <p className="tooltip-description">{MACRO_TOOLTIPS.gordura.description}</p>
                </div>
              )}
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">{totalFat.toFixed(0)}</div>
            <div className="card-unit">gramas/dia</div>
            <div className="card-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(fatPercentage, 100)}%`,
                    backgroundColor: getProgressColor(fatPercentage)
                  }}
                ></div>
              </div>
              <div className="progress-comparison">
                <span className="progress-consumed">{consumedFat.toFixed(1)}g</span>
                <span className="progress-separator">de</span>
                <span className="progress-total">{totalFat.toFixed(0)}g</span>
              </div>
              <div className="progress-remaining">
                {remainingFat > 0 ? (
                  <span className="remaining-text">{remainingFat.toFixed(1)}g restantes</span>
                ) : (
                  <span className="over-limit-text">Meta atingida!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NutritionDashboard
