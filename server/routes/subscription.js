import express from 'express'
import prisma from '../config/database.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { createTrialSubscription } from '../middleware/subscription.js'
import { z } from 'zod'

const router = express.Router()

// ===== ROTAS DO USUÁRIO =====

// Obter status da assinatura do usuário logado
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    let subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    // Se não existe, criar trial
    if (!subscription) {
      subscription = await createTrialSubscription(userId)
    }

    const now = new Date()
    const isActive = subscription.status === 'ACTIVE' || 
                    (subscription.status === 'TRIAL' && subscription.trialEndDate > now)
    
    const daysRemaining = subscription.trialEndDate 
      ? Math.max(0, Math.ceil((new Date(subscription.trialEndDate) - now) / (1000 * 60 * 60 * 24)))
      : null

    res.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        isActive,
        isTrial: subscription.status === 'TRIAL',
        trialStartDate: subscription.trialStartDate,
        trialEndDate: subscription.trialEndDate,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining,
        createdAt: subscription.createdAt
      }
    })
  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error)
    res.status(500).json({ error: 'Erro ao buscar status da assinatura' })
  }
})

// Histórico de pagamentos (para integração futura)
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      return res.json({ payments: [] })
    }

    // Por enquanto retorna dados básicos
    // Quando integrar com Stripe, buscar histórico real
    res.json({
      payments: [],
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        pricePaidCents: subscription.pricePaidCents,
        currency: subscription.currency
      }
    })
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos' })
  }
})

// ===== ROTAS DO ADMIN =====

// Listar todas as assinaturas (com filtros)
router.get('/admin/list', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, plan, page = 1, limit = 20, search } = req.query

    const where = {}
    if (status) where.status = status
    if (plan) where.plan = plan

    // Buscar com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.subscription.count({ where })
    ])

    // Adicionar informações calculadas
    const now = new Date()
    const enrichedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      isActive: sub.status === 'ACTIVE' || 
                (sub.status === 'TRIAL' && sub.trialEndDate > now),
      daysRemaining: sub.trialEndDate 
        ? Math.max(0, Math.ceil((new Date(sub.trialEndDate) - now) / (1000 * 60 * 60 * 24)))
        : null
    }))

    res.json({
      subscriptions: enrichedSubscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Erro ao listar assinaturas:', error)
    res.status(500).json({ error: 'Erro ao listar assinaturas' })
  }
})

// Estatísticas de assinaturas
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const now = new Date()

    const [
      totalUsers,
      totalSubscriptions,
      activeTrials,
      expiredTrials,
      activePaid,
      cancelled,
      monthlyRevenue
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PACIENTE' } }),
      prisma.subscription.count(),
      prisma.subscription.count({ 
        where: { 
          status: 'TRIAL',
          trialEndDate: { gt: now }
        } 
      }),
      prisma.subscription.count({ 
        where: { 
          status: 'EXPIRED'
        } 
      }),
      prisma.subscription.count({ 
        where: { 
          status: 'ACTIVE'
        } 
      }),
      prisma.subscription.count({ 
        where: { 
          status: 'CANCELLED'
        } 
      }),
      // Receita do mês (soma dos pagamentos)
      prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          pricePaidCents: { not: null }
        },
        _sum: {
          pricePaidCents: true
        }
      })
    ])

    // Trials expirando nos próximos 3 dias
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const expiringTrials = await prisma.subscription.count({
      where: {
        status: 'TRIAL',
        trialEndDate: {
          gt: now,
          lte: threeDaysFromNow
        }
      }
    })

    // Taxa de conversão (trials que viraram pagos)
    const convertedTrials = await prisma.subscription.count({
      where: {
        plan: { not: 'FREE_TRIAL' },
        trialStartDate: { not: null }
      }
    })

    const conversionRate = totalSubscriptions > 0 
      ? ((convertedTrials / totalSubscriptions) * 100).toFixed(2)
      : 0

    res.json({
      stats: {
        totalUsers,
        totalSubscriptions,
        activeTrials,
        expiredTrials,
        activePaid,
        cancelled,
        expiringTrials,
        conversionRate: parseFloat(conversionRate),
        monthlyRevenueCents: monthlyRevenue._sum.pricePaidCents || 0,
        monthlyRevenueBRL: ((monthlyRevenue._sum.pricePaidCents || 0) / 100).toFixed(2)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
})

// Buscar assinatura de um usuário específico
router.get('/admin/user/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        }
      }
    })

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' })
    }

    const now = new Date()
    res.json({
      subscription: {
        ...subscription,
        isActive: subscription.status === 'ACTIVE' || 
                  (subscription.status === 'TRIAL' && subscription.trialEndDate > now),
        daysRemaining: subscription.trialEndDate 
          ? Math.max(0, Math.ceil((new Date(subscription.trialEndDate) - now) / (1000 * 60 * 60 * 24)))
          : null
      }
    })
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error)
    res.status(500).json({ error: 'Erro ao buscar assinatura do usuário' })
  }
})

