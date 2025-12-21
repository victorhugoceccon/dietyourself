import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfessionalLayout from './ProfessionalLayout'
import Questionnaire from './Questionnaire'
import NutritionDashboard from './NutritionDashboard'
import DietDisplay from './DietDisplay'
import LoadingBar from './LoadingBar'
import UserProfile from './UserProfile'
import DailyCheckInModal from './DailyCheckInModal'
import ProgressTimeline from './ProgressTimeline'
import WeeklyAdherence from './WeeklyAdherence'
import PacienteTreinos from './PacienteTreinos'
import { hasAnyRole } from '../utils/roleUtils'
import { API_URL } from '../config/api'
import './Paciente.css'

function Paciente() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingQuestionnaire, setCheckingQuestionnaire] = useState(true)
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false)
  const [generatingDiet, setGeneratingDiet] = useState(false)
  const [dietError, setDietError] = useState('')
  const [dietRefreshTrigger, setDietRefreshTrigger] = useState(0)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0)
  const [treinosRefreshTrigger] = useState(0)
  const [activeSection, setActiveSection] = useState('profile')
  const navigate = useNavigate()

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      navigate('/login')
      return
    }

    const userData = JSON.parse(storedUser)
    
    // Verificar se tem acesso de paciente
    if (!hasAnyRole(userData, ['PACIENTE', 'USUARIO'])) {
      navigate('/login')
      return
    }

    setUser(userData)
    
    // Verificar se já completou o questionário
    checkQuestionnaireStatus(token)
    
    // Verificar se precisa mostrar o check-in modal
    checkTodayCheckIn(token)
  }, [navigate])
  
  const checkTodayCheckIn = async (token) => {
    try {
      const response = await fetch(`${API_URL}/checkin/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // A lógica do backend já decide se deve mostrar o check-in:
        // - Só após existir uma dieta
        // - A partir do dia seguinte à criação da dieta
        // - Apenas se ainda não houver check-in hoje
        if (data.shouldShowCheckIn) {
          setShowCheckInModal(true)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar check-in de hoje:', error)
    }
  }
  
  const handleCheckInComplete = () => {
    setShowCheckInModal(false)
    // Atualizar estatísticas e perfil
    setDietRefreshTrigger(prev => prev + 1)
    setProfileRefreshTrigger(prev => prev + 1)
  }

  const handleWeightUpdate = () => {
    // Abrir modal de check-in para atualizar peso
    setShowCheckInModal(true)
  }


  const checkQuestionnaireStatus = async (token) => {
    try {
      const response = await fetch(`${API_URL}/questionnaire/check`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHasCompletedQuestionnaire(data.hasCompleted)
      }
    } catch (error) {
      console.error('Erro ao verificar questionário:', error)
    } finally {
      setCheckingQuestionnaire(false)
      setLoading(false)
    }
  }

  const handleQuestionnaireComplete = () => {
    setHasCompletedQuestionnaire(true)
  }

  const handleGenerateDiet = async () => {
    setGeneratingDiet(true)
    setDietError('')

    // Timeout de 11 minutos (660 segundos) - um pouco mais que o backend (10 min padrão)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 660000) // 11 minutos

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

      // Tentar ler a resposta como JSON, mas se falhar, usar texto
      let data
      try {
        const responseText = await response.text()
        if (!responseText) {
          throw new Error('Resposta vazia do servidor')
        }
        
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError)
          console.error('   Mensagem:', parseError.message)
          console.error('   Posição do erro:', parseError.message.match(/position (\d+)/)?.[1] || 'desconhecida')
          console.error('   Primeiros 1000 caracteres da resposta:', responseText.substring(0, 1000))
          
          // Tentar encontrar onde está o erro
          const errorPosition = parseError.message.match(/position (\d+)/)?.[1]
          if (errorPosition) {
            const pos = parseInt(errorPosition)
            const start = Math.max(0, pos - 100)
            const end = Math.min(responseText.length, pos + 100)
            console.error('   Contexto do erro (posição ' + pos + '):', responseText.substring(start, end))
          }
          
          throw new Error(`Erro ao processar resposta do servidor: ${parseError.message}. Verifique os logs do console para mais detalhes.`)
        }
      } catch (error) {
        // Se já é um erro de parse, re-lançar
        if (error.message.includes('Erro ao processar')) {
          throw error
        }
        console.error('Erro ao ler resposta:', error)
        throw new Error('Erro ao ler resposta do servidor: ' + error.message)
      }

      if (!response.ok) {
        // Incluir detalhes do erro se disponíveis
        const errorMessage = data.error || 'Erro ao gerar dieta'
        const errorDetails = data.details ? `: ${data.details}` : ''
        console.error('❌ Erro do servidor:', {
          status: response.status,
          error: errorMessage,
          details: data.details,
          fullResponse: data
        })
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      console.log('✅ Dieta gerada com sucesso!')
      console.log('   - nutritionalNeeds:', data.nutritionalNeeds ? 'presente' : 'ausente')
      console.log('   - dieta:', data.dieta ? 'presente' : 'ausente')

      // Salvar dados nutricionais se vierem na resposta
      if (data.nutritionalNeeds) {
        localStorage.setItem('nutritionalNeeds', JSON.stringify(data.nutritionalNeeds))
        console.log('💾 nutritionalNeeds salvo no localStorage')
      } else {
        console.warn('⚠️ nutritionalNeeds não veio na resposta')
      }

      // Pequeno delay para garantir que o servidor salvou a dieta antes de recarregar
      setTimeout(() => {
        // Trigger refresh do componente de dieta e necessidades nutricionais
        setDietRefreshTrigger(prev => prev + 1)
      }, 500)
      
      return true
    } catch (error) {
      console.error('Erro ao gerar dieta:', error)
      
      // Verificar se é um erro de timeout
          if (error.name === 'AbortError') {
            setDietError('Tempo limite de 11 minutos excedido. A geração da dieta está demorando mais que o esperado. Por favor, otimize o prompt do agente N8N (veja PROMPT_OTIMIZADO_N8N.md) ou tente novamente.')
          } else {
        setDietError(error.message || 'Erro ao gerar dieta. Tente novamente.')
      }
      
      return false
    } finally {
      clearTimeout(timeoutId) // Garantir que o timeout seja limpo mesmo em caso de erro
      setGeneratingDiet(false)
    }
  }


  if (loading || checkingQuestionnaire) {
    return (
      <ProfessionalLayout allowedRoles={['PACIENTE', 'USUARIO']}>
        <LoadingBar message="Carregando..." />
      </ProfessionalLayout>
    )
  }

  // Se ainda não completou o questionário, mostrar o formulário
  if (!hasCompletedQuestionnaire) {
    return <Questionnaire onComplete={handleQuestionnaireComplete} />
  }

  const navItems = (
    <>
      <button
        className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
        onClick={() => scrollToSection('profile')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span className="nav-text">Perfil</span>
      </button>
      <button
        className={`nav-item ${activeSection === 'adherence' ? 'active' : ''}`}
        onClick={() => scrollToSection('adherence')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span className="nav-text">Aderência</span>
      </button>
      <button
        className={`nav-item ${activeSection === 'nutrition' ? 'active' : ''}`}
        onClick={() => scrollToSection('nutrition')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <span className="nav-text">Nutrição</span>
      </button>
      <button
        className={`nav-item ${activeSection === 'diet' ? 'active' : ''}`}
        onClick={() => scrollToSection('diet')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span className="nav-text">Dieta</span>
      </button>
      <button
        className={`nav-item ${activeSection === 'treinos' ? 'active' : ''}`}
        onClick={() => scrollToSection('treinos')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <path d="M6 14h12"></path>
        </svg>
        <span className="nav-text">Treinos</span>
      </button>
      <button
        className={`nav-item ${activeSection === 'progress' ? 'active' : ''}`}
        onClick={() => scrollToSection('progress')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span className="nav-text">Progresso</span>
      </button>
    </>
  )

  return (
    <ProfessionalLayout 
      allowedRoles={['PACIENTE', 'USUARIO']} 
      headerNavItems={navItems}
      headerNavClassName="header-nav-items-paciente"
    >
      <div className="paciente-content-wrapper">
        {/* Navegação por Tabs - Mobile apenas */}
        <nav className="paciente-nav">
          <div className="nav-content">
            {navItems}
          </div>
        </nav>

        {/* Conteúdo Principal */}
        <div className="paciente-main-content">
          {/* Profile Section */}
          <section id="profile" className="profile-section">
            <UserProfile
              userId={user?.id}
              userName={user?.name}
              userEmail={user?.email}
              onWeightUpdate={handleWeightUpdate}
              refreshTrigger={profileRefreshTrigger}
            />
          </section>

          {/* Aderência Semanal */}
          <section id="adherence" className="adherence-section">
            <WeeklyAdherence refreshTrigger={dietRefreshTrigger} />
          </section>

          {/* Dashboard Nutricional */}
          <section id="nutrition" className="nutrition-section">
            <NutritionDashboard 
              refreshTrigger={dietRefreshTrigger}
            />
          </section>

          <section id="diet" className="diet-section">
            <div className="section-header">
              <h2>Minha Dieta</h2>
              <span className="badge">Paciente</span>
              <button
                onClick={handleGenerateDiet}
                disabled={generatingDiet}
                className="generate-diet-btn"
              >
                {generatingDiet ? 'Gerando...' : 'Gerar Dieta'}
              </button>
            </div>

            {dietError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {dietError}
              </div>
            )}

            {generatingDiet ? (
              <div>
                <LoadingBar message="Gerando sua dieta personalizada..." />
                <div className="diet-generation-info" style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#f0f7ff', 
                  borderRadius: '8px', 
                  border: '1px solid #b3d9ff',
                  textAlign: 'center',
                  color: '#0066cc'
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    ⏱️ A geração da dieta pode levar até <strong>10 minutos</strong> para ser concluída. Se demorar mais, otimize o prompt do agente N8N. 
                    Por favor, aguarde...
                  </p>
                </div>
              </div>
            ) : (
              <DietDisplay 
                onGenerateDiet={handleGenerateDiet} 
                refreshTrigger={dietRefreshTrigger}
                onMealToggle={() => {
                  setDietRefreshTrigger(prev => prev + 1)
                }}
              />
            )}
          </section>

          {/* Treinos do Personal (se existirem) */}
          <section id="treinos" className="treinos-section">
            <PacienteTreinos refreshTrigger={treinosRefreshTrigger} />
          </section>

          {/* Linha do Tempo de Progresso */}
          <section id="progress" className="timeline-section">
            <ProgressTimeline refreshTrigger={dietRefreshTrigger} />
          </section>
        </div>
      </div>
      
      {/* Modal de Check-in */}
      {showCheckInModal && (
        <DailyCheckInModal
          onClose={() => setShowCheckInModal(false)}
          onCheckInComplete={handleCheckInComplete}
        />
      )}
    </ProfessionalLayout>
  )
}

export default Paciente

