import express from 'express'
import { z } from 'zod'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para o novo questionário (7 blocos)
const questionnaireSchema = z.object({
  // Bloco 1: Dados Básicos
  idade: z.number().int().min(1).max(150),
  sexo: z.enum(['Masculino', 'Feminino']),
  altura: z.number().positive().min(50).max(250),
  pesoAtual: z.number().positive().min(20).max(300),
  objetivo: z.enum([
    'Emagrecer',
    'Manter o peso',
    'Ganhar massa muscular',
    'Ganhar peso de forma geral'
  ]),
  
  // Bloco 2: Rotina e Atividade
  frequenciaAtividade: z.enum([
    'Não pratico',
    'Sim, 1–2x por semana',
    'Sim, 3–4x por semana',
    'Sim, 5x ou mais por semana'
  ]),
  tipoAtividade: z.enum([
    'Musculação',
    'Cardio (caminhada, corrida, bike)',
    'Ambos',
    'Outro'
  ]),
  horarioTreino: z.enum(['Manhã', 'Tarde', 'Noite', 'Varia muito']),
  rotinaDiaria: z.enum([
    'Sedentária (trabalho sentado, pouco movimento)',
    'Moderada (anda bastante, se movimenta no dia)',
    'Ativa (trabalho físico ou muito movimento)'
  ]),
  
  // Bloco 3: Estrutura da Dieta
  quantidadeRefeicoes: z.enum([
    '3 refeições',
    '4 refeições',
    '5 refeições',
    'Mais de 5'
  ]),
  preferenciaRefeicoes: z.enum([
    'Mais simples, com poucos alimentos',
    'Um equilíbrio entre simples e variadas',
    'Mais completas e variadas'
  ]),
  
  // Bloco 4: Complexidade e Adesão
  confortoPesar: z.enum([
    'Sim, sem problemas',
    'Às vezes',
    'Prefiro medidas caseiras'
  ]),
  tempoPreparacao: z.enum([
    'Muito pouco (até 10 min)',
    'Médio (10–30 min)',
    'Tenho tempo e gosto de cozinhar'
  ]),
  preferenciaVariacao: z.enum([
    'Prefiro repetir',
    'Um pouco de repetição é ok',
    'Prefiro variedade'
  ]),
  
  // Bloco 5: Alimentos do Dia a Dia (opcional)
  alimentosDoDiaADia: z.object({
    carboidratos: z.array(z.string()).optional().default([]),
    proteinas: z.array(z.string()).optional().default([]),
    gorduras: z.array(z.string()).optional().default([]),
    frutas: z.array(z.string()).optional().default([])
  }).optional().default({
    carboidratos: [],
    proteinas: [],
    gorduras: [],
    frutas: []
  }),
  
  // Bloco 6: Restrições
  restricaoAlimentar: z.enum([
    'Nenhuma',
    'Intolerância à lactose',
    'Glúten',
    'Outra'
  ]),
  outraRestricao: z.string().optional().default(''),
  alimentosEvita: z.string().optional().default(''),
  
  // Bloco 7: Flexibilidade Real
  opcoesSubstituicao: z.enum([
    'Sim, gosto de ter opções',
    'Algumas opções já são suficientes',
    'Prefiro algo mais fixo'
  ]),
  refeicoesLivres: z.enum(['Sim', 'Talvez', 'Não'])
})

