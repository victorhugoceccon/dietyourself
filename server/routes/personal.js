import express from 'express'
import { z } from 'zod'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { hashPassword } from '../utils/hash.js'

const router = express.Router()

// Schema para criar paciente
const createPacienteSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  name: z.string().optional()
})

// GET /api/personal/pacientes - Listar pacientes do personal
router.get('/pacientes', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas personal trainers podem ver seus pacientes.' })
    }
    
    const pacientes = await prisma.user.findMany({
      where: {
        personalId: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        questionnaireData: {
          select: {
            idade: true,
            sexo: true,
            altura: true,
            pesoAtual: true,
            objetivo: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    res.json({ pacientes })
  } catch (error) {
    console.error('Erro ao listar pacientes do personal:', error)
    res.status(500).json({ error: 'Erro ao listar pacientes' })
  }
})

// POST /api/personal/pacientes - Vincular paciente ao personal
router.post('/pacientes', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { pacienteId } = req.body
    
    if (!pacienteId) {
      return res.status(400).json({ error: 'ID do paciente é obrigatório' })
    }
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    // Verificar se o paciente existe
    const paciente = await prisma.user.findUnique({
      where: { id: pacienteId }
    })
    
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' })
    }
    
    if (paciente.role !== 'PACIENTE') {
      return res.status(400).json({ error: 'Usuário não é um paciente' })
    }
    
    // Vincular paciente ao personal
    const updatedPaciente = await prisma.user.update({
      where: { id: pacienteId },
      data: { personalId: userId }
    })
    
    res.json({
      message: 'Paciente vinculado com sucesso',
      paciente: {
        id: updatedPaciente.id,
        name: updatedPaciente.name,
        email: updatedPaciente.email
      }
    })
  } catch (error) {
    console.error('Erro ao vincular paciente:', error)
    res.status(500).json({ error: 'Erro ao vincular paciente' })
  }
})

// POST /api/personal/pacientes/create - Criar novo paciente vinculado ao personal
router.post('/pacientes/create', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const role = req.user.role?.toUpperCase()

    // Verificar se é personal trainer
    if (role !== 'PERSONAL' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas personal trainers podem criar pacientes.' })
    }

    const validatedData = createPacienteSchema.parse(req.body)

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' })
    }

    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.password)

    // Criar paciente vinculado ao personal
    const paciente = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: 'PACIENTE',
        personalId: userId
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
      message: 'Paciente criado e vinculado com sucesso',
      paciente
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors })
    }
    console.error('Erro ao criar paciente:', error)
    res.status(500).json({ error: 'Erro ao criar paciente' })
  }
})

// DELETE /api/personal/pacientes/:pacienteId - Desvincular paciente
router.delete('/pacientes/:pacienteId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { pacienteId } = req.params
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    // Verificar se o paciente pertence a este personal
    const paciente = await prisma.user.findUnique({
      where: { id: pacienteId }
    })
    
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' })
    }
    
    if (paciente.personalId !== userId && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Este paciente não está vinculado a você' })
    }
    
    // Desvincular
    await prisma.user.update({
      where: { id: pacienteId },
      data: { personalId: null }
    })
    
    res.json({ message: 'Paciente desvinculado com sucesso' })
  } catch (error) {
    console.error('Erro ao desvincular paciente:', error)
    res.status(500).json({ error: 'Erro ao desvincular paciente' })
  }
})

export default router


