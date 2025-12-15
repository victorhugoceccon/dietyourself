import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { z } from 'zod'

const router = express.Router()

// Schema de validação para check-in
const checkInSchema = z.object({
  adherence: z.enum(['TOTAL', 'PARCIAL', 'NAO_SEGUIU']),
  pesoAtual: z.number().positive().max(500).optional().nullable(),
  observacao: z.string().max(500).optional().nullable(),
  checkInDate: z.string().datetime().optional(), // ISO datetime string
  refeicoesConsumidas: z.array(z.number().int()).optional().nullable() // Array de índices das refeições consumidas
})

// POST /api/checkin - Criar ou atualizar check-in do dia
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const validatedData = checkInSchema.parse(req.body)

    // Determinar a data do check-in (usar a data fornecida ou hoje)
    let checkInDate = new Date()
    if (validatedData.checkInDate) {
      checkInDate = new Date(validatedData.checkInDate)
    }
    // Normalizar para meia-noite (apenas data, sem hora)
    checkInDate.setHours(0, 0, 0, 0)

    // Verificar se já existe check-in para esta data
    const existingCheckIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_checkInDate: {
          userId,
          checkInDate
        }
      }
    })

    let checkIn
    if (existingCheckIn) {
      // Atualizar check-in existente
      checkIn = await prisma.dailyCheckIn.update({
        where: { id: existingCheckIn.id },
        data: {
          adherence: validatedData.adherence,
          pesoAtual: validatedData.pesoAtual ?? null,
          observacao: validatedData.observacao ?? null,
          refeicoesConsumidas: validatedData.refeicoesConsumidas ? JSON.stringify(validatedData.refeicoesConsumidas) : null
        }
      })
    } else {
      // Criar novo check-in
      checkIn = await prisma.dailyCheckIn.create({
        data: {
          userId,
          adherence: validatedData.adherence,
          pesoAtual: validatedData.pesoAtual ?? null,
          observacao: validatedData.observacao ?? null,
          checkInDate,
          refeicoesConsumidas: validatedData.refeicoesConsumidas ? JSON.stringify(validatedData.refeicoesConsumidas) : null
        }
      })
    }

    res.json({
      message: 'Check-in registrado com sucesso!',
      checkIn
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao registrar check-in:', error)
    res.status(500).json({ error: 'Erro ao registrar check-in' })
  }
})

// GET /api/checkin - Listar check-ins do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { limit = 90, offset = 0 } = req.query // Padrão: últimos 90 dias

    const checkIns = await prisma.dailyCheckIn.findMany({
      where: { userId },
      orderBy: { checkInDate: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    })

    res.json({ checkIns })
  } catch (error) {
    console.error('Erro ao buscar check-ins:', error)
    res.status(500).json({ error: 'Erro ao buscar check-ins' })
  }
})

// GET /api/checkin/today - Buscar check-in de hoje
router.get('/today', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_checkInDate: {
          userId,
          checkInDate: today
        }
      }
    })

    // Verificar se o usuário já tem uma dieta gerada
    const dieta = await prisma.dieta.findUnique({
      where: { userId },
      select: { createdAt: true }
    })

    let shouldShowCheckIn = false

    if (dieta) {
      // Só exibir o check-in a partir do dia seguinte à geração da dieta
      const dietCreationDate = new Date(dieta.createdAt)
      dietCreationDate.setHours(0, 0, 0, 0)

      // Se hoje é depois do dia da criação da dieta E ainda não existe check-in hoje,
      // então devemos mostrar o modal de check-in
      if (today.getTime() > dietCreationDate.getTime() && !checkIn) {
        shouldShowCheckIn = true
      }
    }

    res.json({ checkIn, hasDiet: !!dieta, shouldShowCheckIn })
  } catch (error) {
    console.error('Erro ao buscar check-in de hoje:', error)
    res.status(500).json({ error: 'Erro ao buscar check-in de hoje' })
  }
})

