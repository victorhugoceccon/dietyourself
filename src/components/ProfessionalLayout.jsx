import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import RoleSelector from './RoleSelector'
import ChatWidget from './ChatWidget'
import BrandingProvider from './BrandingProvider'
import NotificationCenter from './NotificationCenter'
import ThemeToggle from './ThemeToggle'
import { hasAnyRole } from '../utils/roleUtils'
import { getUserRoles } from '../utils/roleUtils'
import { API_URL } from '../config/api'
import './ProfessionalLayout.css'

function ProfessionalLayout({ allowedRoles, children, headerNavItems, headerNavClassName }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [professionalUserId, setProfessionalUserId] = useState(null)
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
    
    // Verificar se tem acesso permitido
    if (!hasAnyRole(userData, allowedRoles)) {
      navigate('/login')
      return
    }

    setUser(userData)
    
    // Buscar dados completos do usuário para branding
    loadUserData(token, userData.id)
  }, [navigate, allowedRoles])

  const loadUserData = async (token, userId) => {
    try {
      const profileResponse = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (profileResponse.ok) {
        const data = await profileResponse.json()
        // Para profissionais, o próprio ID é usado para branding
        if (data.user?.id) {
          setProfessionalUserId(data.user.id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="professional-layout">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-primary)' }}>Carregando...</div>
      </div>
    )
  }

  const hasMultipleRoles = getUserRoles(user).length > 1

  return (
    <BrandingProvider professionalUserId={professionalUserId}>
      <div className="professional-layout">
        <header className="professional-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="logo">LifeFit</h1>
              <div className="welcome-block">
                <p className="welcome-text">
                  Olá, {user?.name || user?.email}
                </p>
                {hasMultipleRoles && <RoleSelector user={user} />}
              </div>
            </div>

            {headerNavItems && (
              <div className={`header-nav-items ${headerNavClassName || ''}`}>
                {headerNavItems}
              </div>
            )}

            <div className="header-right">
              <ThemeToggle />
              <NotificationCenter />
              <button onClick={handleLogout} className="logout-btn">
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="professional-body">
          {children || <Outlet />}
        </div>

        {/* Widget de Chat */}
        <ChatWidget />
      </div>
    </BrandingProvider>
  )
}

export default ProfessionalLayout



