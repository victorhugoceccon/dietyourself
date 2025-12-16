import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { hasRole, hasAnyRole } from '../utils/roleUtils.js'
import { z } from 'zod'

const router = express.Router()

// Schema de validação para iniciar treino
const iniciarTreinoSchema = z.object({
  prescricaoId: z.string().min(1, 'ID da prescrição é obrigatório'),
  divisaoId: z.string().min(1, 'ID da divisão é obrigatório'),
  diaSemana: z.enum(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'])
})

// Schema de validação para feedback
const feedbackSchema = z.object({
  treinoExecutadoId: z.string().min(1, 'ID do treino executado é obrigatório'),
  observacao: z.string().optional().nullable(),
  intensidade: z.number().int().min(1).max(10).optional().nullable(),
  dificuldade: z.number().int().min(1).max(10).optional().nullable(),
  satisfacao: z.number().int().min(1).max(10).optional().nullable(),
  completouTreino: z.boolean().default(true),
  motivoIncompleto: z.string().optional().nullable()
})

// POST /api/treinos-executados/iniciar - Iniciar um treino
router.post('/iniciar', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    })
    
    if (!hasAnyRole(user, ['PACIENTE', 'ADMIN'])) {
      return res.status(403).json({ error: 'Apenas pacientes podem iniciar treinos' })
    }
    
    const validatedData = iniciarTreinoSchema.parse(req.body)
    
    // Verificar se a prescrição existe e pertence ao paciente
    const prescricao = await prisma.prescricaoTreino.findUnique({
      where: { id: validatedData.prescricaoId },
      include: {
        divisoes: {
          where: { id: validatedData.divisaoId }
        }
      }
    })
    
    if (!prescricao) {
      return res.status(404).json({ error: 'Prescrição não encontrada' })
    }
    
    if (prescricao.pacienteId !== userId && !hasRole(user, 'ADMIN')) {
      return res.status(403).json({ error: 'Esta prescrição não pertence a você' })
    }
    
    if (!prescricao.divisoes || prescricao.divisoes.length === 0) {
      return res.status(404).json({ error: 'Divisão não encontrada' })
    }
    
    // Verificar se já existe um treino iniciado hoje para esta divisão
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)
    
    const treinoExistente = await prisma.treinoExecutado.findFirst({
      where: {
        pacienteId: userId,
        prescricaoId: validatedData.prescricaoId,
        divisaoId: validatedData.divisaoId,
        dataExecucao: {
          gte: hoje,
          lt: amanha
        }
      }
    })
    
    if (treinoExistente) {
      return res.status(400).json({ error: 'Você já iniciou este treino hoje' })
    }
    
    // Criar treino executado
    const treinoExecutado = await prisma.treinoExecutado.create({
      data: {
        pacienteId: userId,
        prescricaoId: validatedData.prescricaoId,
        divisaoId: validatedData.divisaoId,
        diaSemana: validatedData.diaSemana,
        dataExecucao: new Date(),
        finalizado: false
      },
      include: {
        prescricao: {
          select: {
            id: true,
            nome: true
          }
        },
        divisao: {
          select: {
            id: true,
            nome: true,
            ordem: true
          }
        }
      }
    })
    
    res.status(201).json({
      message: 'Treino iniciado com sucesso',
      treinoExecutado
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao iniciar treino:', error)
    res.status(500).json({ error: 'Erro ao iniciar treino' })
  }
})

// POST /api/treinos-executados/finalizar - Finalizar um treino e criar feedback
router.post('/finalizar', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    })
    
    if (!hasAnyRole(user, ['PACIENTE', 'ADMIN'])) {
      return res.status(403).json({ error: 'Apenas pacientes podem finalizar treinos' })
    }
    
    const validatedData = feedbackSchema.parse(req.body)
    
    // Verificar se o treino executado existe e pertence ao paciente
    const treinoExecutado = await prisma.treinoExecutado.findUnique({
      where: { id: validatedData.treinoExecutadoId },
      include: {
        prescricao: true,
        divisao: true
      }
    })
    
    if (!treinoExecutado) {
      return res.status(404).json({ error: 'Treino executado não encontrado' })
    }
    
    if (treinoExecutado.pacienteId !== userId && !hasRole(user, 'ADMIN')) {
      return res.status(403).json({ error: 'Este treino não pertence a você' })
    }
    
    if (treinoExecutado.finalizado) {
      return res.status(400).json({ error: 'Este treino já foi finalizado' })
    }
    
    // Atualizar treino como finalizado e criar feedback
    const [treinoAtualizado, feedback] = await prisma.$transaction([
      prisma.treinoExecutado.update({
        where: { id: validatedData.treinoExecutadoId },
        data: { finalizado: true }
      }),
      prisma.feedbackTreino.create({
        data: {
          treinoExecutadoId: validatedData.treinoExecutadoId,
          observacao: validatedData.observacao,
          intensidade: validatedData.intensidade,
          dificuldade: validatedData.dificuldade,
          satisfacao: validatedData.satisfacao,
          completouTreino: validatedData.completouTreino,
          motivoIncompleto: validatedData.motivoIncompleto
        }
      })
    ])
    
    res.json({
      message: 'Treino finalizado com sucesso',
      treinoExecutado: treinoAtualizado,
      feedback
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao finalizar treino:', error)
    res.status(500).json({ error: 'Erro ao finalizar treino' })
  }
})

