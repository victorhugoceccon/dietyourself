import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { hasRole, hasAnyRole } from '../utils/roleUtils.js'
import { z } from 'zod'

const router = express.Router()

// Schema de validação para criar solicitação
const solicitacaoSchema = z.object({
  personalId: z.string().min(1, 'ID do personal é obrigatório'),
  prescricaoId: z.string().optional().nullable(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  mensagem: z.string().min(1, 'Mensagem é obrigatória')
})

// Schema de validação para responder solicitação
const respostaSchema = z.object({
  resposta: z.string().min(1, 'Resposta é obrigatória'),
  status: z.enum(['EM_ANALISE', 'RESOLVIDA', 'REJEITADA']).optional()
})

// POST /api/solicitacoes-mudanca - Criar solicitação de mudança
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    })
    
    if (!hasAnyRole(user, ['PACIENTE', 'ADMIN'])) {
      return res.status(403).json({ error: 'Apenas pacientes podem criar solicitações' })
    }
    
    const validatedData = solicitacaoSchema.parse(req.body)
    
    // Verificar se o personal existe
    const personal = await prisma.user.findUnique({
      where: { id: validatedData.personalId },
      select: { id: true, role: true }
    })
    
    if (!personal) {
      return res.status(404).json({ error: 'Personal trainer não encontrado' })
    }
    
    // Verificar se o paciente está vinculado a este personal
    const paciente = await prisma.user.findUnique({
      where: { id: userId },
      select: { personalId: true }
    })
    
    if (paciente?.personalId !== validatedData.personalId && !hasRole(user, 'ADMIN')) {
      return res.status(403).json({ error: 'Você não está vinculado a este personal trainer' })
    }
    
    // Verificar se a prescrição existe e pertence ao paciente (se fornecida)
    if (validatedData.prescricaoId) {
      const prescricao = await prisma.prescricaoTreino.findUnique({
        where: { id: validatedData.prescricaoId },
        select: { pacienteId: true, personalId: true }
      })
      
      if (!prescricao) {
        return res.status(404).json({ error: 'Prescrição não encontrada' })
      }
      
      if (prescricao.pacienteId !== userId && !hasRole(user, 'ADMIN')) {
        return res.status(403).json({ error: 'Esta prescrição não pertence a você' })
      }
      
      if (prescricao.personalId !== validatedData.personalId) {
        return res.status(400).json({ error: 'A prescrição não pertence a este personal trainer' })
      }
    }
    
    // Criar solicitação
    const solicitacao = await prisma.solicitacaoMudanca.create({
      data: {
        pacienteId: userId,
        personalId: validatedData.personalId,
        prescricaoId: validatedData.prescricaoId || null,
        titulo: validatedData.titulo,
        mensagem: validatedData.mensagem,
        status: 'PENDENTE'
      },
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
        prescricao: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })
    
    res.status(201).json({
      message: 'Solicitação criada com sucesso',
      solicitacao
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao criar solicitação:', error)
    console.error('Stack trace:', error.stack)
    res.status(500).json({ 
      error: 'Erro ao criar solicitação',
      message: error.message || 'Erro desconhecido'
    })
  }
})

// GET /api/solicitacoes-mudanca - Listar solicitações
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    })
    
    let whereClause = {}
    
    if (hasRole(user, 'PACIENTE')) {
      whereClause.pacienteId = userId
    } else if (hasRole(user, 'PERSONAL')) {
      whereClause.personalId = userId
    } else if (!hasRole(user, 'ADMIN')) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    const solicitacoes = await prisma.solicitacaoMudanca.findMany({
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
        prescricao: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json({ solicitacoes })
  } catch (error) {
    console.error('Erro ao listar solicitações:', error)
    res.status(500).json({ error: 'Erro ao listar solicitações' })
  }
})

// PUT /api/solicitacoes-mudanca/:id/responder - Responder solicitação
router.put('/:id/responder', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    })
    
    if (!hasAnyRole(user, ['PERSONAL', 'ADMIN'])) {
      return res.status(403).json({ error: 'Apenas personal trainers podem responder solicitações' })
    }
    
    const validatedData = respostaSchema.parse(req.body)
    
    // Verificar se a solicitação existe
    const solicitacao = await prisma.solicitacaoMudanca.findUnique({
      where: { id }
    })
    
    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada' })
    }
    
    // Verificar se o personal tem acesso a esta solicitação
    if (solicitacao.personalId !== userId && !hasRole(user, 'ADMIN')) {
      return res.status(403).json({ error: 'Esta solicitação não pertence a você' })
    }
    
    // Atualizar solicitação
    const solicitacaoAtualizada = await prisma.solicitacaoMudanca.update({
      where: { id },
      data: {
        resposta: validatedData.resposta,
        status: validatedData.status || solicitacao.status
      },
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
        prescricao: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })
    
    res.json({
      message: 'Solicitação respondida com sucesso',
      solicitacao: solicitacaoAtualizada
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao responder solicitação:', error)
    res.status(500).json({ error: 'Erro ao responder solicitação' })
  }
})

export default router

