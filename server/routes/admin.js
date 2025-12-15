import express from 'express'
import { z } from 'zod'
import prisma from '../config/database.js'
import { verifyToken } from '../utils/jwt.js'
import { hashPassword } from '../utils/hash.js'

const router = express.Router()

// Middleware para verificar se o usuário é admin
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    // Verificar se o usuário existe e é admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

// GET /api/admin/users - Listar todos os usuários
router.get('/users', authenticate, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {}
    
    if (role && role !== 'ALL') {
      where.role = role
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          nutricionistaId: true,
          personalId: true,
          nutricionista: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          personal: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              pacientesNutricionista: true,
              pacientesPersonal: true,
              dailyCheckIns: true,
              consumedMeals: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ])

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    res.status(500).json({ error: 'Erro ao listar usuários' })
  }
})

// GET /api/admin/users/:id - Obter detalhes de um usuário
router.get('/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePhoto: true,
        motivationalMessage: true,
        createdAt: true,
        updatedAt: true,
        nutricionistaId: true,
        personalId: true,
        nutricionista: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        personal: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        questionnaireData: true,
        dieta: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            pacientesNutricionista: true,
            pacientesPersonal: true,
            dailyCheckIns: true,
            consumedMeals: true,
            prescricoesPersonal: true,
            prescricoesPaciente: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    res.json(user)
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    res.status(500).json({ error: 'Erro ao obter usuário' })
  }
})

// PATCH /api/admin/users/:id - Atualizar usuário (role, nome, etc)
router.patch('/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const updateSchema = z.object({
      role: z.enum(['ADMIN', 'NUTRICIONISTA', 'PERSONAL', 'PACIENTE']).optional(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      nutricionistaId: z.string().uuid().nullable().optional(),
      personalId: z.string().uuid().nullable().optional()
    })

    const validatedData = updateSchema.parse(req.body)

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Validar se nutricionistaId e personalId são válidos se fornecidos
    if (validatedData.nutricionistaId !== undefined) {
      if (validatedData.nutricionistaId) {
        const nutricionista = await prisma.user.findUnique({
          where: { id: validatedData.nutricionistaId },
          select: { role: true }
        })
        if (!nutricionista || nutricionista.role !== 'NUTRICIONISTA') {
          return res.status(400).json({ error: 'Nutricionista inválido' })
        }
      }
    }

    if (validatedData.personalId !== undefined) {
      if (validatedData.personalId) {
        const personal = await prisma.user.findUnique({
          where: { id: validatedData.personalId },
          select: { role: true }
        })
        if (!personal || personal.role !== 'PERSONAL') {
          return res.status(400).json({ error: 'Personal trainer inválido' })
        }
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        nutricionistaId: true,
        personalId: true,
        updatedAt: true
      }
    })

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors })
    }
    console.error('Erro ao atualizar usuário:', error)
    res.status(500).json({ error: 'Erro ao atualizar usuário' })
  }
})

// PATCH /api/admin/users/:id/password - Resetar senha de um usuário
router.patch('/users/:id/password', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' })
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(password)

    // Atualizar senha
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Senha atualizada com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar senha:', error)
    res.status(500).json({ error: 'Erro ao atualizar senha' })
  }
})

// DELETE /api/admin/users/:id - Deletar usuário
router.delete('/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Não permitir deletar a si mesmo
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' })
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Deletar usuário (cascade vai deletar dados relacionados)
    await prisma.user.delete({
      where: { id }
    })

    res.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    res.status(500).json({ error: 'Erro ao deletar usuário' })
  }
})

// POST /api/admin/users - Criar novo usuário
router.post('/users', authenticate, async (req, res) => {
  try {
    const createSchema = z.object({
      email: z.string().email('Email inválido'),
      password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
      name: z.string().min(1, 'Nome é obrigatório'),
      role: z.enum(['ADMIN', 'NUTRICIONISTA', 'PERSONAL', 'PACIENTE']).default('PACIENTE')
    })

    const validatedData = createSchema.parse(req.body)

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' })
    }

    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.password)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors })
    }
    console.error('Erro ao criar usuário:', error)
    res.status(500).json({ error: 'Erro ao criar usuário' })
  }
})

// GET /api/admin/nutricionistas - Listar nutricionistas disponíveis
router.get('/nutricionistas', authenticate, async (req, res) => {
  try {
    const nutricionistas = await prisma.user.findMany({
      where: {
        role: 'NUTRICIONISTA'
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json({ nutricionistas })
  } catch (error) {
    console.error('Erro ao listar nutricionistas:', error)
    res.status(500).json({ error: 'Erro ao listar nutricionistas' })
  }
})

// GET /api/admin/personals - Listar personal trainers disponíveis
router.get('/personals', authenticate, async (req, res) => {
  try {
    const personals = await prisma.user.findMany({
      where: {
        role: 'PERSONAL'
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json({ personals })
  } catch (error) {
    console.error('Erro ao listar personal trainers:', error)
    res.status(500).json({ error: 'Erro ao listar personal trainers' })
  }
})

// GET /api/admin/stats - Estatísticas gerais
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [totalUsers, usersByRole, totalCheckIns, totalDiets] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      }),
      prisma.dailyCheckIn.count(),
      prisma.dieta.count()
    ])

    const stats = {
      totalUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role
        return acc
      }, {}),
      totalCheckIns,
      totalDiets
    }

    res.json(stats)
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    res.status(500).json({ error: 'Erro ao obter estatísticas' })
  }
})

export default router

