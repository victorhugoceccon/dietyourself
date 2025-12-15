import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { z } from 'zod'
import { ensureDefaultDivisoes } from '../utils/personalDefaults.js'

const router = express.Router()

// Schema de validação para divisão de treino
const divisaoTreinoItemSchema = z.object({
  exercicioId: z.string().min(1, 'Exercício é obrigatório'),
  series: z.number().int().min(1).default(3),
  repeticoes: z.string().optional().nullable(),
  carga: z.string().optional().nullable(),
  descanso: z.string().optional().nullable(),
  ordem: z.number().int().min(1).optional()
})

const divisaoTreinoSchema = z.object({
  nome: z.string().min(1, 'Nome da divisão é obrigatório'),
  descricao: z.string().optional().nullable(),
  diasSemana: z.string().optional().nullable(), // JSON array como string
  itens: z.array(divisaoTreinoItemSchema).optional().default([])
})

// GET /api/divisoes-treino - Listar divisões do personal
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas personal trainers podem gerenciar divisões de treino.' })
    }

    // Para PERSONAL, garantir que as divisões padrão existam
    if (user?.role === 'PERSONAL') {
      try {
        await ensureDefaultDivisoes(userId)
      } catch (seedError) {
        console.error('Erro ao criar divisões padrão para personal:', seedError)
      }
    }
    
    const divisoes = await prisma.divisaoTreino.findMany({
      where: { personalId: userId },
      include: {
        itens: {
          include: {
            exercicio: {
              select: {
                id: true,
                nome: true,
                categoria: true
              }
            }
          },
          orderBy: { ordem: 'asc' }
        }
      },
      orderBy: { nome: 'asc' }
    })
    
    res.json({ divisoes })
  } catch (error) {
    console.error('Erro ao listar divisões de treino:', error)
    res.status(500).json({ error: 'Erro ao listar divisões de treino' })
  }
})

// GET /api/divisoes-treino/:id - Buscar divisão específica
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    const divisao = await prisma.divisaoTreino.findUnique({
      where: { id }
    })
    
    if (!divisao) {
      return res.status(404).json({ error: 'Divisão de treino não encontrada' })
    }
    
    // Verificar se a divisão pertence ao personal
    if (divisao.personalId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Esta divisão não pertence a você.' })
      }
    }
    
    res.json({ divisao })
  } catch (error) {
    console.error('Erro ao buscar divisão de treino:', error)
    res.status(500).json({ error: 'Erro ao buscar divisão de treino' })
  }
})

// POST /api/divisoes-treino - Criar nova divisão
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas personal trainers podem criar divisões de treino.' })
    }
    
    const validatedData = divisaoTreinoSchema.parse(req.body)

    const { itens, ...divisaoData } = validatedData

    const divisao = await prisma.divisaoTreino.create({
      data: {
        ...divisaoData,
        personalId: userId,
        itens: itens && itens.length
          ? {
              createMany: {
                data: itens.map((item, index) => ({
                  exercicioId: item.exercicioId,
                  series: item.series,
                  repeticoes: item.repeticoes,
                  carga: item.carga,
                  descanso: item.descanso,
                  ordem: item.ordem || index + 1
                }))
              }
            }
          : undefined
      },
      include: {
        itens: {
          include: {
            exercicio: {
              select: {
                id: true,
                nome: true,
                categoria: true
              }
            }
          },
          orderBy: { ordem: 'asc' }
        }
      }
    })
    
    res.status(201).json({
      message: 'Divisão de treino criada com sucesso',
      divisao
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao criar divisão de treino:', error)
    res.status(500).json({ error: 'Erro ao criar divisão de treino' })
  }
})

// PUT /api/divisoes-treino/:id - Atualizar divisão
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    // Verificar se a divisão existe e pertence ao personal
    const existingDivisao = await prisma.divisaoTreino.findUnique({
      where: { id }
    })
    
    if (!existingDivisao) {
      return res.status(404).json({ error: 'Divisão de treino não encontrada' })
    }
    
    if (existingDivisao.personalId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Esta divisão não pertence a você.' })
      }
    }
    
    const validatedData = divisaoTreinoSchema.parse(req.body)

    const { itens, ...divisaoData } = validatedData

    const divisao = await prisma.$transaction(async (tx) => {
      // Atualiza dados básicos da divisão
      const updated = await tx.divisaoTreino.update({
        where: { id },
        data: divisaoData
      })

      // Se itens foram enviados, recria o conjunto de exercícios modelo
      if (Array.isArray(itens)) {
        // Remove itens antigos
        await tx.divisaoTreinoItem.deleteMany({
          where: { divisaoTreinoId: id }
        })

        if (itens.length > 0) {
          await tx.divisaoTreinoItem.createMany({
            data: itens.map((item, index) => ({
              divisaoTreinoId: id,
              exercicioId: item.exercicioId,
              series: item.series,
              repeticoes: item.repeticoes,
              carga: item.carga,
              descanso: item.descanso,
              ordem: item.ordem || index + 1
            }))
          })
        }
      }

      // Retorna a divisão com itens atualizados
      return tx.divisaoTreino.findUnique({
        where: { id },
        include: {
          itens: {
            include: {
              exercicio: {
                select: {
                  id: true,
                  nome: true,
                  categoria: true
                }
              }
            },
            orderBy: { ordem: 'asc' }
          }
        }
      })
    })
    
    res.json({
      message: 'Divisão de treino atualizada com sucesso',
      divisao
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao atualizar divisão de treino:', error)
    res.status(500).json({ error: 'Erro ao atualizar divisão de treino' })
  }
})

// DELETE /api/divisoes-treino/:id - Deletar divisão
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    // Verificar se a divisão existe e pertence ao personal
    const existingDivisao = await prisma.divisaoTreino.findUnique({
      where: { id }
    })
    
    if (!existingDivisao) {
      return res.status(404).json({ error: 'Divisão de treino não encontrada' })
    }
    
    if (existingDivisao.personalId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Esta divisão não pertence a você.' })
      }
    }
    
    // Verificar se a divisão está sendo usada em alguma prescrição
    const prescricoesUsando = await prisma.prescricaoTreinoDivisao.findFirst({
      where: { divisaoTreinoId: id }
    })
    
    if (prescricoesUsando) {
      return res.status(400).json({
        error: 'Não é possível deletar esta divisão. Ela está sendo usada em prescrições de treino.'
      })
    }
    
    await prisma.divisaoTreino.delete({
      where: { id }
    })
    
    res.json({ message: 'Divisão de treino deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar divisão de treino:', error)
    res.status(500).json({ error: 'Erro ao deletar divisão de treino' })
  }
})

export default router