// GET /api/treinos-executados - Listar treinos executados do paciente
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { semana } = req.query // Formato: YYYY-WW (ano-semana)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    })
    
    let whereClause = {}
    
    if (hasRole(user, 'PACIENTE')) {
      whereClause.pacienteId = userId
    } else if (hasRole(user, 'PERSONAL')) {
      // Personal vê treinos executados de seus pacientes
      const pacientes = await prisma.user.findMany({
        where: { personalId: userId },
        select: { id: true }
      })
      whereClause.pacienteId = { in: pacientes.map(p => p.id) }
    } else if (!hasRole(user, 'ADMIN')) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    // Filtrar por semana se fornecido
    if (semana) {
      const [ano, semanaNum] = semana.split('-').map(Number)
      const inicioSemana = new Date(ano, 0, 1)
      const diasParaAdicionar = (semanaNum - 1) * 7
      inicioSemana.setDate(inicioSemana.getDate() + diasParaAdicionar)
      const fimSemana = new Date(inicioSemana)
      fimSemana.setDate(fimSemana.getDate() + 7)
      
      whereClause.dataExecucao = {
        gte: inicioSemana,
        lt: fimSemana
      }
    }
    
    const treinosExecutados = await prisma.treinoExecutado.findMany({
      where: whereClause,
      include: {
        prescricao: {
          select: {
            id: true,
            nome: true
          }
        },
        divisao: {
          select: {
            id: true,
            nome: true,
            ordem: true
          }
        },
        feedback: true,
        paciente: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { dataExecucao: 'desc' }
    })
    
    res.json({ treinosExecutados })
  } catch (error) {
    console.error('Erro ao listar treinos executados:', error)
    res.status(500).json({ error: 'Erro ao listar treinos executados' })
  }
})

// GET /api/treinos-executados/semana/:data - Listar treinos executados da semana
router.get('/semana/:data', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { data } = req.params // Formato: YYYY-MM-DD
    
    const dataRef = new Date(data)
    const diaSemana = dataRef.getDay() // 0 = Domingo, 1 = Segunda, etc.
    const inicioSemana = new Date(dataRef)
    inicioSemana.setDate(dataRef.getDate() - diaSemana + 1) // Segunda-feira
    inicioSemana.setHours(0, 0, 0, 0)
    const fimSemana = new Date(inicioSemana)
    fimSemana.setDate(inicioSemana.getDate() + 7)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    })
    
    let whereClause = {
      dataExecucao: {
        gte: inicioSemana,
        lt: fimSemana
      }
    }
    
    if (hasRole(user, 'PACIENTE')) {
      whereClause.pacienteId = userId
    } else if (hasRole(user, 'PERSONAL')) {
      const pacientes = await prisma.user.findMany({
        where: { personalId: userId },
        select: { id: true }
      })
      whereClause.pacienteId = { in: pacientes.map(p => p.id) }
    } else if (!hasRole(user, 'ADMIN')) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    const treinosExecutados = await prisma.treinoExecutado.findMany({
      where: whereClause,
      include: {
        prescricao: {
          select: {
            id: true,
            nome: true
          }
        },
        divisao: {
          select: {
            id: true,
            nome: true,
            ordem: true
          }
        },
        feedback: true
      },
      orderBy: { dataExecucao: 'asc' }
    })
    
    // Agrupar por dia da semana
    const treinosPorDia = {
      SEGUNDA: [],
      TERCA: [],
      QUARTA: [],
      QUINTA: [],
      SEXTA: [],
      SABADO: [],
      DOMINGO: []
    }
    
    treinosExecutados.forEach(treino => {
      if (treinosPorDia[treino.diaSemana]) {
        treinosPorDia[treino.diaSemana].push(treino)
      }
    })
    
    res.json({ treinosPorDia, inicioSemana, fimSemana })
  } catch (error) {
    console.error('Erro ao listar treinos da semana:', error)
    res.status(500).json({ error: 'Erro ao listar treinos da semana' })
  }
})

export default router

