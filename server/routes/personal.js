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

// GET /api/personal/pacientes/:pacienteId/dieta - Obter dieta de um paciente específico
router.get('/pacientes/:pacienteId/dieta', authenticate, async (req, res) => {
  try {
    const personalId = req.user.userId
    const { pacienteId } = req.params
    const role = req.user.role?.toUpperCase()

    console.log('🔍 Personal buscando dieta do paciente:', pacienteId)
    console.log('   - Personal ID:', personalId)
    console.log('   - Role:', role)

    // Verificar se é personal trainer
    if (role !== 'PERSONAL' && role !== 'ADMIN') {
      console.error('❌ Acesso negado - Role:', role)
      return res.status(403).json({ error: 'Acesso negado.' })
    }

    // Verificar se o paciente pertence ao personal
    const paciente = await prisma.user.findFirst({
      where: {
        id: pacienteId,
        personalId: personalId
      }
    })

    console.log('   - Paciente encontrado?', !!paciente)
    if (paciente) {
      console.log('   - Paciente personalId:', paciente.personalId)
    }

    if (!paciente) {
      console.error('❌ Paciente não encontrado ou não vinculado')
      return res.status(404).json({ error: 'Paciente não encontrado ou não está vinculado a você' })
    }

    // Buscar dieta
    const dieta = await prisma.dieta.findUnique({
      where: { userId: pacienteId }
    })

    console.log('   - Dieta encontrada?', !!dieta)

    if (!dieta) {
      console.log('⚠️  Nenhuma dieta encontrada para o paciente')
      return res.json({ dieta: null, paciente })
    }

    // Parse do JSON
    let dietaData
    try {
      dietaData = JSON.parse(dieta.dietaData)
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao processar dieta salva' })
    }

    // Extrair dieta e nutritionalNeeds do objeto salvo
    // O formato salvo é: { nutritionalNeeds: {...}, dieta: {...} }
    let dietaFinal = dietaData.dieta || dietaData
    let nutritionalNeeds = dietaData.nutritionalNeeds || null

    // Garantir que totalDiaKcal e macrosDia existam, calculando se necessário
    if (!dietaFinal.totalDiaKcal && dietaFinal.refeicoes) {
      dietaFinal.totalDiaKcal = dietaFinal.refeicoes.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0)
    }

    if (!dietaFinal.macrosDia && dietaFinal.refeicoes) {
      let totalProteina = 0
      let totalCarbo = 0
      let totalGordura = 0

      dietaFinal.refeicoes.forEach(refeicao => {
        if (refeicao.itens) {
          refeicao.itens.forEach(item => {
            if (item.macros) {
              totalProteina += item.macros.proteina_g || 0
              totalCarbo += item.macros.carbo_g || 0
              totalGordura += item.macros.gordura_g || 0
            }
          })
        }
      })

      dietaFinal.macrosDia = {
        proteina_g: Math.round(totalProteina * 10) / 10,
        carbo_g: Math.round(totalCarbo * 10) / 10,
        gordura_g: Math.round(totalGordura * 10) / 10
      }
    }

    // Buscar dados completos do paciente incluindo questionnaireData completo
    const pacienteCompleto = await prisma.user.findUnique({
      where: { id: pacienteId },
      select: {
        id: true,
        email: true,
        name: true,
        questionnaireData: {
          select: {
            idade: true,
            sexo: true,
            altura: true,
            pesoAtual: true,
            objetivo: true,
            frequenciaAtividade: true,
            quantidadeRefeicoes: true,
            alimentosDoDiaADia: true,
            restricaoAlimentar: true,
            outraRestricao: true,
            alimentosEvita: true,
            opcoesSubstituicao: true,
            refeicoesLivres: true
          }
        }
      }
    })

    // Parse alimentosDoDiaADia se for string JSON
    if (pacienteCompleto?.questionnaireData?.alimentosDoDiaADia) {
      try {
        if (typeof pacienteCompleto.questionnaireData.alimentosDoDiaADia === 'string') {
          pacienteCompleto.questionnaireData.alimentosDoDiaADia = JSON.parse(pacienteCompleto.questionnaireData.alimentosDoDiaADia)
        }
      } catch (e) {
        console.error('Erro ao fazer parse dos alimentos do dia a dia:', e)
      }
    }

    // Calcular necessidades nutricionais do paciente se não vierem na dieta
    if (!nutritionalNeeds && pacienteCompleto?.questionnaireData) {
      const { calcularNutricao } = await import('../utils/nutrition.js')
      nutritionalNeeds = calcularNutricao(pacienteCompleto.questionnaireData)
    }

    console.log('✅ Dieta encontrada para paciente:', pacienteId)
    console.log('   - dietaFinal existe?', !!dietaFinal)
    console.log('   - dietaFinal.refeicoes?', !!dietaFinal?.refeicoes)
    console.log('   - nutritionalNeeds existe?', !!nutritionalNeeds)
    
    res.json({
      dieta: dietaFinal,
      paciente: pacienteCompleto,
      nutritionalNeeds: nutritionalNeeds
    })
  } catch (error) {
    console.error('❌ Erro ao buscar dieta do paciente:', error)
    console.error('   Stack:', error.stack)
    console.error('   Message:', error.message)
    res.status(500).json({ error: 'Erro ao buscar dieta do paciente', details: error.message })
  }
})

export default router


