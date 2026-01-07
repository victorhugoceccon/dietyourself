import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { hasRole, hasAnyRole } from '../utils/roleUtils.js'
import { z } from 'zod'
import { upsertWorkoutPointsEvent } from '../utils/groupPoints.js'

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
}).passthrough() // Permitir campos extras sem erro

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
    
    // Permitir iniciar treino mesmo se já foi executado, pois pode fazer mais de 1x na semana
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
    
    // Verificar se já finalizou algum treino hoje (limite de 1 treino por dia)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)
    
    const treinoFinalizadoHoje = await prisma.treinoExecutado.findFirst({
      where: {
        pacienteId: userId,
        finalizado: true,
        updatedAt: {
          gte: hoje,
          lt: amanha
        }
      }
    })
    
    if (treinoFinalizadoHoje) {
      return res.status(400).json({ 
        error: 'Você já finalizou um treino hoje',
        message: 'Limite de 1 treino por dia atingido. Tente novamente amanhã.'
      })
    }
    
    // Calcular duração do treino (do momento que iniciou até agora)
    const dataInicio = new Date(treinoExecutado.dataExecucao)
    const dataFim = new Date()
    const duracaoMinutos = Math.max(1, Math.round((dataFim - dataInicio) / 1000 / 60))
    
    // Verificar se já existe feedback para este treino
    const feedbackExistente = await prisma.feedbackTreino.findUnique({
      where: { treinoExecutadoId: validatedData.treinoExecutadoId }
    })
    
    // Preparar dados do feedback (garantir que valores opcionais sejam null se não fornecidos)
    const feedbackData = {
      treinoExecutadoId: validatedData.treinoExecutadoId,
      observacao: validatedData.observacao && validatedData.observacao.trim() !== '' ? validatedData.observacao.trim() : null,
      intensidade: validatedData.intensidade != null ? validatedData.intensidade : null,
      dificuldade: validatedData.dificuldade != null ? validatedData.dificuldade : null,
      satisfacao: validatedData.satisfacao != null ? validatedData.satisfacao : null,
      completouTreino: validatedData.completouTreino !== undefined ? validatedData.completouTreino : true,
      motivoIncompleto: validatedData.motivoIncompleto && validatedData.motivoIncompleto.trim() !== '' ? validatedData.motivoIncompleto.trim() : null
    }
    
    console.log('Dados do feedback preparados:', feedbackData)
    console.log('Duração calculada:', duracaoMinutos, 'minutos')
    
    // Atualizar treino como finalizado usando SQL raw para incluir duracaoMinutos
    // (o Prisma Client pode não ter o campo ainda se não foi regenerado)
    await prisma.$executeRaw`UPDATE treinos_executados SET finalizado = true, "duracaoMinutos" = ${duracaoMinutos}, "updatedAt" = NOW() WHERE id = ${validatedData.treinoExecutadoId}`
    
    // Criar ou atualizar feedback
    const feedback = feedbackExistente 
      ? await prisma.feedbackTreino.update({
          where: { treinoExecutadoId: validatedData.treinoExecutadoId },
          data: feedbackData
        })
      : await prisma.feedbackTreino.create({
          data: feedbackData
        })
    
    // Buscar o treino atualizado
    const treinoAtualizado = await prisma.treinoExecutado.findUnique({
      where: { id: validatedData.treinoExecutadoId }
    })

    // Gamificação: registrar pontos para todos os grupos do usuário
    try {
      await upsertWorkoutPointsEvent({
        userId,
        treinoExecutadoId: validatedData.treinoExecutadoId,
        completouTreino: feedback.completouTreino
      })
    } catch (pointsError) {
      console.warn('⚠️ Erro ao registrar pontos de treino (ignorado):', pointsError?.message || pointsError)
    }
    
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
    console.error('Stack trace:', error.stack)
    console.error('Request body:', req.body)
    res.status(500).json({ 
      error: 'Erro ao finalizar treino',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
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
// IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflitos
router.get('/semana/:data', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { data } = req.params // Formato: YYYY-MM-DD
    
    const dataRef = new Date(data)
    const diaSemana = dataRef.getDay() // 0 = Domingo, 1 = Segunda, etc.
    const inicioSemana = new Date(dataRef)
    // Calcular início da semana (segunda-feira)
    // Se for domingo (0), voltar 6 dias; caso contrário, voltar (diaSemana - 1) dias
    const diasParaVoltar = diaSemana === 0 ? 6 : diaSemana - 1
    inicioSemana.setDate(dataRef.getDate() - diasParaVoltar)
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
      select: {
        id: true,
        pacienteId: true,
        prescricaoId: true,
        divisaoId: true,
        dataExecucao: true,
        diaSemana: true,
        finalizado: true,
        createdAt: true,
        updatedAt: true,
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
    
    // Buscar duracaoMinutos via SQL raw para cada treino
    const treinoIds = treinosExecutados.map(t => t.id)
    let duracoesMap = {}
    if (treinoIds.length > 0) {
      try {
        const duracoes = await prisma.$queryRawUnsafe(`SELECT id, "duracaoMinutos" FROM treinos_executados WHERE id IN (${treinoIds.map(id => `'${id}'`).join(',')})`)
        duracoes.forEach(d => {
          if (d.duracaoMinutos) {
            duracoesMap[d.id] = d.duracaoMinutos
          }
        })
      } catch (e) {
        console.log('Campo duracaoMinutos não disponível:', e.message)
      }
    }
    
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
      // Adicionar duracaoMinutos se disponível
      if (duracoesMap[treino.id]) {
        treino.duracaoMinutos = duracoesMap[treino.id]
      }
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

// GET /api/treinos-executados/:id - Buscar treino executado específico
// IMPORTANTE: Esta rota deve vir DEPOIS de rotas mais específicas como /semana/:data
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    })
    
    const treinoExecutado = await prisma.treinoExecutado.findUnique({
      where: { id },
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
            ordem: true,
            itens: {
              select: {
                id: true,
                exercicio: {
                  select: {
                    id: true,
                    nome: true,
                    categoria: true
                  }
                },
                series: true,
                repeticoes: true,
                ordem: true
              },
              orderBy: { ordem: 'asc' }
            }
          }
        },
        feedback: true
      }
    })
    
    if (!treinoExecutado) {
      return res.status(404).json({ error: 'Treino não encontrado' })
    }
    
    // Verificar permissão
    if (hasRole(user, 'PACIENTE') && treinoExecutado.pacienteId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    if (hasRole(user, 'PERSONAL')) {
      const pacientes = await prisma.user.findMany({
        where: { personalId: userId },
        select: { id: true }
      })
      if (!pacientes.some(p => p.id === treinoExecutado.pacienteId) && !hasRole(user, 'ADMIN')) {
        return res.status(403).json({ error: 'Acesso negado' })
      }
    }
    
    // Buscar duracaoMinutos via SQL raw (caso o Prisma Client não tenha o campo ainda)
    try {
      const duracaoResult = await prisma.$queryRaw`SELECT "duracaoMinutos" FROM treinos_executados WHERE id = ${id}`
      if (duracaoResult && duracaoResult[0] && duracaoResult[0].duracaoMinutos) {
        treinoExecutado.duracaoMinutos = duracaoResult[0].duracaoMinutos
      }
    } catch (e) {
      console.log('Campo duracaoMinutos não disponível ainda:', e.message)
    }
    
    res.json({ treinoExecutado })
  } catch (error) {
    console.error('Erro ao buscar treino executado:', error)
    res.status(500).json({ error: 'Erro ao buscar treino executado' })
  }
})

export default router

