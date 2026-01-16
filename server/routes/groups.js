import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { requireActiveSubscription } from '../middleware/subscription.js'
import { z } from 'zod'
import crypto from 'crypto'

const router = express.Router()

// Rota PÚBLICA para buscar informações do grupo (para página de convite)
router.get('/public/:codigo', async (req, res) => {
  try {
    const codigo = req.params.codigo.trim().toUpperCase()
    
    const grupo = await prisma.grupo.findUnique({
      where: { codigoConvite: codigo },
      include: {
        _count: { select: { membros: true } }
      }
    })

    if (!grupo || !grupo.ativo) {
      return res.status(404).json({ error: 'Projeto não encontrado' })
    }

    res.json({
      grupo: {
        id: grupo.id,
        nome: grupo.nome,
        descricao: grupo.descricao,
        bannerUrl: grupo.bannerUrl,
        membrosCount: grupo._count.membros
      }
    })
  } catch (error) {
    console.error('Erro ao buscar grupo público:', error)
    res.status(500).json({ error: 'Erro ao buscar projeto' })
  }
})

// Aplicar verificação de assinatura nas rotas protegidas
router.use(authenticate)
router.use(requireActiveSubscription)

const createGroupSchema = z.object({
  nome: z.string().min(2).max(60),
  descricao: z.string().max(280).optional().nullable(),
  bannerUrl: z.string().max(3 * 1024 * 1024).optional().nullable(), // base64/url (limite ~3MB)
  inicio: z.string().datetime().optional().nullable(),
  fim: z.string().datetime().optional().nullable()
})

const joinGroupSchema = z.object({
  codigo: z.string().min(4).max(12)
})

const leaderboardQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
})

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem 0/O/1/I para evitar confusão
function generateInviteCode(len = 6) {
  const bytes = crypto.randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return out
}

async function requireMembership(userId, grupoId) {
  const membership = await prisma.grupoMembro.findUnique({
    where: { grupoId_userId: { grupoId, userId } }
  })
  return membership
}

// GET /api/groups - listar grupos do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    const memberships = await prisma.grupoMembro.findMany({
      where: { userId },
      include: {
        grupo: {
          include: {
            _count: { select: { membros: true } }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    const grupos = memberships.map(m => ({
      id: m.grupo.id,
      nome: m.grupo.nome,
      descricao: m.grupo.descricao,
      bannerUrl: m.grupo.bannerUrl,
      codigoConvite: m.grupo.codigoConvite,
      ativo: m.grupo.ativo,
      inicio: m.grupo.inicio,
      fim: m.grupo.fim,
      membrosCount: m.grupo._count.membros,
      meuPapel: m.papel,
      joinedAt: m.joinedAt
    }))

    res.json({ grupos })
  } catch (error) {
    console.error('Erro ao listar grupos:', error)
    res.status(500).json({ error: 'Erro ao listar grupos' })
  }
})

// POST /api/groups - criar grupo
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const validated = createGroupSchema.parse(req.body)

    // gerar código único com retry simples
    let codigoConvite = generateInviteCode(6)
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.grupo.findUnique({ where: { codigoConvite } })
      if (!exists) break
      codigoConvite = generateInviteCode(6)
    }

    const grupo = await prisma.grupo.create({
      data: {
        nome: validated.nome,
        descricao: validated.descricao ?? null,
        bannerUrl: validated.bannerUrl ?? null,
        codigoConvite,
        inicio: validated.inicio ? new Date(validated.inicio) : null,
        fim: validated.fim ? new Date(validated.fim) : null,
        criadoPorId: userId,
        membros: {
          create: {
            userId,
            papel: 'DONO'
          }
        }
      },
      include: {
        _count: { select: { membros: true } }
      }
    })

    res.status(201).json({
      message: 'Grupo criado com sucesso',
      grupo: {
        id: grupo.id,
        nome: grupo.nome,
        descricao: grupo.descricao,
        bannerUrl: grupo.bannerUrl,
        codigoConvite: grupo.codigoConvite,
        ativo: grupo.ativo,
        inicio: grupo.inicio,
        fim: grupo.fim,
        membrosCount: grupo._count.membros
      }
    })
  } catch (error) {
    console.error('=== ERRO AO CRIAR GRUPO ===')
    console.error('Tipo do erro:', error.constructor.name)
    console.error('Código do erro:', error.code)
    console.error('Mensagem:', error.message)
    console.error('Meta do erro:', error.meta)
    console.error('Stack completo:', error.stack)
    console.error('=== FIM DO ERRO ===')
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors })
    }
    
    // Erros específicos do Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Código de convite já existe. Tente novamente.',
        code: 'DUPLICATE_CODE'
      })
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Usuário não encontrado ou inválido',
        code: 'INVALID_USER'
      })
    }
    
    if (error.code === 'P2021' || error.code === '42P01') {
      return res.status(500).json({ 
        error: 'Tabela de grupos não existe no banco de dados. Execute as migrações.',
        code: 'TABLE_NOT_FOUND'
      })
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar grupo',
      message: error.message || 'Erro desconhecido',
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        meta: error.meta 
      })
    })
  }
})

