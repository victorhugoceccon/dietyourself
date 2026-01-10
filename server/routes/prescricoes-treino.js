import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { requireActiveSubscription } from '../middleware/subscription.js'
import { z } from 'zod'

const router = express.Router()

// Aplicar verificação de assinatura em todas as rotas (exceto para personais)
router.use(authenticate)
router.use(requireActiveSubscription)

// Schema de validação para prescrição de treino
const prescricaoTreinoSchema = z.object({
  pacienteId: z.string().min(1, 'ID do paciente é obrigatório'),
  nome: z.string().min(1, 'Nome do treino é obrigatório'),
  observacoes: z.string().optional().nullable(),
  dataInicio: z.string().datetime().optional().nullable(),
  dataFim: z.string().datetime().optional().nullable(),
  ativo: z.boolean().optional().default(true),
  divisoes: z.array(z.object({
    nome: z.string().min(1),
    ordem: z.number().int().min(1),
    divisaoTreinoId: z.string().optional().nullable(),
    grupoMuscularPrincipal: z.string().optional().nullable(),
    grupoMuscularSecundario: z.string().optional().nullable(),
    diaSemana: z.string().optional().nullable(),
    itens: z.array(z.object({
      exercicioId: z.string().min(1),
      series: z.number().int().min(1),
      repeticoes: z.string().optional().nullable(),
      carga: z.string().optional().nullable(),
      descanso: z.string().optional().nullable(),
      observacoes: z.string().optional().nullable(),
      ordem: z.number().int().min(1)
    }))
  })).min(1, 'Pelo menos uma divisão é necessária')
})

// GET /api/prescricoes-treino - Listar prescrições
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { pacienteId } = req.query
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    let whereClause = {}
    
    if (user?.role === 'PERSONAL') {
      // Personal vê apenas suas próprias prescrições
      whereClause.personalId = userId
    } else if (user?.role === 'PACIENTE') {
      // Paciente vê apenas suas próprias prescrições
      whereClause.pacienteId = userId
    } else if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    if (pacienteId) {
      whereClause.pacienteId = pacienteId
    }
    
    const prescricoes = await prisma.prescricaoTreino.findMany({
      where: whereClause,
      include: {
        paciente: {
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
        divisoes: {
          include: {
            itens: {
              include: {
                exercicio: {
                  select: {
                    id: true,
                    nome: true,
                    categoria: true,
                    videoUrl: true,
                    descricao: true
                  }
                }
              },
              orderBy: { ordem: 'asc' }
            }
          },
          orderBy: { ordem: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json({ prescricoes })
  } catch (error) {
    console.error('Erro ao listar prescrições:', error)
    res.status(500).json({ error: 'Erro ao listar prescrições' })
  }
})

// GET /api/prescricoes-treino/:id - Buscar prescrição específica
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    const prescricao = await prisma.prescricaoTreino.findUnique({
      where: { id },
      include: {
        paciente: {
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
        divisoes: {
          include: {
            divisaoTreino: {
              select: {
                id: true,
                nome: true,
                descricao: true
              }
            },
            itens: {
              include: {
                exercicio: true
              },
              orderBy: { ordem: 'asc' }
            }
          },
          orderBy: { ordem: 'asc' }
        }
      }
    })
    
    if (!prescricao) {
      return res.status(404).json({ error: 'Prescrição não encontrada' })
    }
    
    // Verificar acesso
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role === 'PERSONAL' && prescricao.personalId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    if (user?.role === 'PACIENTE' && prescricao.pacienteId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    res.json({ prescricao })
  } catch (error) {
    console.error('Erro ao buscar prescrição:', error)
    res.status(500).json({ error: 'Erro ao buscar prescrição' })
  }
})

// POST /api/prescricoes-treino - Criar prescrição
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas personal trainers podem criar prescrições.' })
    }
    
    const validatedData = prescricaoTreinoSchema.parse(req.body)
    
    // Verificar se o paciente existe
    const paciente = await prisma.user.findUnique({
      where: { id: validatedData.pacienteId },
      select: { id: true, role: true, personalId: true }
    })
    
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' })
    }
    
    // Verificar se o paciente pertence a este personal (se não for admin)
    if (user?.role !== 'ADMIN' && paciente.personalId !== userId) {
      return res.status(403).json({ error: 'Este paciente não está vinculado a você.' })
    }
    
    // Verificar se todos os exercícios pertencem ao personal
    for (const divisao of validatedData.divisoes) {
      for (const item of divisao.itens) {
        const exercicio = await prisma.exercicio.findUnique({
          where: { id: item.exercicioId },
          select: { personalId: true }
        })
        
        if (!exercicio) {
          return res.status(404).json({ error: `Exercício ${item.exercicioId} não encontrado` })
        }
        
        if (exercicio.personalId !== userId && user?.role !== 'ADMIN') {
          return res.status(403).json({ error: 'Você só pode usar exercícios que você criou.' })
        }
      }
    }
    
    // Criar (ou vincular) divisões de treino modelo quando necessário
    const divisoesComModelo = []

    for (const div of validatedData.divisoes) {
      let divisaoTreinoId = div.divisaoTreinoId || null

      // Se não tem divisaoTreinoId, criar uma nova divisão de treino modelo
      if (!divisaoTreinoId) {
        const novaDivisao = await prisma.divisaoTreino.create({
          data: {
            nome: div.nome,
            descricao: null,
            diasSemana: null,
            personalId: userId
          }
        })
        divisaoTreinoId = novaDivisao.id

        // Criar itens modelo para essa divisão de treino
        if (div.itens && div.itens.length > 0) {
          await prisma.divisaoTreinoItem.createMany({
            data: div.itens.map((item) => ({
              divisaoTreinoId: novaDivisao.id,
              exercicioId: item.exercicioId,
              series: item.series,
              repeticoes: item.repeticoes || null,
              carga: item.carga || null,
              descanso: item.descanso || null,
              observacoes: item.observacoes || null,
              ordem: item.ordem
            }))
          })
        }
      }

      divisoesComModelo.push({
        ...div,
        divisaoTreinoId
      })
    }

    // Criar prescrição com divisões e itens
    const prescricao = await prisma.prescricaoTreino.create({
      data: {
        pacienteId: validatedData.pacienteId,
        personalId: userId,
        nome: validatedData.nome,
        observacoes: validatedData.observacoes,
        dataInicio: validatedData.dataInicio ? new Date(validatedData.dataInicio) : null,
        dataFim: validatedData.dataFim ? new Date(validatedData.dataFim) : null,
        ativo: validatedData.ativo ?? true,
        divisoes: {
          create: divisoesComModelo.map((div) => ({
            nome: div.nome,
            ordem: div.ordem,
            divisaoTreinoId: div.divisaoTreinoId || null,
            grupoMuscularPrincipal: div.grupoMuscularPrincipal || null,
            grupoMuscularSecundario: div.grupoMuscularSecundario || null,
            diaSemana: div.diaSemana || null,
            itens: {
              create: div.itens.map((item) => ({
                exercicioId: item.exercicioId,
                series: item.series,
                repeticoes: item.repeticoes,
                carga: item.carga,
                descanso: item.descanso,
                observacoes: item.observacoes,
                ordem: item.ordem
              }))
            }
          }))
        }
      },
      include: {
        divisoes: {
          include: {
            itens: {
              include: {
                exercicio: true
              }
            }
          }
        }
      }
    })
    
    res.status(201).json({
      message: 'Prescrição de treino criada com sucesso',
      prescricao
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao criar prescrição:', error)
    res.status(500).json({ error: 'Erro ao criar prescrição de treino' })
  }
})

