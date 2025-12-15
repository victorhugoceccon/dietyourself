import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { z } from 'zod'
import { ensureDefaultExercicios } from '../utils/personalDefaults.js'

const router = express.Router()

// Schema de validação para exercício
const exercicioSchema = z.object({
  nome: z.string().min(1, 'Nome do exercício é obrigatório'),
  descricao: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable()
})

// GET /api/exercicios - Listar exercícios do personal
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas personal trainers podem gerenciar exercícios.' })
    }

    // Para PERSONAL, garantir que o pacote padrão de exercícios exista
    if (user?.role === 'PERSONAL') {
      try {
        await ensureDefaultExercicios(userId)
      } catch (seedError) {
        console.error('Erro ao criar exercícios padrão para personal:', seedError)
      }
    }
    
    const exercicios = await prisma.exercicio.findMany({
      where: { personalId: userId },
      orderBy: { nome: 'asc' }
    })
    
    res.json({ exercicios })
  } catch (error) {
    console.error('Erro ao listar exercícios:', error)
    res.status(500).json({ error: 'Erro ao listar exercícios' })
  }
})

// GET /api/exercicios/:id - Buscar exercício específico
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    const exercicio = await prisma.exercicio.findUnique({
      where: { id }
    })
    
    if (!exercicio) {
      return res.status(404).json({ error: 'Exercício não encontrado' })
    }
    
    // Verificar se o exercício pertence ao personal
    if (exercicio.personalId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Este exercício não pertence a você.' })
      }
    }
    
    res.json({ exercicio })
  } catch (error) {
    console.error('Erro ao buscar exercício:', error)
    res.status(500).json({ error: 'Erro ao buscar exercício' })
  }
})

// POST /api/exercicios - Criar novo exercício
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas personal trainers podem criar exercícios.' })
    }
    
    const validatedData = exercicioSchema.parse(req.body)
    
    const exercicio = await prisma.exercicio.create({
      data: {
        ...validatedData,
        personalId: userId
      }
    })
    
    res.status(201).json({
      message: 'Exercício criado com sucesso',
      exercicio
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao criar exercício:', error)
    res.status(500).json({ error: 'Erro ao criar exercício' })
  }
})

// PUT /api/exercicios/:id - Atualizar exercício
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    // Verificar se o exercício existe e pertence ao personal
    const existingExercicio = await prisma.exercicio.findUnique({
      where: { id }
    })
    
    if (!existingExercicio) {
      return res.status(404).json({ error: 'Exercício não encontrado' })
    }
    
    if (existingExercicio.personalId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Este exercício não pertence a você.' })
      }
    }
    
    const validatedData = exercicioSchema.parse(req.body)
    
    const exercicio = await prisma.exercicio.update({
      where: { id },
      data: validatedData
    })
    
    res.json({
      message: 'Exercício atualizado com sucesso',
      exercicio
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao atualizar exercício:', error)
    res.status(500).json({ error: 'Erro ao atualizar exercício' })
  }
})

// DELETE /api/exercicios/:id - Deletar exercício
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    // Verificar se o exercício existe e pertence ao personal
    const existingExercicio = await prisma.exercicio.findUnique({
      where: { id }
    })
    
    if (!existingExercicio) {
      return res.status(404).json({ error: 'Exercício não encontrado' })
    }
    
    if (existingExercicio.personalId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Este exercício não pertence a você.' })
      }
    }
    
    // Verificar se o exercício está sendo usado em alguma prescrição
    const prescricoesUsando = await prisma.prescricaoTreinoItem.findFirst({
      where: { exercicioId: id }
    })
    
    if (prescricoesUsando) {
      return res.status(400).json({
        error: 'Não é possível deletar este exercício. Ele está sendo usado em prescrições de treino.'
      })
    }
    
    await prisma.exercicio.delete({
      where: { id }
    })
    
    res.json({ message: 'Exercício deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar exercício:', error)
    res.status(500).json({ error: 'Erro ao deletar exercício' })
  }
})

export default router