// POST /api/groups/join - entrar em um grupo por código
router.post('/join', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { codigo } = joinGroupSchema.parse(req.body)
    const normalizedCode = codigo.trim().toUpperCase()

    const grupo = await prisma.grupo.findUnique({
      where: { codigoConvite: normalizedCode }
    })

    if (!grupo || !grupo.ativo) {
      return res.status(404).json({ error: 'Grupo não encontrado' })
    }

    const existing = await prisma.grupoMembro.findUnique({
      where: { grupoId_userId: { grupoId: grupo.id, userId } }
    })
    if (existing) {
      return res.status(400).json({ error: 'Você já está neste grupo' })
    }

    await prisma.grupoMembro.create({
      data: {
        grupoId: grupo.id,
        userId,
        papel: 'MEMBRO'
      }
    })

    res.json({ message: 'Você entrou no grupo com sucesso', grupoId: grupo.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors })
    }
    console.error('Erro ao entrar no grupo:', error)
    res.status(500).json({ error: 'Erro ao entrar no grupo' })
  }
})

// GET /api/groups/:id - detalhes do grupo + membros
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id

    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      include: {
        _count: { select: { membros: true } },
        membros: {
          include: {
            user: { select: { id: true, name: true, email: true, profilePhoto: true } }
          },
          orderBy: { joinedAt: 'asc' }
        }
      }
    })

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' })
    }

    res.json({
      grupo: {
        id: grupo.id,
        nome: grupo.nome,
        descricao: grupo.descricao,
        bannerUrl: grupo.bannerUrl,
        codigoConvite: grupo.codigoConvite,
        ativo: grupo.ativo,
        inicio: grupo.inicio,
        fim: grupo.fim,
        membrosCount: grupo._count.membros,
        meuPapel: membership.papel,
        membros: grupo.membros.map(m => ({
          userId: m.userId,
          papel: m.papel,
          joinedAt: m.joinedAt,
          user: m.user
        }))
      }
    })
  } catch (error) {
    console.error('Erro ao buscar detalhes do grupo:', error)
    res.status(500).json({ error: 'Erro ao buscar detalhes do grupo' })
  }
})

// GET /api/groups/:id/leaderboard - ranking por pontos
router.get('/:id/leaderboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id

    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    const { from, to } = leaderboardQuerySchema.parse(req.query)
    const where = { grupoId }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const grouped = await prisma.grupoPontosEvento.groupBy({
      by: ['userId'],
      where,
      _sum: { pontos: true }
    })

    const userIds = grouped.map(g => g.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, profilePhoto: true }
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    const leaderboard = grouped
      .map(g => ({
        user: userMap.get(g.userId) || { id: g.userId, name: null, email: null, profilePhoto: null },
        pontos: g._sum.pontos || 0
      }))
      .sort((a, b) => b.pontos - a.pontos)
      .map((item, idx) => ({ ...item, posicao: idx + 1 }))

    res.json({ leaderboard })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parâmetros inválidos', details: error.errors })
    }
    console.error('Erro ao buscar leaderboard:', error)
    res.status(500).json({ error: 'Erro ao buscar leaderboard' })
  }
})

