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
      const storedUser = localStorage.getItem('user')
      const userData = storedUser ? JSON.parse(storedUser) : null
      const userRole = userData?.role?.toUpperCase()
      
      console.log('🔍 Carregando dieta do paciente:', paciente.id)
      console.log('   - Role do usuário:', userRole)
      
      // Determinar a rota baseada no role do usuário
      let apiRoute
      if (userRole === 'PERSONAL') {
        apiRoute = `${API_URL}/personal/pacientes/${paciente.id}/dieta`
      } else {
        // Default para nutricionista (compatibilidade)
        apiRoute = `${API_URL}/nutricionista/pacientes/${paciente.id}/dieta`
      }
      
      console.log('   - Rota da API:', apiRoute)
      
      const response = await fetch(apiRoute, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('   - Status da resposta:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('❌ Erro na resposta:', response.status, errorData)
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Dados carregados:', data)
      
      // Atualizar paciente com dados completos do backend
      if (data.paciente) {
        setPacienteCompleto(data.paciente)
      }
      
      // Processar dieta - pode vir como data.dieta ou data.dieta.dieta
      // A nova estrutura salva é: { nutritionalNeeds: {...}, dieta: {...} }
      // Então data.dieta pode ser o objeto completo ou apenas a dieta
      let dietaRaw = null
      let nutritionalNeeds = null
      
      if (data.dieta) {
        // Se data.dieta tem propriedade 'dieta', é o formato antigo { dieta: { dieta: {...}, nutritionalNeeds: {...} } }
        if (data.dieta.dieta) {
          dietaRaw = data.dieta.dieta
          nutritionalNeeds = data.dieta.nutritionalNeeds || data.nutritionalNeeds
        } 
        // Se data.dieta tem 'refeicoes', é o objeto dieta direto
        else if (data.dieta.refeicoes) {
          dietaRaw = data.dieta
          nutritionalNeeds = data.nutritionalNeeds
        }
        // Caso contrário, usar data.dieta diretamente
        else {
          dietaRaw = data.dieta
          nutritionalNeeds = data.nutritionalNeeds
        }
      }
      
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
        console.log('⚠️  Nenhuma dieta encontrada para o paciente')
        setDieta(null)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dieta:', error)
      console.error('   - Tipo do erro:', error.constructor.name)
      console.error('   - Mensagem:', error.message)
      console.error('   - Stack:', error.stack)
      setDietError(error.message || 'Erro ao carregar dados. Tente novamente.')
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
      const storedUser = localStorage.getItem('user')
      const userData = storedUser ? JSON.parse(storedUser) : null
      const userRole = userData?.role?.toUpperCase()
      
      // Determinar a rota baseada no role do usuário
      let apiRoute
      if (userRole === 'PERSONAL') {
        // Personal não pode gerar dieta, apenas visualizar
        throw new Error('Personal trainers não podem gerar dietas. Entre em contato com um nutricionista.')
      } else {
        // Default para nutricionista
        apiRoute = `${API_URL}/nutricionista/pacientes/${paciente.id}/dieta/generate`
      }
      
      const response = await fetch(apiRoute, {
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

  const formatAlimentos = (alimentos) => {
    if (!alimentos || (Array.isArray(alimentos) && alimentos.length === 0)) {
      return 'Nenhum selecionado'
    }
    if (Array.isArray(alimentos)) {
      return alimentos.join(', ')
    }
    return 'Nenhum selecionado'
  }

  const getObjetivoColor = (objetivo) => {
    const cores = {
      'Emagrecer': '#FF6B6B',
      'Manter peso': '#4ECDC4',
      'Ganhar massa muscular': '#95E1D3',
      'Ganhar peso de forma geral': '#95E1D3'
    }
    return cores[objetivo] || '#95A5A6'
  }


  // Usar dados completos do backend ou fallback para dados do prop
  const pacienteData = pacienteCompleto || paciente || {}
  let questionnaireData = pacienteData?.questionnaireData
  
  // Parse alimentosDoDiaADia se for string (vem do backend como JSON string)
  if (questionnaireData?.alimentosDoDiaADia && typeof questionnaireData.alimentosDoDiaADia === 'string') {
    try {
      questionnaireData.alimentosDoDiaADia = JSON.parse(questionnaireData.alimentosDoDiaADia)
    } catch (e) {
      questionnaireData.alimentosDoDiaADia = { carboidratos: [], proteinas: [], gorduras: [], frutas: [] }
    }
  }

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
        <div className="paciente-header-top">
          <div className="paciente-main-info">
            <h2 className="paciente-nome">{pacienteData?.name || pacienteData?.email || paciente?.name || paciente?.email || 'Paciente'}</h2>
            <p className="paciente-email">{pacienteData?.email || paciente?.email || ''}</p>
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

      {/* Painel do Questionário - Novo formato de 7 blocos */}
      {showQuestionnaire && questionnaireData && (
        <div className="questionnaire-panel">
          <div className="questionnaire-grid">
            {/* Bloco 1: Dados Básicos */}
            <div className="questionnaire-col">
              <h3>📋 Dados Básicos</h3>
              <div className="info-grid">
                {questionnaireData.idade && (
                  <div className="info-item">
                    <span className="info-label">Idade</span>
                    <span className="info-data">{questionnaireData.idade} anos</span>
                  </div>
                )}
                {questionnaireData.sexo && (
                  <div className="info-item">
                    <span className="info-label">Sexo</span>
                    <span className="info-data">{questionnaireData.sexo}</span>
                  </div>
                )}
                {questionnaireData.altura && (
                  <div className="info-item">
                    <span className="info-label">Altura</span>
                    <span className="info-data">{questionnaireData.altura} cm</span>
                  </div>
                )}
                {questionnaireData.pesoAtual && (
                  <div className="info-item">
                    <span className="info-label">Peso Atual</span>
                    <span className="info-data">{questionnaireData.pesoAtual} kg</span>
                  </div>
                )}
                {questionnaireData.objetivo && (
                  <div className="info-item">
                    <span className="info-label">Objetivo</span>
                    <span className="info-data">{questionnaireData.objetivo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Rotina e Atividade */}
            <div className="questionnaire-col">
              <h3>🏃 Rotina e Atividade</h3>
              <div className="info-grid">
                {questionnaireData.frequenciaAtividade && (
                  <div className="info-item">
                    <span className="info-label">Frequência de Atividade</span>
                    <span className="info-data">{questionnaireData.frequenciaAtividade}</span>
                  </div>
                )}
                {questionnaireData.tipoAtividade && (
                  <div className="info-item">
                    <span className="info-label">Tipo de Atividade</span>
                    <span className="info-data">{questionnaireData.tipoAtividade}</span>
                  </div>
                )}
                {questionnaireData.horarioTreino && (
                  <div className="info-item">
                    <span className="info-label">Horário de Treino</span>
                    <span className="info-data">{questionnaireData.horarioTreino}</span>
                  </div>
                )}
                {questionnaireData.rotinaDiaria && (
                  <div className="info-item">
                    <span className="info-label">Rotina Diária</span>
                    <span className="info-data">{questionnaireData.rotinaDiaria}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 3: Estrutura da Dieta */}
            <div className="questionnaire-col">
              <h3>🍽️ Estrutura da Dieta</h3>
              <div className="info-grid">
                {questionnaireData.quantidadeRefeicoes && (
                  <div className="info-item">
                    <span className="info-label">Quantidade de Refeições</span>
                    <span className="info-data">{questionnaireData.quantidadeRefeicoes}</span>
                  </div>
                )}
                {questionnaireData.preferenciaRefeicoes && (
                  <div className="info-item">
                    <span className="info-label">Preferência de Refeições</span>
                    <span className="info-data">{questionnaireData.preferenciaRefeicoes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 4: Complexidade e Adesão */}
            <div className="questionnaire-col">
              <h3>⚖️ Complexidade e Adesão</h3>
              <div className="info-grid">
                {questionnaireData.confortoPesar && (
                  <div className="info-item">
                    <span className="info-label">Conforto em Pesar</span>
                    <span className="info-data">{questionnaireData.confortoPesar}</span>
                  </div>
                )}
                {questionnaireData.tempoPreparacao && (
                  <div className="info-item">
                    <span className="info-label">Tempo de Preparação</span>
                    <span className="info-data">{questionnaireData.tempoPreparacao}</span>
                  </div>
                )}
                {questionnaireData.preferenciaVariacao && (
                  <div className="info-item">
                    <span className="info-label">Preferência de Variação</span>
                    <span className="info-data">{questionnaireData.preferenciaVariacao}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 5: Alimentos do Dia a Dia */}
            {questionnaireData.alimentosDoDiaADia && (
              <div className="questionnaire-col">
                <h3>🥗 Alimentos do Dia a Dia</h3>
                <div className="info-grid">
                  {questionnaireData.alimentosDoDiaADia.carboidratos?.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Carboidratos</span>
                      <span className="info-data">{formatAlimentos(questionnaireData.alimentosDoDiaADia.carboidratos)}</span>
                    </div>
                  )}
                  {questionnaireData.alimentosDoDiaADia.proteinas?.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Proteínas</span>
                      <span className="info-data">{formatAlimentos(questionnaireData.alimentosDoDiaADia.proteinas)}</span>
                    </div>
                  )}
                  {questionnaireData.alimentosDoDiaADia.gorduras?.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Gorduras</span>
                      <span className="info-data">{formatAlimentos(questionnaireData.alimentosDoDiaADia.gorduras)}</span>
                    </div>
                  )}
                  {questionnaireData.alimentosDoDiaADia.frutas?.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Frutas</span>
                      <span className="info-data">{formatAlimentos(questionnaireData.alimentosDoDiaADia.frutas)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bloco 6: Restrições */}
            <div className="questionnaire-col">
              <h3>🚫 Restrições</h3>
              <div className="info-grid">
                {questionnaireData.restricaoAlimentar && (
                  <div className="info-item">
                    <span className="info-label">Restrição Alimentar</span>
                    <span className="info-data">{questionnaireData.restricaoAlimentar}</span>
                  </div>
                )}
                {questionnaireData.restricaoAlimentar === 'Outra' && questionnaireData.outraRestricao && (
                  <div className="info-item">
                    <span className="info-label">Especifique</span>
                    <span className="info-data">{questionnaireData.outraRestricao}</span>
                  </div>
                )}
                {questionnaireData.alimentosEvita && (
                  <div className="info-item">
                    <span className="info-label">Alimentos que Evita</span>
                    <span className="info-data">{questionnaireData.alimentosEvita}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 7: Flexibilidade */}
            <div className="questionnaire-col">
              <h3>🔄 Flexibilidade</h3>
              <div className="info-grid">
                {questionnaireData.opcoesSubstituicao && (
                  <div className="info-item">
                    <span className="info-label">Opções de Substituição</span>
                    <span className="info-data">{questionnaireData.opcoesSubstituicao}</span>
                  </div>
                )}
                {questionnaireData.refeicoesLivres && (
                  <div className="info-item">
                    <span className="info-label">Refeições Livres</span>
                    <span className="info-data">{questionnaireData.refeicoesLivres}</span>
                  </div>
                )}
              </div>
            </div>
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
