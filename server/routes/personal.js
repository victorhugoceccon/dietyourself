import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

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

