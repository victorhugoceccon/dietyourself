import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import ChatWidget from './ChatWidget'
import DailyCheckInModal from './DailyCheckInModal'
import BrandingProvider from './BrandingProvider'
import Questionnaire from './Questionnaire'
import ConversationalQuestionnaire from './ConversationalQuestionnaire'
import SubscriptionStatus from './SubscriptionStatus'
import PWAInstallTutorial from './PWAInstallTutorial'
import { 
  House, 
  ForkKnife, 
  Barbell, 
  Users, 
  User 
} from '@phosphor-icons/react'
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
    
    // Verificar se tem acesso de paciente ou é guest
    if (!hasAnyRole(userData, ['PACIENTE', 'USUARIO', 'GUEST'])) {
      navigate('/login')
      return
    }

    setUser(userData)
    
    // Se for GUEST, redirecionar diretamente para projetos
    if (userData.role === 'GUEST') {
      const currentPath = window.location.pathname
      if (!currentPath.includes('/paciente/projetos')) {
        navigate('/paciente/projetos')
      }
    }
    
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
        console.log('📋 Dados do questionário:', data.data ? 'Existe' : 'Não existe')
        
        // Verificar se realmente tem dados completos (não apenas um registro vazio)
        const hasCompleted = data.hasCompleted === true && data.data !== null
        console.log('📋 Definindo hasQuestionnaire como:', hasCompleted)
        setHasQuestionnaire(hasCompleted)
      } else {
        // Se a requisição falhar, assumir que não tem questionário
        console.warn('⚠️ Erro ao verificar questionário (status:', questionnaireResponse.status, '), assumindo que não foi preenchido')
        setHasQuestionnaire(false)
      }
      setCheckingQuestionnaire(false)

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
      return hasQuestionnaire // Treino aparece após questionário
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

      // Treino pode ser acessado mesmo sem personal (para gerar treino por IA)
    }
  }, [loading, checkingQuestionnaire, hasQuestionnaire, hasDiet, hasPersonal, location.pathname, navigate, user])

  // #region agent log
  useEffect(() => {
    const checkNavStyles = () => {
      const nav = document.querySelector('.paciente-bottom-nav');
      const navContent = nav ? nav.querySelector('.paciente-bottom-nav__content') : null;
      const navItems = nav ? nav.querySelectorAll('.paciente-bottom-nav__item') : [];
      if (nav) {
        const navStyles = window.getComputedStyle(nav);
        const contentStyles = navContent ? window.getComputedStyle(navContent) : {};
        const firstItemStyles = navItems.length > 0 ? window.getComputedStyle(navItems[0]) : {};
        const rect = nav.getBoundingClientRect();
        const rootStyles = window.getComputedStyle(document.documentElement);
        const body = document.body;
        const styleSheets = Array.from(document.styleSheets)
          .map((sheet) => sheet.href || 'inline')
          .filter((href) => href);
        const matchedRules = [];
        Array.from(document.styleSheets).forEach((sheet, sheetIndex) => {
          let rules;
          try {
            rules = sheet.cssRules;
          } catch (error) {
            return;
          }
          if (!rules) return;
          Array.from(rules).forEach((rule, ruleIndex) => {
            if (!rule.selectorText || !rule.style) return;
            const selector = rule.selectorText;
            if (
              selector.includes('.paciente-nav') ||
              selector.includes('.nav-content') ||
              selector.includes('.nav-item') ||
              selector.includes('.nav-text')
            ) {
              matchedRules.push({
                selector,
                sheetIndex,
                ruleIndex,
                cssText: rule.style.cssText
              });
            }
          });
        });
        const lastMatchedRules = matchedRules.slice(-40);

        // Logging de debug (erros são silenciados se serviço não estiver disponível)
        fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'PacienteLayout.jsx:useEffect',
            message: 'Bottom nav computed styles - design check',
            data: {
              navBackground: navStyles.background,
              navBackgroundColor: navStyles.backgroundColor,
              navBorderTop: navStyles.borderTop,
              navBoxShadow: navStyles.boxShadow,
              navPosition: navStyles.position,
              navBottom: navStyles.bottom,
              navZIndex: navStyles.zIndex,
              contentDisplay: contentStyles.display,
              contentJustifyContent: contentStyles.justifyContent,
              itemBackground: firstItemStyles.background,
              itemBackgroundColor: firstItemStyles.backgroundColor,
              itemColor: firstItemStyles.color,
              itemBorderRadius: firstItemStyles.borderRadius,
              itemPadding: firstItemStyles.padding,
              itemFontSize: firstItemStyles.fontSize,
              rectTop: rect.top,
              rectBottom: rect.bottom,
              windowHeight: window.innerHeight,
              inlineStyles: nav.getAttribute('style'),
              bodyClass: body?.className || '',
              htmlClass: document.documentElement.className || '',
              navClass: nav.className || '',
              firstItemClass: navItems.length > 0 ? navItems[0].className : '',
              cssVars: {
                accentColor: rootStyles.getPropertyValue('--accent-color').trim(),
                gradientPrimary: rootStyles.getPropertyValue('--gradient-primary').trim(),
                bgPrimary: rootStyles.getPropertyValue('--bg-primary').trim(),
                textPrimary: rootStyles.getPropertyValue('--text-primary').trim()
              },
              styleSheets,
              matchedRules: lastMatchedRules
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run4',
            hypothesisId: 'A,B,C,D,E,F,G,H'
          })
        }).catch(() => {}); // Silencia erros de conexão (serviço de logging opcional)
      }
    };
    const timer = setTimeout(checkNavStyles, 500);
    window.addEventListener('resize', checkNavStyles);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkNavStyles);
    };
  }, [user, loading, checkingQuestionnaire, hasQuestionnaire, hasDiet, hasPersonal, location.pathname, navigate]);
  // #endregion

  if (loading || checkingQuestionnaire) {
    console.log('⏳ Ainda carregando... loading:', loading, 'checkingQuestionnaire:', checkingQuestionnaire)
    return (
      <div className="paciente-layout">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
      </div>
    )
  }

  console.log('🎨 Renderizando. hasQuestionnaire:', hasQuestionnaire, 'loading:', loading, 'checkingQuestionnaire:', checkingQuestionnaire)
  
  // Verificar se é usuário GUEST
  const isGuest = user?.role === 'GUEST'

  // DEBUG: Forçar exibição do questionário se necessário
  // GUESTs não precisam preencher questionário - eles só têm acesso a projetos
  const shouldShowQuestionnaire = !hasQuestionnaire && !isGuest
  console.log('🔍 shouldShowQuestionnaire:', shouldShowQuestionnaire, '| isGuest:', isGuest)

  // Nav items para GUEST (apenas Projetos)
  const guestNavItems = (
    <>
      <button
        className={`paciente-bottom-nav__item ${isActive('/paciente/projetos') ? 'is-active' : ''}`}
        onClick={() => navigate('/paciente/projetos')}
      >
        <Users size={20} weight="regular" />
        <span className="paciente-bottom-nav__label">Projetos</span>
      </button>
    </>
  )

  // Nav items para usuários normais - reutilizável para header e nav mobile
  const fullNavItems = hasQuestionnaire ? (
    <>
      {hasDiet && (
            <button
              className={`paciente-bottom-nav__item ${isActive('/paciente/dashboard') ? 'is-active' : ''}`}
              onClick={() => navigate('/paciente/dashboard')}
            >
              <House size={20} weight="regular" />
              <span className="paciente-bottom-nav__label">Dashboard</span>
            </button>
      )}
      <button
            className={`paciente-bottom-nav__item ${isActive('/paciente/dieta') ? 'is-active' : ''}`}
        onClick={() => navigate('/paciente/dieta')}
      >
        <ForkKnife size={20} weight="regular" />
            <span className="paciente-bottom-nav__label">Dieta</span>
      </button>
      <button
            className={`paciente-bottom-nav__item ${isActive('/paciente/treino') ? 'is-active' : ''}`}
        onClick={() => navigate('/paciente/treino')}
      >
        <Barbell size={20} weight="regular" />
            <span className="paciente-bottom-nav__label">Treino</span>
      </button>
      <button
            className={`paciente-bottom-nav__item ${isActive('/paciente/projetos') ? 'is-active' : ''}`}
        onClick={() => navigate('/paciente/projetos')}
      >
        <Users size={20} weight="regular" />
            <span className="paciente-bottom-nav__label">Projetos</span>
      </button>
      <button
            className={`paciente-bottom-nav__item ${isActive('/paciente/perfil') ? 'is-active' : ''}`}
        onClick={() => navigate('/paciente/perfil')}
      >
        <User size={20} weight="regular" />
            <span className="paciente-bottom-nav__label">Perfil</span>
      </button>
    </>
  ) : null

  // Seleciona os nav items baseado no tipo de usuário
  const navItems = isGuest ? guestNavItems : fullNavItems

  return (
    <BrandingProvider professionalUserId={professionalUserId}>
      <div className="paciente-layout">
        <PWAInstallTutorial />

      {/* Se não tem questionário, mostrar chat conversacional */}
      {shouldShowQuestionnaire ? (
        <div 
          id="questionnaire-wrapper"
          style={{ 
            width: '100%',
            minHeight: 'calc(100vh - 73px)',
            position: 'relative',
            zIndex: 1,
            background: 'transparent',
            margin: 0,
            marginTop: 0,
            marginBottom: 0,
            padding: 0,
            paddingTop: 0,
            paddingBottom: 0
          }}
        >
          {console.log('🎯 Renderizando Questionnaire - hasQuestionnaire:', hasQuestionnaire)}
          <Questionnaire onComplete={async () => {
            console.log('✅ Questionário completado!')
            const token = localStorage.getItem('token')
            if (token && user?.id) {
              // Recarregar dados do usuário para verificar se o questionário foi salvo
              // Isso garante que o estado seja atualizado corretamente
              await loadUserData(token, user.id)
              // O estado hasQuestionnaire será atualizado pelo loadUserData
              console.log('✅ Dados recarregados após completar questionário')
            } else {
              // Fallback: definir como true se não conseguir recarregar
              setHasQuestionnaire(true)
            }
          }} />
        </div>
      ) : (
        <div className="paciente-content-wrapper">
          {/* Conteúdo Principal */}
          <div className="paciente-main-content">
            <SubscriptionStatus />
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
      
          {/* Navegação - Mobile apenas (FORA do paciente-layout para posicionamento fixo absoluto na viewport) */}
      {!shouldShowQuestionnaire && (navItems ? (
        <nav className="paciente-bottom-nav">
          <div className="paciente-bottom-nav__content">
            {navItems}
          </div>
        </nav>
      ) : hasQuestionnaire ? (
        // Fallback: se hasQuestionnaire mas navItems está vazio, mostrar menu básico
        <nav className="paciente-bottom-nav">
          <div className="paciente-bottom-nav__content">
            <button
              className={`paciente-bottom-nav__item ${isActive('/paciente/perfil') ? 'is-active' : ''}`}
              onClick={() => navigate('/paciente/perfil')}
            >
              <User size={20} weight="regular" />
              <span className="paciente-bottom-nav__label">Perfil</span>
            </button>
          </div>
        </nav>
      ) : null)}
    </BrandingProvider>
  )
}

export default PacienteLayout