// Atualizar assinatura (admin)
const updateSubscriptionSchema = z.object({
  plan: z.enum(['FREE_TRIAL', 'MONTHLY', 'YEARLY', 'LIFETIME']).optional(),
  status: z.enum(['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED']).optional(),
  trialEndDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  pricePaidCents: z.number().int().optional(),
  cancelReason: z.string().optional()
})

router.put('/admin/user/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const validatedData = updateSubscriptionSchema.parse(req.body)

    // Verificar se assinatura existe
    let subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      // Criar nova se não existir
      subscription = await prisma.subscription.create({
        data: {
          userId,
          plan: validatedData.plan || 'FREE_TRIAL',
          status: validatedData.status || 'TRIAL',
          trialStartDate: new Date(),
          trialEndDate: validatedData.trialEndDate 
            ? new Date(validatedData.trialEndDate)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })
    } else {
      // Atualizar existente
      const updateData = {}
      
      if (validatedData.plan) updateData.plan = validatedData.plan
      if (validatedData.status) updateData.status = validatedData.status
      if (validatedData.trialEndDate) updateData.trialEndDate = new Date(validatedData.trialEndDate)
      if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate)
      if (validatedData.pricePaidCents !== undefined) updateData.pricePaidCents = validatedData.pricePaidCents
      if (validatedData.cancelReason) {
        updateData.cancelReason = validatedData.cancelReason
        updateData.cancelledAt = new Date()
      }

      // Se ativar assinatura paga, definir datas
      if (validatedData.status === 'ACTIVE' && validatedData.plan !== 'FREE_TRIAL') {
        updateData.startDate = updateData.startDate || new Date()
        
        // Se não especificou endDate, calcular baseado no plano
        if (!updateData.endDate) {
          const now = new Date()
          if (validatedData.plan === 'MONTHLY') {
            updateData.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          } else if (validatedData.plan === 'YEARLY') {
            updateData.endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
          } else if (validatedData.plan === 'LIFETIME') {
            updateData.endDate = null // Sem expiração
          }
        }
      }

      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: updateData
      })
    }

    res.json({
      message: 'Assinatura atualizada com sucesso',
      subscription
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors })
    }
    console.error('Erro ao atualizar assinatura:', error)
    res.status(500).json({ error: 'Erro ao atualizar assinatura' })
  }
})

// Estender trial (admin)
router.post('/admin/extend-trial/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { days = 7 } = req.body

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' })
    }

    const currentEnd = subscription.trialEndDate || new Date()
    const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000)

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'TRIAL',
        trialEndDate: newEnd
      }
    })

    res.json({
      message: `Trial estendido por ${days} dias`,
      newTrialEndDate: newEnd
    })
  } catch (error) {
    console.error('Erro ao estender trial:', error)
    res.status(500).json({ error: 'Erro ao estender trial' })
  }
})

// Ativar assinatura manualmente (admin) - para pagamentos manuais
router.post('/admin/activate/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { plan = 'MONTHLY', pricePaidCents, durationDays } = req.body

    let subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    const now = new Date()
    let endDate

    if (durationDays) {
      endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
    } else if (plan === 'MONTHLY') {
      endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else if (plan === 'YEARLY') {
      endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    } else if (plan === 'LIFETIME') {
      endDate = null
    }

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          plan,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          pricePaidCents,
          paymentProvider: 'MANUAL'
        }
      })
    } else {
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          pricePaidCents,
          paymentProvider: 'MANUAL'
        }
      })
    }

    res.json({
      message: 'Assinatura ativada com sucesso',
      subscription
    })
  } catch (error) {
    console.error('Erro ao ativar assinatura:', error)
    res.status(500).json({ error: 'Erro ao ativar assinatura' })
  }
})

// Cancelar assinatura (admin)
router.post('/admin/cancel/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { reason } = req.body

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' })
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelado pelo administrador'
      }
    })

    res.json({ message: 'Assinatura cancelada com sucesso' })
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    res.status(500).json({ error: 'Erro ao cancelar assinatura' })
  }
})

export default router
