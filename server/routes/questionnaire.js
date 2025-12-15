import express from 'express'
import { z } from 'zod'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para o questionário
const questionnaireSchema = z.object({
  // Etapa 1
  idade: z.number().int().min(1).max(150),
  sexo: z.enum(['Masculino', 'Feminino']),
  altura: z.number().positive().max(300),
  pesoAtual: z.number().positive().max(500),
  
  // Etapa 2
  objetivo: z.enum(['Emagrecer', 'Manter peso', 'Ganhar massa muscular']),
  nivelAtividade: z.enum([
    'Sedentário (não treino)',
    'Levemente ativo (1–2x por semana)',
    'Moderadamente ativo (3–4x por semana)',
    'Muito ativo (5x ou mais por semana)'
  ]),
  refeicoesDia: z.union([
    z.string().regex(/^[3-6]$/).transform(val => parseInt(val)),
    z.number().int().min(3).max(6)
  ]),
  
  // Etapa 3
  restricoes: z.array(z.string()).optional().default([]),
  alimentosNaoGosta: z.string().optional().default(''),
  preferenciaAlimentacao: z.enum([
    'Simples e rápida',
    'Caseira tradicional',
    'Mais fitness',
    'Tanto faz'
  ]),
  
  // Etapa 4
  costumaCozinhar: z.enum([
    'Sim, quase sempre',
    'Às vezes',
    'Quase nunca'
  ]),
  observacoes: z.string().optional().default('')
})

// Rota para verificar se o questionário foi preenchido
router.get('/check', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId }
    })

    // Parse das restrições se existirem
    if (questionnaireData && questionnaireData.restricoes) {
      try {
        questionnaireData.restricoes = JSON.parse(questionnaireData.restricoes)
      } catch (e) {
        // Se não for JSON válido, manter como está
        console.error('Erro ao fazer parse das restrições:', e)
      }
    }

    res.json({ 
      hasCompleted: !!questionnaireData,
      data: questionnaireData 
    })
  } catch (error) {
    console.error('Erro ao verificar questionário:', error)
    res.status(500).json({ error: 'Erro ao verificar questionário' })
  }
})

// Rota para salvar/atualizar o questionário
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    console.log('Recebendo dados do questionário para userId:', userId)
    console.log('Body recebido:', JSON.stringify(req.body, null, 2))
    
    const validatedData = questionnaireSchema.parse(req.body)
    console.log('Dados validados:', JSON.stringify(validatedData, null, 2))

    // Converter restrições para JSON string
    const restricoesJson = JSON.stringify(validatedData.restricoes || [])
    console.log('Restrições convertidas:', restricoesJson)

    // Verificar se já existe questionário
    console.log('Verificando se já existe questionário...')
    const existing = await prisma.questionnaireData.findUnique({
      where: { userId }
    })
    console.log('Questionário existente:', existing ? 'Sim' : 'Não')

    console.log('Salvando dados no banco...')
    const questionnaireData = existing
      ? await prisma.questionnaireData.update({
          where: { userId },
          data: {
            idade: validatedData.idade,
            sexo: validatedData.sexo,
            altura: validatedData.altura,
            pesoAtual: validatedData.pesoAtual,
            objetivo: validatedData.objetivo,
            nivelAtividade: validatedData.nivelAtividade,
            refeicoesDia: validatedData.refeicoesDia,
            restricoes: restricoesJson,
            alimentosNaoGosta: validatedData.alimentosNaoGosta,
            preferenciaAlimentacao: validatedData.preferenciaAlimentacao,
            costumaCozinhar: validatedData.costumaCozinhar,
            observacoes: validatedData.observacoes
          }
        })
      : await prisma.questionnaireData.create({
          data: {
            userId,
            idade: validatedData.idade,
            sexo: validatedData.sexo,
            altura: validatedData.altura,
            pesoAtual: validatedData.pesoAtual,
            objetivo: validatedData.objetivo,
            nivelAtividade: validatedData.nivelAtividade,
            refeicoesDia: validatedData.refeicoesDia,
            restricoes: restricoesJson,
            alimentosNaoGosta: validatedData.alimentosNaoGosta,
            preferenciaAlimentacao: validatedData.preferenciaAlimentacao,
            costumaCozinhar: validatedData.costumaCozinhar,
            observacoes: validatedData.observacoes
          }
        })

    res.json({
      message: 'Questionário salvo com sucesso!',
      data: questionnaireData
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Erro de validação:', error.errors)
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(err => ({
          path: err.path,
          message: err.message,
          code: err.code
        }))
      })
    }

    console.error('Erro ao salvar questionário:', error)
    console.error('Stack trace:', error.stack)
    res.status(500).json({ 
      error: 'Erro ao salvar questionário', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

export default router

