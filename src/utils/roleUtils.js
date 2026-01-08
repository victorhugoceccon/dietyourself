/**
 * Utilitários para trabalhar com múltiplas roles
 */

/**
 * Obtém todas as roles de um usuário
 * Suporta tanto role única (compatibilidade) quanto array de roles
 * @param {Object} user - Objeto do usuário
 * @returns {string[]} Array de roles em maiúsculas
 */
export const getUserRoles = (user) => {
  if (!user) return []
  
  // Se tiver campo roles (array JSON), usar ele
  if (user.roles) {
    try {
      const roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles
      if (Array.isArray(roles) && roles.length > 0) {
        return roles.map(r => r.toUpperCase())
      }
    } catch (e) {
      console.warn('Erro ao parsear roles:', e)
    }
  }
  
  // Fallback para role única (compatibilidade)
  if (user.role) {
    return [user.role.toUpperCase()]
  }
  
  return []
}

/**
 * Verifica se o usuário tem uma role específica
 * @param {Object} user - Objeto do usuário
 * @param {string} role - Role a verificar
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  const userRoles = getUserRoles(user)
  const normalizedRole = role?.toUpperCase()
  return userRoles.includes(normalizedRole)
}

/**
 * Verifica se o usuário tem qualquer uma das roles necessárias
 * @param {Object} user - Objeto do usuário
 * @param {string[]} requiredRoles - Array de roles necessárias
 * @returns {boolean}
 */
export const hasAnyRole = (user, requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true
  
  const userRoles = getUserRoles(user)
  const normalizedRequired = requiredRoles.map(r => r.toUpperCase())
  
  return normalizedRequired.some(role => userRoles.includes(role))
}

/**
 * Verifica se o usuário tem todas as roles necessárias
 * @param {Object} user - Objeto do usuário
 * @param {string[]} requiredRoles - Array de roles necessárias
 * @returns {boolean}
 */
export const hasAllRoles = (user, requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true
  
  const userRoles = getUserRoles(user)
  const normalizedRequired = requiredRoles.map(r => r.toUpperCase())
  
  return normalizedRequired.every(role => userRoles.includes(role))
}

/**
 * Obtém a role atual do usuário (do localStorage ou primeira role disponível)
 * @param {Object} user - Objeto do usuário
 * @returns {string|null}
 */
export const getCurrentRole = (user) => {
  if (!user) return null
  
  // Verificar se há role salva no localStorage
  const savedRole = localStorage.getItem('currentRole')
  if (savedRole) {
    const userRoles = getUserRoles(user)
    if (userRoles.includes(savedRole.toUpperCase())) {
      return savedRole.toUpperCase()
    }
  }
  
  // Retornar primeira role disponível
  const userRoles = getUserRoles(user)
  return userRoles.length > 0 ? userRoles[0] : null
}

/**
 * Define a role atual do usuário
 * @param {string} role - Role a definir
 */
export const setCurrentRole = (role) => {
  if (role) {
    localStorage.setItem('currentRole', role.toUpperCase())
  } else {
    localStorage.removeItem('currentRole')
  }
}

/**
 * Obtém informações sobre as roles disponíveis
 */
export const getRoleInfo = (role) => {
  const roleInfo = {
    ADMIN: {
      name: 'Administrador',
      path: '/admin',
      icon: '👑',
      color: '#F44336'
    },
    NUTRICIONISTA: {
      name: 'Nutricionista',
      path: '/nutricionista',
      icon: '🥗',
      color: '#4CAF50'
    },
    PERSONAL: {
      name: 'Personal Trainer',
      path: '/personal',
      icon: '💪',
      color: '#2196F3'
    },
    PACIENTE: {
      name: 'Paciente',
      path: '/paciente',
      icon: '👤',
      color: '#9C27B0'
    }
  }
  
  return roleInfo[role?.toUpperCase()] || null
}








