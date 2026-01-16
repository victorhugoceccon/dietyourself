import prisma from '../config/database.js'

/**
 * Middleware para verificar se o usuário tem assinatura ativa
 * 
 * Fluxo:
 * 1. Verifica se existe assinatura
 * 2. Verifica se está em trial válido
 * 3. Verifica se assinatura paga está ativa
 * 4. Bloqueia acesso se expirado
 */
export const requireActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // Buscar usuário com assinatura
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Admins, Nutricionistas, Personais e Guests não precisam de assinatura
    // GUEST tem acesso apenas a rotas de grupos/projetos (verificado no router)
    if (['ADMIN', 'NUTRICIONISTA', 'PERSONAL', 'GUEST'].includes(user.role)) {
      req.userRole = user.role
      return next()
    }

    const subscription = user.subscription

    // Se não tem assinatura, criar trial automaticamente
    if (!subscription) {
      const trialDays = 7
      const now = new Date()
      const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)

      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE_TRIAL',
          status: 'TRIAL',
          trialStartDate: now,
          trialEndDate: trialEnd
        }
      })

      // Continua com acesso
      return next()
    }

    // Verificar status da assinatura
    const now = new Date()

    // Trial ativo
    if (subscription.status === 'TRIAL') {
      if (subscription.trialEndDate && subscription.trialEndDate > now) {
        // Trial ainda válido
        req.subscriptionStatus = 'TRIAL'
        req.trialDaysRemaining = Math.ceil((subscription.trialEndDate - now) / (1000 * 60 * 60 * 24))
        return next()
      } else {
        // Trial expirado
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' }
        })
        return res.status(403).json({
          error: 'Período de teste expirado',
          code: 'TRIAL_EXPIRED',
          message: 'Seu período de teste de 7 dias terminou. Assine para continuar usando o LifeFit.'
        })
      }
    }

    // Assinatura ativa
    if (subscription.status === 'ACTIVE') {
      if (subscription.endDate && subscription.endDate < now) {
        // Assinatura expirou
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' }
        })
        return res.status(403).json({
          error: 'Assinatura expirada',
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Sua assinatura expirou. Renove para continuar usando o LifeFit.'
        })
      }
      req.subscriptionStatus = 'ACTIVE'
      return next()
    }

    // Assinatura cancelada ou suspensa
    if (['CANCELLED', 'SUSPENDED', 'EXPIRED'].includes(subscription.status)) {
      return res.status(403).json({
        error: 'Assinatura inativa',
        code: 'SUBSCRIPTION_INACTIVE',
        status: subscription.status,
        message: 'Sua assinatura está inativa. Reative para continuar usando o LifeFit.'
      })
    }

    // Fallback - permite acesso
    next()
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error)
    res.status(500).json({ error: 'Erro ao verificar assinatura' })
  }
}

/**
 * Middleware para adicionar info de assinatura ao request (não bloqueia)
 */
export const attachSubscriptionInfo = async (req, res, next) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return next()
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    if (subscription) {
      const now = new Date()
      req.subscription = {
        ...subscription,
        isActive: subscription.status === 'ACTIVE' || 
                  (subscription.status === 'TRIAL' && subscription.trialEndDate > now),
        isTrial: subscription.status === 'TRIAL',
        daysRemaining: subscription.trialEndDate 
          ? Math.max(0, Math.ceil((subscription.trialEndDate - now) / (1000 * 60 * 60 * 24)))
          : null
      }
    }

    next()
  } catch (error) {
    console.error('Erro ao buscar info de assinatura:', error)
    next()
  }
}

/**
 * Helper para criar trial para novo usuário
 */
export const createTrialSubscription = async (userId, trialDays = 7) => {
  const now = new Date()
  const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)

  return prisma.subscription.create({
    data: {
      userId,
      plan: 'FREE_TRIAL',
      status: 'TRIAL',
      trialStartDate: now,
      trialEndDate: trialEnd
    }
  })
}

/**
 * Helper para verificar se usuário pode acessar recurso premium
 */
export const canAccessPremium = async (userId) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId }
  })

  if (!subscription) return false

  const now = new Date()

  if (subscription.status === 'ACTIVE') {
    return !subscription.endDate || subscription.endDate > now
  }

  if (subscription.status === 'TRIAL') {
    return subscription.trialEndDate && subscription.trialEndDate > now
  }

  return false
}