// Rota para verificar se o questionário foi preenchido
router.get('/check', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId }
    })

    // Parse do JSON de alimentos se existir
    if (questionnaireData && questionnaireData.alimentosDoDiaADia) {
      try {
        questionnaireData.alimentosDoDiaADia = JSON.parse(questionnaireData.alimentosDoDiaADia)
      } catch (e) {
        console.error('Erro ao fazer parse dos alimentos:', e)
        questionnaireData.alimentosDoDiaADia = {
          carboidratos: [],
          proteinas: [],
          gorduras: [],
          frutas: []
        }
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
    console.log('📝 Recebendo novo questionário (7 blocos) para userId:', userId)
    console.log('📦 Body recebido:', JSON.stringify(req.body, null, 2))
    
    const validatedData = questionnaireSchema.parse(req.body)
    console.log('✅ Dados validados:', JSON.stringify(validatedData, null, 2))

    // Converter alimentosDoDiaADia para JSON string
    const alimentosJson = JSON.stringify(validatedData.alimentosDoDiaADia)
    console.log('🥗 Alimentos convertidos:', alimentosJson)

    // Verificar se já existe questionário
    console.log('🔍 Verificando se já existe questionário...')
    let existing
    try {
      existing = await prisma.questionnaireData.findUnique({
        where: { userId }
      })
      console.log('📋 Questionário existente:', existing ? 'Sim' : 'Não')
    } catch (findError) {
      console.error('❌ Erro ao verificar questionário existente:', findError)
      console.error('❌ Código do erro:', findError.code)
      console.error('❌ Mensagem do erro:', findError.message)
      throw findError
    }

    console.log('💾 Salvando dados no banco...')
    let questionnaireData
    try {
      questionnaireData = existing
      ? await prisma.questionnaireData.update({
          where: { userId },
          data: {
            // Bloco 1
            idade: validatedData.idade,
            sexo: validatedData.sexo,
            altura: validatedData.altura,
            pesoAtual: validatedData.pesoAtual,
            objetivo: validatedData.objetivo,
            
            // Bloco 2
            frequenciaAtividade: validatedData.frequenciaAtividade,
            tipoAtividade: validatedData.tipoAtividade,
            horarioTreino: validatedData.horarioTreino,
            rotinaDiaria: validatedData.rotinaDiaria,
            
            // Bloco 3
            quantidadeRefeicoes: validatedData.quantidadeRefeicoes,
            preferenciaRefeicoes: validatedData.preferenciaRefeicoes,
            
            // Bloco 4
            confortoPesar: validatedData.confortoPesar,
            tempoPreparacao: validatedData.tempoPreparacao,
            preferenciaVariacao: validatedData.preferenciaVariacao,
            
            // Bloco 5
            alimentosDoDiaADia: alimentosJson,
            
            // Bloco 6
            restricaoAlimentar: validatedData.restricaoAlimentar,
            outraRestricao: validatedData.restricaoAlimentar === 'Outra' 
              ? validatedData.outraRestricao 
              : null,
            alimentosEvita: validatedData.alimentosEvita || null,
            
            // Bloco 7
            opcoesSubstituicao: validatedData.opcoesSubstituicao,
            refeicoesLivres: validatedData.refeicoesLivres
          }
        })
      : await prisma.questionnaireData.create({
          data: {
            userId,
            
            // Bloco 1
            idade: validatedData.idade,
            sexo: validatedData.sexo,
            altura: validatedData.altura,
            pesoAtual: validatedData.pesoAtual,
            objetivo: validatedData.objetivo,
            
            // Bloco 2
            frequenciaAtividade: validatedData.frequenciaAtividade,
            tipoAtividade: validatedData.tipoAtividade,
            horarioTreino: validatedData.horarioTreino,
            rotinaDiaria: validatedData.rotinaDiaria,
            
            // Bloco 3
            quantidadeRefeicoes: validatedData.quantidadeRefeicoes,
            preferenciaRefeicoes: validatedData.preferenciaRefeicoes,
            
            // Bloco 4
            confortoPesar: validatedData.confortoPesar,
            tempoPreparacao: validatedData.tempoPreparacao,
            preferenciaVariacao: validatedData.preferenciaVariacao,
            
            // Bloco 5
            alimentosDoDiaADia: alimentosJson,
            
            // Bloco 6
            restricaoAlimentar: validatedData.restricaoAlimentar,
            outraRestricao: validatedData.restricaoAlimentar === 'Outra' 
              ? validatedData.outraRestricao 
              : null,
            alimentosEvita: validatedData.alimentosEvita || null,
            
            // Bloco 7
            opcoesSubstituicao: validatedData.opcoesSubstituicao,
            refeicoesLivres: validatedData.refeicoesLivres
          }
        })
    } catch (saveError) {
      console.error('❌ Erro ao salvar questionário no banco:', saveError)
      console.error('❌ Código do erro:', saveError.code)
      console.error('❌ Mensagem do erro:', saveError.message)
      console.error('❌ Stack trace:', saveError.stack)
      throw saveError
    }

    console.log('✅ Questionário salvo com sucesso!')
    res.json({
      message: 'Questionário salvo com sucesso!',
      data: questionnaireData
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação:', error.errors)
      const errorMessages = error.errors.map(err => {
        const path = err.path.join('.')
        return `${path}: ${err.message}`
      }).join(', ')
      
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errorMessages,
        validationErrors: error.errors.map(err => ({
          path: err.path,
          message: err.message,
          code: err.code
        }))
      })
    }

    console.error('❌ Erro ao salvar questionário:', error)
    console.error('Stack trace:', error.stack)
    console.error('Request body:', JSON.stringify(req.body, null, 2))
    
    // Verificar se é erro do Prisma
    if (error.code && error.code.startsWith('P')) {
      return res.status(500).json({ 
        error: 'Erro no banco de dados', 
        details: 'Erro ao salvar dados. Verifique os logs do servidor.',
        code: error.code
      })
    }
    
    res.status(500).json({ 
      error: 'Erro ao salvar questionário', 
      details: error.message || 'Erro desconhecido',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

export default router
