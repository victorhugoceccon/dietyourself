/**
 * Verifica se o usuário tem uma role específica
 * @param {Object} user - Objeto do usuário com role e roles
 * @param {string} roleToCheck - Role a verificar (ex: 'PACIENTE', 'PERSONAL', etc)
 * @returns {boolean}
 */
export function hasRole(user, roleToCheck) {
  if (!user) return false
  
  // Verificar role principal
  if (user.role === roleToCheck) return true
  
  // Verificar array de roles
  if (user.roles) {
    try {
      const roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles
      if (Array.isArray(roles) && roles.includes(roleToCheck)) {
        return true
      }
    } catch (e) {
      console.warn('Erro ao parsear roles:', e)
    }
  }
  
  return false
}

/**
 * Verifica se o usuário tem qualquer uma das roles fornecidas
 * @param {Object} user - Objeto do usuário com role e roles
 * @param {string[]} rolesToCheck - Array de roles a verificar
 * @returns {boolean}
 */
export function hasAnyRole(user, rolesToCheck) {
  if (!user || !Array.isArray(rolesToCheck)) return false
  
  return rolesToCheck.some(role => hasRole(user, role))
}