// POST /api/groups/:id/checkins - Criar check-in de grupo
router.post('/:id/checkins', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id

    // Verificar se o usuário é membro do grupo
    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    const {
      photoUrl,
      title,
      description,
      locationName,
      locationLat,
      locationLng,
      activity,
      duration,
      distance,
      calories,
      steps,
      treinoExecutadoId
    } = req.body

    // Validar treinoExecutadoId se fornecido
    if (treinoExecutadoId) {
      const treino = await prisma.treinoExecutado.findUnique({
        where: { id: treinoExecutadoId },
        select: { pacienteId: true, finalizado: true }
      })

      if (!treino) {
        return res.status(404).json({ error: 'Treino executado não encontrado' })
      }

      if (treino.pacienteId !== userId) {
        return res.status(403).json({ error: 'Este treino não pertence a você' })
      }

      if (!treino.finalizado) {
        return res.status(400).json({ error: 'Apenas treinos finalizados podem ser vinculados a check-ins' })
      }
    }

    // Criar check-in
    const checkIn = await prisma.grupoTreinoCheckIn.create({
      data: {
        grupoId,
        userId,
        photoUrl: photoUrl || null,
        title: title?.trim() || null,
        description: description?.trim() || null,
        locationName: locationName?.trim() || null,
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        activity: activity || null,
        duration: duration ? parseInt(duration) : null,
        distance: distance ? parseFloat(distance) : null,
        calories: calories ? parseInt(calories) : null,
        steps: steps ? parseInt(steps) : null,
        treinoExecutadoId: treinoExecutadoId || null
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePhoto: true }
        },
        treinoExecutado: {
          include: {
            prescricao: { select: { id: true, nome: true } },
            divisao: { select: { id: true, nome: true } }
          }
        }
      }
    })

    // Registrar pontos para o grupo
    try {
      const { upsertGroupCheckInPointsEvent } = await import('../utils/groupPoints.js')
      await upsertGroupCheckInPointsEvent({
        userId,
        grupoId,
        checkInId: checkIn.id
      })
    } catch (pointsError) {
      console.warn('⚠️ Erro ao registrar pontos de check-in (ignorado):', pointsError?.message || pointsError)
    }

    res.status(201).json({
      message: 'Check-in criado com sucesso',
      checkIn
    })
  } catch (error) {
    console.error('Erro ao criar check-in:', error)
    res.status(500).json({ error: 'Erro ao criar check-in' })
  }
})

