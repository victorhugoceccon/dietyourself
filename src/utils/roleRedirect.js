// Função auxiliar para redirecionar baseado na role do usuário
export const getRoleRedirect = (role) => {
  // Normalizar role para maiúsculas
  const normalizedRole = role?.toUpperCase() || 'PACIENTE'
  
  switch (normalizedRole) {
    case 'PACIENTE':
    case 'USUARIO': // Compatibilidade com roles antigas
      return '/paciente'
    case 'NUTRICIONISTA':
      return '/nutricionista'
    case 'PERSONAL':
      return '/personal'
    case 'ADMIN':
      return '/admin'
    default:
      console.warn('Role desconhecida:', role, '- redirecionando para /paciente')
      return '/paciente'
  }
}

