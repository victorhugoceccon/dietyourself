import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Questionnaire from './Questionnaire'
import NutritionDashboard from './NutritionDashboard'
import DietDisplay from './DietDisplay'
import ChatWidget from './ChatWidget'
import LoadingBar from './LoadingBar'
import ThemeToggle from './ThemeToggle'
import UserProfile from './UserProfile'
import DailyCheckInModal from './DailyCheckInModal'
import ProgressTimeline from './ProgressTimeline'
import WeeklyAdherence from './WeeklyAdherence'
import PacienteTreinos from './PacienteTreinos'
import './Paciente.css'

const API_URL = 'http://localhost:5000/api'

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
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      navigate('/login')
      return
    }

    const userData = JSON.parse(storedUser)
    
    // Se não for paciente (ou USUARIO, para compatibilidade), redirecionar
    const role = userData.role?.toUpperCase()
    if (role !== 'PACIENTE' && role !== 'USUARIO') {
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
        // Se não tiver check-in de hoje, mostrar o modal
        if (!data.checkIn) {
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

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/diet/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar dieta')
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
      setDietError(error.message || 'Erro ao gerar dieta. Tente novamente.')
      return false
    } finally {
      setGeneratingDiet(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading || checkingQuestionnaire) {
    return (
      <div className="paciente-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
      </div>
    )
  }

  // Se ainda não completou o questionário, mostrar o formulário
  if (!hasCompletedQuestionnaire) {
    return <Questionnaire onComplete={handleQuestionnaireComplete} />
  }

  return (
    <div className="paciente-container">
      <header className="paciente-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">DietYourself</h1>
            <p className="welcome-text">
              Olá, {user?.name || user?.email}! 👋
            </p>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <button onClick={handleLogout} className="logout-btn">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="paciente-main">
        <div className="paciente-content">
          {/* Profile Section */}
          <section className="profile-section">
            <UserProfile
              userId={user?.id}
              userName={user?.name}
              userEmail={user?.email}
              onWeightUpdate={handleWeightUpdate}
              refreshTrigger={profileRefreshTrigger}
            />
            
            {/* Aderência Semanal */}
            <WeeklyAdherence refreshTrigger={dietRefreshTrigger} />
          </section>

          {/* Dashboard Nutricional */}
          <section className="nutrition-section">
            <NutritionDashboard 
              refreshTrigger={dietRefreshTrigger}
            />
          </section>

          <section className="diet-section">
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
              <LoadingBar message="Gerando sua dieta personalizada..." />
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
          <PacienteTreinos refreshTrigger={treinosRefreshTrigger} />

          <section className="info-section">
            <div className="info-cards">
              <div className="info-card">
                <div className="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Refeições</h3>
                <p>Visualize suas refeições planejadas</p>
                <span className="info-value">Em breve</span>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Progresso</h3>
                <p>Acompanhe seu progresso</p>
                <span className="info-value">Em breve</span>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Solicitar Mudanças</h3>
                <p>Peça alterações na sua dieta</p>
                <span className="info-value">Em breve</span>
              </div>
            </div>
          </section>

          {/* Linha do Tempo de Progresso */}
          <section className="timeline-section">
            <ProgressTimeline refreshTrigger={dietRefreshTrigger} />
          </section>
        </div>
      </main>

      {/* Widget de Chat */}
      <ChatWidget />
      
      {/* Modal de Check-in */}
      {showCheckInModal && (
        <DailyCheckInModal
          onClose={() => setShowCheckInModal(false)}
          onCheckInComplete={handleCheckInComplete}
        />
      )}
    </div>
  )
}

export default Paciente