// GET /api/groups/:id/checkins - Listar check-ins do grupo (treino + dieta unificados)
router.get('/:id/checkins', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id
    const { type } = req.query // 'treino', 'dieta', ou undefined (todos)

    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    const [treinoCheckIns, dietaCheckIns] = await Promise.all([
      type !== 'dieta' ? prisma.grupoTreinoCheckIn.findMany({
        where: { grupoId },
        include: {
          user: {
            select: { id: true, name: true, email: true, profilePhoto: true }
          },
          treinoExecutado: {
            include: {
              prescricao: { select: { id: true, nome: true } },
              divisao: { select: { id: true, nome: true } }
            }
          },
          reactions: {
            include: {
              user: {
                select: { id: true, name: true, email: true, profilePhoto: true }
              }
            }
          },
          _count: {
            select: { comments: true, reactions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: type === 'treino' ? 50 : 25
      }) : [],
      type !== 'treino' ? prisma.grupoDietaCheckIn.findMany({
        where: { grupoId },
        include: {
          user: {
            select: { id: true, name: true, email: true, profilePhoto: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: type === 'dieta' ? 50 : 25
      }) : []
    ])

    // Combinar e ordenar por data
    const allCheckIns = [
      ...treinoCheckIns.map(ci => ({ ...ci, type: 'treino' })),
      ...dietaCheckIns.map(ci => ({ ...ci, type: 'dieta' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50)

    res.json({ checkIns: allCheckIns })
  } catch (error) {
    console.error('Erro ao listar check-ins:', error)
    res.status(500).json({ error: 'Erro ao listar check-ins' })
  }
})

// ==========================================================
// REAÇÕES (Fase 1.1)
// ==========================================================

// POST /api/groups/:id/checkins/:checkInId/reactions - Adicionar reação
router.post('/:id/checkins/:checkInId/reactions', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id
    const checkInId = req.params.checkInId
    const { emoji } = req.body

    // Validar emoji
    const validEmojis = ['🔥', '💪', '👏', '🎯', '⚡', '❤️']
    if (!validEmojis.includes(emoji)) {
      return res.status(400).json({ error: 'Emoji inválido' })
    }

    // Verificar se o usuário é membro do grupo
    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    // Verificar se o check-in existe e pertence ao grupo
    const checkIn = await prisma.grupoTreinoCheckIn.findFirst({
      where: {
        id: checkInId,
        grupoId
      }
    })

    if (!checkIn) {
      return res.status(404).json({ error: 'Check-in não encontrado' })
    }

    // Adicionar ou remover reação (toggle)
    const existing = await prisma.checkInReaction.findUnique({
      where: {
        checkInId_userId_emoji: {
          checkInId,
          userId,
          emoji
        }
      }
    })

    if (existing) {
      // Remover reação
      await prisma.checkInReaction.delete({
        where: { id: existing.id }
      })
      return res.json({ reaction: null, action: 'removed' })
    } else {
      // Adicionar reação
      const reaction = await prisma.checkInReaction.create({
        data: {
          checkInId,
          userId,
          emoji
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, profilePhoto: true }
          }
        }
      })
      return res.json({ reaction, action: 'added' })
    }
  } catch (error) {
    console.error('Erro ao adicionar reação:', error)
    res.status(500).json({ error: 'Erro ao adicionar reação' })
  }
})

// GET /api/groups/:id/checkins/:checkInId/reactions - Listar reações
router.get('/:id/checkins/:checkInId/reactions', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id
    const checkInId = req.params.checkInId

    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    const reactions = await prisma.checkInReaction.findMany({
      where: { checkInId },
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePhoto: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Agrupar por emoji
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    }, {})

    res.json({ reactions: grouped, total: reactions.length })
  } catch (error) {
    console.error('Erro ao listar reações:', error)
    res.status(500).json({ error: 'Erro ao listar reações' })
  }
})

// ==========================================================
// COMENTÁRIOS (Fase 1.2)
// ==========================================================

// POST /api/groups/:id/checkins/:checkInId/comments - Adicionar comentário
router.post('/:id/checkins/:checkInId/comments', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id
    const checkInId = req.params.checkInId
    const { content, parentId } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório' })
    }

    if (content.length > 500) {
      return res.status(400).json({ error: 'Comentário muito longo (máximo 500 caracteres)' })
    }

    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    // Verificar se o check-in existe
    const checkIn = await prisma.grupoTreinoCheckIn.findFirst({
      where: {
        id: checkInId,
        grupoId
      }
    })

    if (!checkIn) {
      return res.status(404).json({ error: 'Check-in não encontrado' })
    }

    // Se for resposta, verificar se o comentário pai existe
    if (parentId) {
      const parent = await prisma.checkInComment.findFirst({
        where: {
          id: parentId,
          checkInId
        }
      })
      if (!parent) {
        return res.status(404).json({ error: 'Comentário pai não encontrado' })
      }
    }

    const comment = await prisma.checkInComment.create({
      data: {
        checkInId,
        userId,
        content: content.trim(),
        parentId: parentId || null
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePhoto: true }
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true, profilePhoto: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    res.status(201).json({ comment })
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error)
    res.status(500).json({ error: 'Erro ao adicionar comentário' })
  }
})

// GET /api/groups/:id/checkins/:checkInId/comments - Listar comentários
router.get('/:id/checkins/:checkInId/comments', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id
    const checkInId = req.params.checkInId

    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    const comments = await prisma.checkInComment.findMany({
      where: {
        checkInId,
        parentId: null // Apenas comentários principais
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePhoto: true }
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true, profilePhoto: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ comments })
  } catch (error) {
    console.error('Erro ao listar comentários:', error)
    res.status(500).json({ error: 'Erro ao listar comentários' })
  }
})

