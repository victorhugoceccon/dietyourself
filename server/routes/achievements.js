import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// GET /api/achievements - Listar todas as conquistas disponíveis
router.get('/', authenticate, async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { category: 'asc' }
    })
    res.json({ achievements })
  } catch (error) {
    console.error('Erro ao listar conquistas:', error)
    res.status(500).json({ error: 'Erro ao listar conquistas' })
  }
})

// GET /api/achievements/user/:userId - Conquistas do usuário
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params
    const { grupoId } = req.query

    const where = { userId }
    if (grupoId) {
      where.grupoId = grupoId
    }

    const userAchievements = await prisma.userAchievement.findMany({
      where,
      include: {
        achievement: true
      },
      orderBy: { unlockedAt: 'desc' }
    })

    res.json({ achievements: userAchievements })
  } catch (error) {
    console.error('Erro ao buscar conquistas do usuário:', error)
    res.status(500).json({ error: 'Erro ao buscar conquistas' })
  }
})

// POST /api/achievements/unlock - Desbloquear conquista (chamado internamente)
router.post('/unlock', authenticate, async (req, res) => {
  try {
    const { userId, achievementCode, grupoId } = req.body

    // Buscar conquista
    const achievement = await prisma.achievement.findUnique({
      where: { code: achievementCode }
    })

    if (!achievement) {
      return res.status(404).json({ error: 'Conquista não encontrada' })
    }

    // Verificar se já tem
    const existing = await prisma.userAchievement.findFirst({
      where: {
        userId,
        achievementId: achievement.id,
        grupoId: grupoId || null
      }
    })

    if (existing) {
      return res.json({ achievement: existing, alreadyUnlocked: true })
    }

    // Desbloquear
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        grupoId: grupoId || null
      },
      include: {
        achievement: true
      }
    })

    res.json({ achievement: userAchievement, alreadyUnlocked: false })
  } catch (error) {
    console.error('Erro ao desbloquear conquista:', error)
    res.status(500).json({ error: 'Erro ao desbloquear conquista' })
  }
})

export default router