// GET /api/checkin/stats - Estatísticas e insights
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Buscar últimos 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const checkIns = await prisma.dailyCheckIn.findMany({
      where: {
        userId,
        checkInDate: { gte: thirtyDaysAgo }
      },
      orderBy: { checkInDate: 'desc' }
    })

    // Calcular estatísticas
    const totalCheckIns = checkIns.length
    const totalAdherence = checkIns.filter(c => c.adherence === 'TOTAL').length
    const parcialAdherence = checkIns.filter(c => c.adherence === 'PARCIAL').length
    const naoSeguiu = checkIns.filter(c => c.adherence === 'NAO_SEGUIU').length

    // Adesão semanal (últimos 7 dias)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const weeklyCheckIns = checkIns.filter(c => 
      new Date(c.checkInDate) >= sevenDaysAgo
    )

    const weeklyStats = {
      total: weeklyCheckIns.length,
      totalAdherence: weeklyCheckIns.filter(c => c.adherence === 'TOTAL').length,
      parcialAdherence: weeklyCheckIns.filter(c => c.adherence === 'PARCIAL').length,
      naoSeguiu: weeklyCheckIns.filter(c => c.adherence === 'NAO_SEGUIU').length
    }

    // Sequência atual (dias consecutivos)
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Verificar se tem check-in hoje
    const todayCheckIn = checkIns.find(c => {
      const checkInDate = new Date(c.checkInDate)
      checkInDate.setHours(0, 0, 0, 0)
      return checkInDate.getTime() === today.getTime()
    })

    if (todayCheckIn) {
      currentStreak = 1
      let checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - 1)

      // Contar dias consecutivos anteriores
      while (true) {
        const dayCheckIn = checkIns.find(c => {
          const checkInDate = new Date(c.checkInDate)
          checkInDate.setHours(0, 0, 0, 0)
          return checkInDate.getTime() === checkDate.getTime()
        })

        if (dayCheckIn) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Gerar insights motivacionais
    const insights = generateInsights(checkIns, weeklyStats, currentStreak)

    res.json({
      stats: {
        last30Days: {
          total: totalCheckIns,
          totalAdherence,
          parcialAdherence,
          naoSeguiu,
          adherenceRate: totalCheckIns > 0 ? ((totalAdherence + parcialAdherence * 0.5) / totalCheckIns * 100).toFixed(1) : 0
        },
        weekly: {
          ...weeklyStats,
          adherenceRate: weeklyStats.total > 0 ? ((weeklyStats.totalAdherence + weeklyStats.parcialAdherence * 0.5) / weeklyStats.total * 100).toFixed(1) : 0
        },
        currentStreak
      },
      insights
    })
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error)
    res.status(500).json({ error: 'Erro ao calcular estatísticas' })
  }
})

// Função para gerar insights motivacionais
function generateInsights(checkIns, weeklyStats, currentStreak) {
  const insights = []

  // Insight sobre sequência
  if (currentStreak >= 7) {
    insights.push({
      type: 'success',
      message: `Incrível! Você já mantém ${currentStreak} dias consecutivos de check-in. Continue assim! 🔥`,
      emoji: '🔥'
    })
  } else if (currentStreak >= 3) {
    insights.push({
      type: 'success',
      message: `Ótimo! Você está em uma sequência de ${currentStreak} dias. Mantenha o ritmo! 💪`,
      emoji: '💪'
    })
  }

  // Insight sobre adesão semanal
  const weeklyAdherenceRate = weeklyStats.total > 0 
    ? ((weeklyStats.totalAdherence + weeklyStats.parcialAdherence * 0.5) / weeklyStats.total * 100)
    : 0

  if (weeklyAdherenceRate >= 85) {
    insights.push({
      type: 'success',
      message: 'Excelente adesão nesta semana! Você está no caminho certo. 🌟',
      emoji: '🌟'
    })
  } else if (weeklyAdherenceRate >= 60) {
    insights.push({
      type: 'info',
      message: 'Boa adesão esta semana! Pequenos ajustes podem fazer grande diferença. ✨',
      emoji: '✨'
    })
  } else if (weeklyStats.total > 0) {
    insights.push({
      type: 'info',
      message: 'Cada dia é uma nova oportunidade. Continue registrando seus check-ins! 💚',
      emoji: '💚'
    })
  }

  // Insight sobre progresso
  if (checkIns.length >= 7) {
    const lastWeek = checkIns.slice(0, 7)
    const previousWeek = checkIns.slice(7, 14)

    if (previousWeek.length > 0) {
      const lastWeekTotal = lastWeek.filter(c => c.adherence === 'TOTAL').length
      const previousWeekTotal = previousWeek.filter(c => c.adherence === 'TOTAL').length

      if (lastWeekTotal > previousWeekTotal) {
        insights.push({
          type: 'success',
          message: 'Você melhorou sua adesão esta semana comparado à anterior! Continue evoluindo! 📈',
          emoji: '📈'
        })
      }
    }
  }

  // Insight padrão se não houver check-ins suficientes
  if (insights.length === 0 && checkIns.length > 0) {
    insights.push({
      type: 'info',
      message: 'Continue registrando seus check-ins! Cada dia conta para sua jornada. 🌱',
      emoji: '🌱'
    })
  }

  // Se não houver check-ins ainda
  if (checkIns.length === 0) {
    insights.push({
      type: 'info',
      message: 'Comece hoje! Registre seu primeiro check-in e comece a acompanhar seu progresso. 🎯',
      emoji: '🎯'
    })
  }

  return insights
}

export default router

