import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Listar notificações do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Últimas 50 notificações
    })

    res.json({ notifications })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    res.status(500).json({ error: 'Erro ao buscar notificações' })
  }
})

// Contar notificações não lidas
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    const count = await prisma.notification.count({
      where: { userId, read: false }
    })

    res.json({ count })
  } catch (error) {
    console.error('Erro ao contar notificações:', error)
    res.status(500).json({ error: 'Erro ao contar notificações' })
  }
})

// Marcar notificação como lida
router.patch('/:notificationId/read', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { notificationId } = req.params

    // Verificar se a notificação pertence ao usuário
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' })
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    res.status(500).json({ error: 'Erro ao marcar como lida' })
  }
})

// Marcar todas como lidas
router.patch('/mark-all-read', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error)
    res.status(500).json({ error: 'Erro ao marcar todas como lidas' })
  }
})

// Criar notificação (uso interno/admin)
router.post('/', authenticate, async (req, res) => {
  try {
    const { targetUserId, type, message, metadata } = req.body
    const requesterId = req.user.userId
    const requesterRole = req.user.role?.toUpperCase()

    // Apenas admins ou profissionais podem criar notificações para outros
    if (targetUserId !== requesterId && 
        !['ADMIN', 'NUTRICIONISTA', 'PERSONAL'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Sem permissão para criar notificações' })
    }

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId || requesterId,
        type: type || 'default',
        message,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })

    res.status(201).json({ notification })
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    res.status(500).json({ error: 'Erro ao criar notificação' })
  }
})

// Utilidade: criar notificação para um usuário (para uso em outras rotas)
export async function createNotification(userId, type, message, metadata = null) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    // Não lançar erro para não interromper fluxo principal
  }
}

export default router


