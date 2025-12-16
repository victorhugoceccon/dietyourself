import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import LoadingBar from './LoadingBar'
import './PacienteDetailView.css'

function PacienteDetailView({ paciente, onUpdate }) {
  const navigate = useNavigate()
  const [dieta, setDieta] = useState(null)
  const [pacienteCompleto, setPacienteCompleto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [generatingDiet, setGeneratingDiet] = useState(false)
  const [dietError, setDietError] = useState('')
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)

  useEffect(() => {
    if (paciente?.id) {
      loadPacienteDieta()
    }
  }, [paciente?.id])

  const loadPacienteDieta = async () => {
    setLoading(true)
    setDietError('')
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/nutricionista/pacientes/${paciente.id}/dieta`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dados carregados:', data)
        
        // Atualizar paciente com dados completos do backend
        if (data.paciente) {
          setPacienteCompleto(data.paciente)
        }
        
        // Processar dieta - pode vir como data.dieta ou data.dieta.dieta
        let dietaRaw = data.dieta?.dieta || data.dieta
        const nutritionalNeeds = data.dieta?.nutritionalNeeds || data.nutritionalNeeds
        
        if (dietaRaw) {
          let dietaProcessada = { ...dietaRaw }
          
          // Calcular totalDiaKcal se não existir ou estiver zerado
          if (!dietaProcessada.totalDiaKcal || dietaProcessada.totalDiaKcal === 0) {
            // Tentar usar nutritionalNeeds primeiro
            if (nutritionalNeeds?.calorias) {
              dietaProcessada.totalDiaKcal = nutritionalNeeds.calorias
            } else {
              // Calcular a partir das refeições
              const total = dietaProcessada.refeicoes?.reduce((sum, r) => {
                return sum + (r.totalRefeicaoKcal || 0)
              }, 0) || 0
              dietaProcessada.totalDiaKcal = total
            }
          }
          
          // Calcular macrosDia se não existir ou estiver zerado
          if (!dietaProcessada.macrosDia || 
              (dietaProcessada.macrosDia.proteina_g === 0 && 
               dietaProcessada.macrosDia.carbo_g === 0 && 
               dietaProcessada.macrosDia.gordura_g === 0)) {
            
            // Tentar usar nutritionalNeeds primeiro
            if (nutritionalNeeds?.macros) {
              dietaProcessada.macrosDia = {
                proteina_g: Math.round((nutritionalNeeds.macros.proteina || 0) * 10) / 10,
                carbo_g: Math.round((nutritionalNeeds.macros.carboidrato || 0) * 10) / 10,
                gordura_g: Math.round((nutritionalNeeds.macros.gordura || 0) * 10) / 10
              }
            } else {
              // Calcular a partir dos itens das refeições
              let totalProteina = 0
              let totalCarbo = 0
              let totalGordura = 0

              dietaProcessada.refeicoes?.forEach(refeicao => {
                refeicao.itens?.forEach(item => {
                  if (item.macros) {
                    totalProteina += item.macros.proteina_g || 0
                    totalCarbo += item.macros.carbo_g || 0
                    totalGordura += item.macros.gordura_g || 0
                  }
                })
              })

              dietaProcessada.macrosDia = {
                proteina_g: Math.round(totalProteina * 10) / 10,
                carbo_g: Math.round(totalCarbo * 10) / 10,
                gordura_g: Math.round(totalGordura * 10) / 10
              }
            }
          }
          
          console.log('📊 Dieta processada:', {
            totalDiaKcal: dietaProcessada.totalDiaKcal,
            macrosDia: dietaProcessada.macrosDia,
            numRefeicoes: dietaProcessada.refeicoes?.length || 0
          })
          
          setDieta(dietaProcessada)
        } else {
          setDieta(null)
        }
      } else if (response.status === 404) {
        setDieta(null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setDietError(errorData.error || 'Erro ao carregar dieta')
        setDieta(null)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dieta:', error)
      setDietError('Erro ao carregar dados. Tente novamente.')
      setDieta(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDietSaved = () => {
    loadPacienteDieta()
    if (onUpdate) onUpdate()
  }

  const handleGenerateDietAI = async () => {
    setGeneratingDiet(true)
    setDietError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/pacientes/${paciente.id}/dieta/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar dieta por IA.')
      }
      
      await loadPacienteDieta()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Erro ao gerar dieta por IA:', error)
      setDietError(error.message || 'Erro ao gerar dieta por IA. Verifique se o questionário do paciente está completo.')
    } finally {
      setGeneratingDiet(false)
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

  const parseRestricoes = (restricoes) => {
    if (!restricoes) return []
    try {
      return typeof restricoes === 'string' ? JSON.parse(restricoes) : restricoes
    } catch {
      return []
    }
  }

  const getObjetivoColor = (objetivo) => {
    const cores = {
      'Emagrecer': '#FF6B6B',
      'Manter peso': '#4ECDC4',
      'Ganhar massa muscular': '#95E1D3'
    }
    return cores[objetivo] || '#95A5A6'
  }


  // Usar dados completos do backend ou fallback para dados do prop
  const pacienteData = pacienteCompleto || paciente || {}
  const questionnaireData = pacienteData?.questionnaireData

  if (loading) {
    return (
      <div className="paciente-detail-loading">
        <div className="loading-spinner-large"></div>
        <p>Carregando dados do paciente...</p>
      </div>
    )
  }

  if (!paciente || !paciente.id) {
    return (
      <div className="paciente-detail-container">
        <div className="no-paciente-selected">
          <p>Nenhum paciente selecionado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="paciente-detail-container">
      {/* Header do Paciente */}
      <div className="paciente-header-card">
        <div className="paciente-header-info">
          <div className="paciente-main-info">
            <h2 className="paciente-nome">{pacienteData?.name || pacienteData?.email || paciente?.name || paciente?.email || 'Paciente'}</h2>
            <p className="paciente-email">{pacienteData?.email || paciente?.email || ''}</p>
          </div>
          
          {questionnaireData && (
            <div className="paciente-stats">
              {questionnaireData.idade && (
                <div className="stat-item">
                  <span className="stat-label">Idade</span>
                  <span className="stat-value">{questionnaireData.idade} anos</span>
                </div>
              )}
              {questionnaireData.sexo && (
                <div className="stat-item">
                  <span className="stat-label">Sexo</span>
                  <span className="stat-value">{questionnaireData.sexo}</span>
                </div>
              )}
              {questionnaireData.altura && (
                <div className="stat-item">
                  <span className="stat-label">Altura</span>
                  <span className="stat-value">{questionnaireData.altura} cm</span>
                </div>
              )}
              {questionnaireData.pesoAtual && (
                <div className="stat-item">
                  <span className="stat-label">Peso</span>
                  <span className="stat-value">{questionnaireData.pesoAtual} kg</span>
                </div>
              )}
              {questionnaireData.objetivo && (
                <div className="stat-item objetivo-item">
                  <span 
                    className="objetivo-badge"
                    style={{ backgroundColor: getObjetivoColor(questionnaireData.objetivo) + '20', color: getObjetivoColor(questionnaireData.objetivo) }}
                  >
                    {questionnaireData.objetivo}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="paciente-header-actions">
          {questionnaireData && (
            <button
              type="button"
              onClick={() => setShowQuestionnaire(!showQuestionnaire)}
              className={`btn-info ${showQuestionnaire ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Questionário
            </button>
          )}
          {dieta && (
            <button
              type="button"
              onClick={() => {
                // Navegar para a página de edição ao invés de abrir modal
                navigate(`/nutricionista/pacientes/${paciente.id}/editar-dieta`)
              }}
              className="btn-edit"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Editar Dieta
            </button>
          )}
        </div>
      </div>

      {/* Painel do Questionário */}
      {showQuestionnaire && questionnaireData && (
        <div className="questionnaire-panel">
          <div className="questionnaire-grid">
            <div className="questionnaire-col">
              <h3>Informações Básicas</h3>
              <div className="info-grid">
                {questionnaireData.nivelAtividade && (
                  <div className="info-item">
                    <span className="info-label">Nível de Atividade</span>
                    <span className="info-data">{questionnaireData.nivelAtividade}</span>
                  </div>
                )}
                {questionnaireData.refeicoesDia && (
                  <div className="info-item">
                    <span className="info-label">Refeições por dia</span>
                    <span className="info-data">{questionnaireData.refeicoesDia}</span>
                  </div>
                )}
                {questionnaireData.preferenciaAlimentacao && (
                  <div className="info-item">
                    <span className="info-label">Preferência alimentar</span>
                    <span className="info-data">{questionnaireData.preferenciaAlimentacao}</span>
                  </div>
                )}
                {questionnaireData.costumaCozinhar && (
                  <div className="info-item">
                    <span className="info-label">Cozinha</span>
                    <span className="info-data">{questionnaireData.costumaCozinhar}</span>
                  </div>
                )}
              </div>
            </div>

            {(parseRestricoes(questionnaireData.restricoes).length > 0 || questionnaireData.alimentosNaoGosta) && (
              <div className="questionnaire-col">
                <h3>Restrições e Preferências</h3>
                <div className="info-grid">
                  {parseRestricoes(questionnaireData.restricoes).length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Restrições</span>
                      <div className="tags-container">
                        {parseRestricoes(questionnaireData.restricoes).map((r, idx) => (
                          <span key={idx} className="tag-item">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {questionnaireData.alimentosNaoGosta && (
                    <div className="info-item">
                      <span className="info-label">Não gosta de</span>
                      <span className="info-data">{questionnaireData.alimentosNaoGosta}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {questionnaireData.observacoes && (
              <div className="questionnaire-col full-width">
                <h3>Observações</h3>
                <div className="observacoes-box">
                  {questionnaireData.observacoes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Erro */}
      {dietError && (
        <div className="error-alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {dietError}
        </div>
      )}

      {/* Conteúdo Principal */}
      {!dieta ? (
        <div className="no-dieta-card">
          <div className="no-dieta-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>Paciente ainda não tem dieta</h3>
          <p>Gere uma dieta personalizada baseada no questionário do paciente</p>
          <button
            type="button"
            onClick={handleGenerateDietAI}
            disabled={generatingDiet}
            className="btn-generate"
          >
            {generatingDiet ? (
              <>
                <div className="spinner-small"></div>
                Gerando...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Gerar Dieta por IA
              </>
            )}
          </button>
          {generatingDiet && <LoadingBar message="Gerando dieta personalizada..." />}
        </div>
      ) : (
        <div className="dieta-container">
          {/* Resumo Nutricional */}
          <div className="summary-section">
            {/* Total Calórico Diário */}
            <div className="macro-item total-calories">
              <div className="macro-icon" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="macro-info">
                <div className="macro-name">Total Calórico Diário</div>
                <div className="macro-amount">{dieta.totalDiaKcal || 0} kcal</div>
              </div>
            </div>

            {/* Proteína */}
            <div className="macro-item">
              <div className="macro-icon" style={{ backgroundColor: 'rgba(33, 150, 243, 0.1)', color: '#2196F3' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="macro-info">
                <div className="macro-name">Proteína</div>
                <div className="macro-amount">{dieta.macrosDia?.proteina_g || 0}g</div>
              </div>
            </div>

            {/* Carboidrato */}
            <div className="macro-item">
              <div className="macro-icon" style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', color: '#FF9800' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="macro-info">
                <div className="macro-name">Carboidrato</div>
                <div className="macro-amount">{dieta.macrosDia?.carbo_g || 0}g</div>
              </div>
            </div>

            {/* Gordura */}
            <div className="macro-item">
              <div className="macro-icon" style={{ backgroundColor: 'rgba(156, 39, 176, 0.1)', color: '#9C27B0' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="macro-info">
                <div className="macro-name">Gordura</div>
                <div className="macro-amount">{dieta.macrosDia?.gordura_g || 0}g</div>
              </div>
            </div>
          </div>

          {/* Refeições */}
          <div className="meals-section">
            <h3 className="meals-title">Refeições</h3>
            <div className="meals-list">
              {dieta.refeicoes && dieta.refeicoes.length > 0 ? (
                dieta.refeicoes.map((refeicao, mealIndex) => (
                  <div key={mealIndex} className="meal-card">
                    <button
                      type="button"
                      className={`meal-header-btn ${expandedMeals.has(mealIndex) ? 'expanded' : ''}`}
                      onClick={() => toggleMeal(mealIndex)}
                    >
                      <div className="meal-header-left">
                        <h4 className="meal-title">{refeicao.nome}</h4>
                        <span className="meal-kcal-badge">{refeicao.totalRefeicaoKcal || 0} kcal</span>
                      </div>
                      <svg
                        className={`meal-arrow ${expandedMeals.has(mealIndex) ? 'expanded' : ''}`}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {expandedMeals.has(mealIndex) && refeicao.itens && refeicao.itens.length > 0 && (
                      <div className="meal-content">
                        {refeicao.itens.map((item, itemIndex) => (
                          <div key={itemIndex} className="food-item-card">
                            <div className="food-main">
                              <div className="food-name">{item.alimento}</div>
                              <div className="food-meta">
                                <span className="food-portion">{item.porcao}</span>
                                <span className="food-kcal">{item.kcal} kcal</span>
                              </div>
                            </div>
                            {item.macros && (
                              <div className="food-macros-row">
                                <span className="food-macro">P: {item.macros.proteina_g || 0}g</span>
                                <span className="food-macro">C: {item.macros.carbo_g || 0}g</span>
                                <span className="food-macro">G: {item.macros.gordura_g || 0}g</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-meals">
                  <p>Nenhuma refeição cadastrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PacienteDetailView