// DELETE /api/groups/:id/checkins/:checkInId/comments/:commentId - Deletar comentário
router.delete('/:id/checkins/:checkInId/comments/:commentId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id
    const checkInId = req.params.checkInId
    const commentId = req.params.commentId

    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    const comment = await prisma.checkInComment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' })
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'Você não pode deletar este comentário' })
    }

    await prisma.checkInComment.delete({
      where: { id: commentId }
    })

    res.json({ message: 'Comentário deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar comentário:', error)
    res.status(500).json({ error: 'Erro ao deletar comentário' })
  }
})

// ==========================================================
// CHECK-IN DE DIETA (Fase 1.3)
// ==========================================================

// POST /api/groups/:id/dieta-checkins - Criar check-in de dieta
router.post('/:id/dieta-checkins', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id

    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    const {
      photoUrl,
      photoMealId,
      title,
      description,
      totalKcal,
      totalProtein,
      totalCarbs,
      totalFat,
      mealName
    } = req.body

    // Se tiver photoMealId, buscar dados do PhotoMeal
    let finalKcal = totalKcal
    let finalProtein = totalProtein
    let finalCarbs = totalCarbs
    let finalFat = totalFat
    let finalMealName = mealName

    if (photoMealId) {
      const photoMeal = await prisma.photoMeal.findUnique({
        where: { id: photoMealId },
        select: {
          totalKcal: true,
          totalProtein: true,
          totalCarbs: true,
          totalFat: true,
          mealName: true,
          userId: true
        }
      })

      if (!photoMeal) {
        return res.status(404).json({ error: 'Refeição por foto não encontrada' })
      }

      if (photoMeal.userId !== userId) {
        return res.status(403).json({ error: 'Esta refeição não pertence a você' })
      }

      finalKcal = photoMeal.totalKcal
      finalProtein = photoMeal.totalProtein
      finalCarbs = photoMeal.totalCarbs
      finalFat = photoMeal.totalFat
      finalMealName = photoMeal.mealName
    }

    const checkIn = await prisma.grupoDietaCheckIn.create({
      data: {
        grupoId,
        userId,
        photoMealId: photoMealId || null,
        photoUrl: photoUrl || null,
        title: title?.trim() || null,
        description: description?.trim() || null,
        totalKcal: finalKcal || null,
        totalProtein: finalProtein || null,
        totalCarbs: finalCarbs || null,
        totalFat: finalFat || null,
        mealName: finalMealName || null
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePhoto: true }
        }
      }
    })

    // Registrar pontos (similar ao check-in de treino)
    try {
      const { upsertGroupDietaCheckInPointsEvent } = await import('../utils/groupPoints.js')
      await upsertGroupDietaCheckInPointsEvent({
        userId,
        grupoId,
        checkInId: checkIn.id
      })
    } catch (pointsError) {
      console.warn('⚠️ Erro ao registrar pontos de check-in de dieta (ignorado):', pointsError?.message || pointsError)
    }

    res.status(201).json({
      message: 'Check-in de dieta criado com sucesso',
      checkIn
    })
  } catch (error) {
    console.error('Erro ao criar check-in de dieta:', error)
    res.status(500).json({ error: 'Erro ao criar check-in de dieta' })
  }
})

// GET /api/groups/:id/dieta-checkins - Listar check-ins de dieta
router.get('/:id/dieta-checkins', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const grupoId = req.params.id

    const membership = await requireMembership(userId, grupoId)
    if (!membership) {
      return res.status(403).json({ error: 'Você não tem acesso a este grupo' })
    }

    const checkIns = await prisma.grupoDietaCheckIn.findMany({
      where: { grupoId },
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePhoto: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json({ checkIns })
  } catch (error) {
    console.error('Erro ao listar check-ins de dieta:', error)
    res.status(500).json({ error: 'Erro ao listar check-ins de dieta' })
  }
})

export default router


