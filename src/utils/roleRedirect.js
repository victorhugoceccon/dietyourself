import { getUserRoles, getCurrentRole, getRoleInfo } from './roleUtils'

// Função auxiliar para redirecionar baseado na role do usuário
export const getRoleRedirect = (user) => {
  // Se receber apenas uma string (compatibilidade), tratar como objeto
  if (typeof user === 'string') {
    const normalizedRole = user.toUpperCase()
    const roleInfo = getRoleInfo(normalizedRole)
    return roleInfo?.path || '/paciente'
  }
  
  // Se receber objeto de usuário, usar role atual ou primeira disponível
  if (user && typeof user === 'object') {
    const currentRole = getCurrentRole(user)
    if (currentRole) {
      const roleInfo = getRoleInfo(currentRole)
      if (roleInfo) {
        return roleInfo.path
      }
    }
    
    // Fallback: usar primeira role disponível
    const userRoles = getUserRoles(user)
    if (userRoles.length > 0) {
      const roleInfo = getRoleInfo(userRoles[0])
      if (roleInfo) {
        return roleInfo.path
      }
    }
  }
  
  // Fallback padrão
  return '/paciente'
}

