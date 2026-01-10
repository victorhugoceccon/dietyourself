import { verifyToken } from '../utils/jwt.js'

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }

    const decoded = verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }

    const userRole = req.user.role?.toUpperCase()
    const userRoles = req.user.roles ? JSON.parse(req.user.roles) : [userRole]

    // Verificar se o usuário tem pelo menos um dos roles permitidos
    const hasRole = allowedRoles.some(role => 
      userRoles.includes(role.toUpperCase()) || userRole === role.toUpperCase()
    )

    if (!hasRole) {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' })
    }

    next()
  }
}

// Middleware para verificar se é admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const userRole = req.user.role?.toUpperCase()
  const userRoles = req.user.roles ? JSON.parse(req.user.roles) : [userRole]

  if (userRole !== 'ADMIN' && !userRoles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' })
  }

  next()
}
