import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { getUserRoles, getCurrentRole, setCurrentRole, getRoleInfo } from '../utils/roleUtils'
import './RoleSelector.css'

function RoleSelector({ user, onRoleChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [currentRole, setCurrentRoleState] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (user) {
      const roles = getUserRoles(user)
      setUserRoles(roles)
      
      const current = getCurrentRole(user)
      setCurrentRoleState(current || roles[0])
    }
  }, [user])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect()
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 8,
            right: window.innerWidth - rect.right
          })
        }
      }
      
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && 
          buttonRef.current && 
          !buttonRef.current.contains(event.target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

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

  const dropdownContent = isOpen && (
    <>
      <div 
        className="role-selector-dropdown"
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          right: `${dropdownPosition.right}px`,
          zIndex: 10000
        }}
      >
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
  )

  return (
    <div className="role-selector">
      <button
        ref={buttonRef}
        className="role-selector-btn"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
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

      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  )
}

export default RoleSelector








