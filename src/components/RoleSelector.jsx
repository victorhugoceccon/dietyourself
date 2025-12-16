import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getUserRoles, getCurrentRole, setCurrentRole, getRoleInfo } from '../utils/roleUtils'
import './RoleSelector.css'

function RoleSelector({ user, onRoleChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [currentRole, setCurrentRoleState] = useState(null)

  useEffect(() => {
    if (user) {
      const roles = getUserRoles(user)
      setUserRoles(roles)
      
      const current = getCurrentRole(user)
      setCurrentRoleState(current || roles[0])
    }
  }, [user])

  // Se o usuário tem apenas uma role, não mostrar o seletor
  if (!user || userRoles.length <= 1) {
    return null
  }

  const handleRoleSelect = (role) => {
    setCurrentRole(role)
    setCurrentRoleState(role)
    setIsOpen(false)
    
    const roleInfo = getRoleInfo(role)
    if (roleInfo) {
      navigate(roleInfo.path)
    }
    
    if (onRoleChange) {
      onRoleChange(role)
    }
  }

  const currentRoleInfo = getRoleInfo(currentRole)

  return (
    <div className="role-selector">
      <button
        className="role-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Alternar entre roles"
      >
        <span className="role-selector-icon">{currentRoleInfo?.icon || '👤'}</span>
        <span className="role-selector-text">{currentRoleInfo?.name || currentRole}</span>
        <svg 
          className={`role-selector-arrow ${isOpen ? 'open' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="role-selector-overlay" onClick={() => setIsOpen(false)} />
          <div className="role-selector-dropdown">
            <div className="role-selector-header">
              <span>Selecione uma área</span>
            </div>
            <div className="role-selector-list">
              {userRoles.map((role) => {
                const roleInfo = getRoleInfo(role)
                const isActive = role === currentRole
                
                return (
                  <button
                    key={role}
                    className={`role-selector-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleRoleSelect(role)}
                    style={{ 
                      borderLeftColor: roleInfo?.color,
                      backgroundColor: isActive ? `${roleInfo?.color}15` : 'transparent'
                    }}
                  >
                    <span className="role-selector-item-icon">{roleInfo?.icon}</span>
                    <span className="role-selector-item-text">{roleInfo?.name}</span>
                    {isActive && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RoleSelector


