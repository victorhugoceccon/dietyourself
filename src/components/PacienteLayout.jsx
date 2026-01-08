import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import RoleSelector from './RoleSelector'
import ChatWidget from './ChatWidget'
import DailyCheckInModal from './DailyCheckInModal'
import BrandingProvider from './BrandingProvider'
import Questionnaire from './Questionnaire'
import NotificationCenter from './NotificationCenter'
// ThemeToggle removido - apenas light mode
import { hasAnyRole } from '../utils/roleUtils'
import { API_URL } from '../config/api'
import './PacienteLayout.css'

function PacienteLayout() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingQuestionnaire, setCheckingQuestionnaire] = useState(true)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [professionalUserId, setProfessionalUserId] = useState(null)
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false)
  const [hasDiet, setHasDiet] = useState(false)
  const [hasPersonal, setHasPersonal] = useState(false)
  const [userData, setUserData] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

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
    
    // Buscar dados completos do usuário para obter personalId e nutricionistaId
    loadUserData(token, userData.id)
    
    // Verificar se precisa mostrar o check-in modal
    checkTodayCheckIn(token)
  }, [navigate])

  const loadUserData = async (token, userId) => {
    try {
      // Buscar dados do usuário incluindo personalId e nutricionistaId
      const profileResponse = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Verificar questionário (prioridade - verificar primeiro)
      const questionnaireResponse = await fetch(`${API_URL}/questionnaire/check`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Verificar dieta
      const dietResponse = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (profileResponse.ok) {
        const data = await profileResponse.json()
        setUserData(data.user)
        // Priorizar personalId, depois nutricionistaId
        const professionalId = data.user?.personalId || data.user?.nutricionistaId
        if (professionalId) {
          setProfessionalUserId(professionalId)
        }
        // Verificar se tem personal
        if (data.user?.personalId) {
          setHasPersonal(true)
        }
      }

      // Verificar questionário - IMPORTANTE: definir estado mesmo se falhar
      if (questionnaireResponse.ok) {
        const data = await questionnaireResponse.json()
        console.log('📋 Resposta da API:', data)
        console.log('📋 Status do questionário (hasCompleted):', data.hasCompleted)
        const hasCompleted = data.hasCompleted === true
        console.log('📋 Definindo hasQuestionnaire como:', hasCompleted)
        setHasQuestionnaire(hasCompleted)
      } else {
        // Se a requisição falhar, assumir que não tem questionário
        console.warn('⚠️ Erro ao verificar questionário (status:', questionnaireResponse.status, '), assumindo que não foi preenchido')
        setHasQuestionnaire(false)
      }
      setCheckingQuestionnaire(false)
      
      // Log após definir estado (usar setTimeout para garantir que o estado foi atualizado)
      setTimeout(() => {
        console.log('✅ Verificação do questionário concluída. hasQuestionnaire:', hasQuestionnaire ? 'TRUE' : 'FALSE')
      }, 100)

      if (dietResponse.ok) {
        const data = await dietResponse.json()
        setHasDiet(!!data.dieta)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      // Em caso de erro, assumir que não tem questionário para mostrar o formulário
      setHasQuestionnaire(false)
      setCheckingQuestionnaire(false)
      // Tentar usar dados do localStorage como fallback
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        const professionalId = userData.personalId || userData.nutricionistaId
        if (professionalId) {
          setProfessionalUserId(professionalId)
        }
        if (userData.personalId) {
          setHasPersonal(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }
  
  const checkTodayCheckIn = async (token) => {
    try {
      const response = await fetch(`${API_URL}/checkin/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
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
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/paciente') {
      return location.pathname === '/paciente' || location.pathname === '/paciente/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  // Verificar se pode acessar uma rota
  const canAccessRoute = (route) => {
    if (route === '/paciente/perfil') {
      return hasQuestionnaire // Perfil só aparece após questionário
    }
    if (route === '/paciente/dieta') {
      return hasQuestionnaire // Dieta só aparece após questionário
    }
    if (route === '/paciente/treino') {
      return hasQuestionnaire && hasPersonal // Treino só aparece se tiver personal
    }
    if (route === '/paciente/dashboard') {
      return hasQuestionnaire && hasDiet // Dashboard só aparece se tiver dieta
    }
    return false
  }

  // Redirecionar se tentar acessar rota sem permissão
  useEffect(() => {
    if (!loading && !checkingQuestionnaire && user) {
      const currentPath = location.pathname
      
      // Se não tem questionário, redirecionar para raiz (que mostrará questionário)
      if (!hasQuestionnaire && currentPath !== '/paciente' && currentPath !== '/paciente/') {
        navigate('/paciente', { replace: true })
        return
      }

      // Se tentar acessar dashboard sem dieta, redirecionar para dieta
      if (currentPath === '/paciente/dashboard' && !hasDiet) {
        navigate('/paciente/dieta', { replace: true })
        return
      }

      // Se tentar acessar treino sem personal, redirecionar para perfil
      if (currentPath === '/paciente/treino' && !hasPersonal) {
        navigate('/paciente/perfil', { replace: true })
        return
      }
    }
  }, [loading, checkingQuestionnaire, hasQuestionnaire, hasDiet, hasPersonal, location.pathname, navigate, user])

  if (loading || checkingQuestionnaire) {
    console.log('⏳ Ainda carregando... loading:', loading, 'checkingQuestionnaire:', checkingQuestionnaire)
    return (
      <div className="paciente-layout">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
      </div>
    )
  }

  console.log('🎨 Renderizando. hasQuestionnaire:', hasQuestionnaire, 'loading:', loading, 'checkingQuestionnaire:', checkingQuestionnaire)
  
  // DEBUG: Forçar exibição do questionário se necessário
  const shouldShowQuestionnaire = !hasQuestionnaire
  console.log('🔍 shouldShowQuestionnaire:', shouldShowQuestionnaire)

  // Nav items - reutilizável para header e nav mobile
  const navItems = hasQuestionnaire ? (
    <>
      {hasDiet && (
        <button
          className={`nav-item ${isActive('/paciente/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/paciente/dashboard')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span className="nav-text">Dashboard</span>
        </button>
      )}
      <button
        className={`nav-item ${isActive('/paciente/dieta') ? 'active' : ''}`}
        onClick={() => navigate('/paciente/dieta')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span className="nav-text">Dieta</span>
      </button>
      {hasPersonal && (
        <button
          className={`nav-item ${isActive('/paciente/treino') ? 'active' : ''}`}
          onClick={() => navigate('/paciente/treino')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <path d="M6 14h12"></path>
          </svg>
          <span className="nav-text">Treino</span>
        </button>
      )}
      <button
        className={`nav-item ${isActive('/paciente/projetos') ? 'active' : ''}`}
        onClick={() => navigate('/paciente/projetos')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span className="nav-text">Projetos</span>
      </button>
      <button
        className={`nav-item ${isActive('/paciente/perfil') ? 'active' : ''}`}
        onClick={() => navigate('/paciente/perfil')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span className="nav-text">Perfil</span>
      </button>
    </>
  ) : null

  return (
    <BrandingProvider professionalUserId={professionalUserId}>
      <div className="paciente-layout">
        <header className="paciente-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">LifeFit</h1>
            <p className="welcome-text">
              Olá, {user?.name || user?.email}
            </p>
          </div>
          <div className="header-right">
            <RoleSelector user={user} />
            {/* Navegação no header - Desktop apenas */}
            {navItems && (
              <div className="header-nav-items">
                {navItems}
              </div>
            )}
            <NotificationCenter />
            <button onClick={handleLogout} className="logout-btn">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Se não tem questionário, mostrar questionário */}
      {shouldShowQuestionnaire ? (
        <div style={{ 
          width: '100%',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
          background: 'transparent'
        }}>
          {console.log('🎯 Renderizando Questionnaire - hasQuestionnaire:', hasQuestionnaire)}
          <Questionnaire onComplete={async () => {
            console.log('✅ Questionário completado!')
            setHasQuestionnaire(true)
            const token = localStorage.getItem('token')
            if (token && user?.id) {
              await loadUserData(token, user.id)
              // Após completar questionário, redirecionar para perfil
              navigate('/paciente/perfil', { replace: true })
            }
          }} />
        </div>
      ) : (
        <div className="paciente-content-wrapper">
          {/* Navegação - Mobile apenas */}
          {navItems && (
            <nav className="paciente-nav">
              <div className="nav-content">
                {navItems}
              </div>
            </nav>
          )}

          {/* Conteúdo Principal */}
          <div className="paciente-main-content">
            <Outlet context={{ userData }} />
          </div>
        </div>
      )}

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
    </BrandingProvider>
  )
}

export default PacienteLayout