// PUT /api/prescricoes-treino/:id - Atualizar prescrição
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    const existingPrescricao = await prisma.prescricaoTreino.findUnique({
      where: { id }
    })
    
    if (!existingPrescricao) {
      return res.status(404).json({ error: 'Prescrição não encontrada' })
    }
    
    if (existingPrescricao.personalId !== userId && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    const validatedData = prescricaoTreinoSchema.parse(req.body)
    
    // Deletar divisões e itens antigos
    await prisma.prescricaoTreinoItem.deleteMany({
      where: {
        divisao: {
          prescricaoId: id
        }
      }
    })
    
    await prisma.prescricaoTreinoDivisao.deleteMany({
      where: { prescricaoId: id }
    })
    
    // Criar novas divisões e itens
    const prescricao = await prisma.prescricaoTreino.update({
      where: { id },
      data: {
        nome: validatedData.nome,
        observacoes: validatedData.observacoes,
        dataInicio: validatedData.dataInicio ? new Date(validatedData.dataInicio) : null,
        dataFim: validatedData.dataFim ? new Date(validatedData.dataFim) : null,
        ativo: validatedData.ativo ?? true,
        divisoes: {
          create: validatedData.divisoes.map(div => ({
            nome: div.nome,
            ordem: div.ordem,
            divisaoTreinoId: div.divisaoTreinoId || null,
            grupoMuscularPrincipal: div.grupoMuscularPrincipal || null,
            grupoMuscularSecundario: div.grupoMuscularSecundario || null,
            diaSemana: div.diaSemana || null,
            itens: {
              create: div.itens.map(item => ({
                exercicioId: item.exercicioId,
                series: item.series,
                repeticoes: item.repeticoes,
                carga: item.carga,
                descanso: item.descanso,
                observacoes: item.observacoes,
                ordem: item.ordem
              }))
            }
          }))
        }
      },
      include: {
        divisoes: {
          include: {
            itens: {
              include: {
                exercicio: true
              }
            }
          }
        }
      }
    })
    
    res.json({
      message: 'Prescrição atualizada com sucesso',
      prescricao
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao atualizar prescrição:', error)
    res.status(500).json({ error: 'Erro ao atualizar prescrição' })
  }
})

// DELETE /api/prescricoes-treino/:id - Deletar prescrição
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    const existingPrescricao = await prisma.prescricaoTreino.findUnique({
      where: { id }
    })
    
    if (!existingPrescricao) {
      return res.status(404).json({ error: 'Prescrição não encontrada' })
    }
    
    if (existingPrescricao.personalId !== userId && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    await prisma.prescricaoTreino.delete({
      where: { id }
    })
    
    res.json({ message: 'Prescrição deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar prescrição:', error)
    res.status(500).json({ error: 'Erro ao deletar prescrição' })
  }
})

export default router

