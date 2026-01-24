import express from 'express'
import { z } from 'zod'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para o novo questionário
const questionnaireSchema = z.object({
  // Bloco 1: Dados Básicos
  idade: z.number().int().min(1).max(150),
  sexo: z.enum(['Masculino', 'Feminino', 'Prefiro não informar']).nullable().optional(),
  altura: z.number().positive().min(50).max(250),
  pesoAtual: z.number().positive().min(20).max(300),
  objetivo: z.enum([
    'Emagrecer',
    'Manter o peso',
    'Ganhar massa muscular',
    'Ganhar peso de forma geral'
  ]),
  
  // Sentimentos e Expectativas
  sentimentosCorpo: z.string().optional().default(''),
  expectativaSucesso: z.string().optional().default(''),
  
  // Rotina e Sono
  rotinaDiaria: z.string(), // Texto livre
  sono: z.enum([
    'Durmo bem',
    'Durmo mal e acordo cansado',
    'Varia muito'
  ]),
  
  // Bloco 2: Atividade Física
  frequenciaAtividade: z.enum([
    'Não pratico atualmente',
    '1–2x por semana',
    '3–4x por semana',
    '5x ou mais por semana',
    // Valores legados para compatibilidade
    'Não pratico',
    'Sim, 1–2x por semana',
    'Sim, 3–4x por semana',
    'Sim, 5x ou mais por semana'
  ]),
  barreirasTreino: z.string().optional().default(''),
  tipoAtividade: z.string().optional().default(''),
  relacaoEmocionalTreino: z.string().optional().default(''),
  preferenciaDificuldadeTreino: z.string().optional().default(''),
  rotinaTreinoDetalhada: z.string().optional().default(''), // Legado
  outraAtividade: z.string().optional().default(''),
  horarioTreino: z.enum(['Manhã', 'Tarde', 'Noite', 'Varia muito']).or(z.string().transform((val) => {
    // Mapear valores incorretos para valores válidos
    const lowerVal = val.toLowerCase()
    if (lowerVal.includes('manhã') || lowerVal.includes('manha')) return 'Manhã'
    if (lowerVal.includes('tarde')) return 'Tarde'
    if (lowerVal.includes('noite')) return 'Noite'
    if (lowerVal.includes('varia') || lowerVal.includes('motivação') || lowerVal.includes('motivacao')) return 'Varia muito'
    // Se não conseguir mapear, retornar valor padrão
    return 'Varia muito'
  })),
  refeicaoPreTreino: z.enum([
    'Sim, sempre',
    'Às vezes',
    'Não'
  ]).optional().nullable().default(null),
  refeicaoPosTreino: z.enum([
    'Sim, sempre',
    'Às vezes',
    'Não'
  ]).optional().nullable().default(null),
  
  // Bloco 3: Estrutura da Dieta
  quantidadeRefeicoes: z.enum([
    '3',
    '4',
    '5',
    'Mais de 5',
    // Valores legados para compatibilidade
    '3 refeições',
    '4 refeições',
    '5 refeições'
  ]).or(z.string().transform((val) => {
    // Mapear valores incorretos para valores válidos
    const lowerVal = val.toLowerCase()
    if (lowerVal.includes('3') || lowerVal === '3') return '3'
    if (lowerVal.includes('4') || lowerVal === '4') return '4'
    if (lowerVal.includes('5') || lowerVal === '5') return '5'
    if (lowerVal.includes('mais de 5') || lowerVal.includes('mais de cinco')) return 'Mais de 5'
    if (lowerVal.includes('varia')) return '3' // Padrão se variar
    // Se não conseguir mapear, retornar valor padrão
    return '3'
  })),
  preferenciaRefeicoes: z.enum([
    'Mais simples',
    'Um equilíbrio',
    'Mais completas e variadas',
    // Valores legados para compatibilidade
    'Mais simples, com poucos alimentos',
    'Um equilíbrio entre simples e variadas'
  ]).or(z.string().transform((val) => {
    // Mapear valores incorretos para valores válidos
    const lowerVal = val.toLowerCase()
    if (lowerVal.includes('simples') || lowerVal === '3' || lowerVal === '1') return 'Mais simples'
    if (lowerVal.includes('equilíbrio') || lowerVal.includes('equilibrio') || lowerVal === '2') return 'Um equilíbrio'
    if (lowerVal.includes('completas') || lowerVal.includes('variadas') || lowerVal === '4' || lowerVal === '5') return 'Mais completas e variadas'
    // Se não conseguir mapear, retornar valor padrão
    return 'Um equilíbrio'
  })),
  
  // Bloco 4: Alimentação
  alimentosGosta: z.string().optional().default(''),
  alimentosEvita: z.string().optional().default(''),
  tempoPreparacao: z.enum([
    'Até 10 minutos',
    '10–30 minutos',
    'Tenho tempo e gosto de cozinhar',
    // Valores legados para compatibilidade
    'Muito pouco (até 10 min)',
    'Médio (10–30 min)'
  ]),
  confortoPesar: z.enum([
    'Sim',
    'Às vezes',
    'Prefiro medidas caseiras',
    // Valores legados para compatibilidade
    'Sim, sem problemas'
  ]),
  preferenciaVariacao: z.enum([
    'Prefiro repetir',
    'Um pouco de repetição é ok',
    'Prefiro muita variedade',
    // Valores legados para compatibilidade
    'Um pouco de repetição é ok',
    'Prefiro variedade'
  ]),
  alimentacaoFimSemana: z.enum([
    'Parecida com a semana',
    'Um pouco mais solta',
    'Sai totalmente do controle'
  ]).optional(),
  
  // Bloco 5: Alimentos do Dia a Dia (opcional)
  alimentosDoDiaADia: z.object({
    carboidratos: z.array(z.string()).optional().default([]),
    proteinas: z.array(z.string()).optional().default([]),
    gorduras: z.array(z.string()).optional().default([]),
    verduras: z.array(z.string()).optional().default([]),
    legumes: z.array(z.string()).optional().default([]),
    frutas: z.array(z.string()).optional().default([]),
    fibras: z.array(z.string()).optional().default([]) // Mantido para compatibilidade
  }).optional().default({
    carboidratos: [],
    proteinas: [],
    gorduras: [],
    verduras: [],
    legumes: [],
    frutas: [],
    fibras: []
  }),
  
  // Bloco 6: Restrições
  restricaoAlimentar: z.enum([
    'Nenhuma',
    'Intolerância à lactose',
    'Intolerância ao glúten',
    'Glúten', // Legado
    'Outra'
  ]),
  outraRestricao: z.string().optional().default(''),
  
  // Bloco 7: Flexibilidade Real
  opcoesSubstituicao: z.enum([
    'Sim, gosto de opções',
    'Algumas opções já são suficientes',
    'Prefiro algo mais fixo',
    // Valores legados para compatibilidade
    'Sim, gosto de ter opções'
  ]),
  refeicoesLivres: z.enum([
    'Sim',
    'Talvez',
    'Prefiro seguir o plano à risca',
    // Valores legados para compatibilidade
    'Não'
  ]),
  
  // Bloco 8: Saúde e Limitações
  problemasSaude: z.enum(['Não', 'Sim']),
  quaisProblemasSaude: z.string().optional().default(''),
  usoMedicacao: z.enum(['Não', 'Sim']),
  quaisMedicamentos: z.string().optional().default(''),
  limitacoesFisicas: z.enum(['Não', 'Sim']),
  detalhesLimitacao: z.string().optional().default(''),
  restricoesMedicasExercicio: z.enum(['Não', 'Sim']),
  movimentosEvitar: z.string().optional().default(''),
  receiosSaude: z.string().optional().default('')
})

// Rota para verificar se o questionário foi preenchido
router.get('/check', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId }
    })

    // Verificar se o questionário existe E tem dados essenciais preenchidos
    // Um questionário válido deve ter pelo menos idade, altura, peso e objetivo
    const hasValidData = questionnaireData && 
      questionnaireData.idade !== null &&
      questionnaireData.altura !== null &&
      questionnaireData.pesoAtual !== null &&
      questionnaireData.objetivo !== null

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

    console.log('📋 Verificando questionário para userId:', userId)
    console.log('📋 Questionário existe:', !!questionnaireData)
    console.log('📋 Dados válidos:', hasValidData)

    res.json({ 
      hasCompleted: hasValidData,
      data: hasValidData ? questionnaireData : null
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
    
    // Garantir que o usuário existe antes de prosseguir (evitar P2003)
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!userExists) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      })
    }

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
      const dataToSave = {
        // Bloco 1: Dados Básicos
        idade: validatedData.idade,
        sexo: validatedData.sexo || null,
        altura: validatedData.altura,
        pesoAtual: validatedData.pesoAtual,
        objetivo: validatedData.objetivo,
        
        // Sentimentos e Expectativas
        sentimentosCorpo: validatedData.sentimentosCorpo || null,
        expectativaSucesso: validatedData.expectativaSucesso || null,
        
        // Rotina e Sono
        rotinaDiaria: validatedData.rotinaDiaria,
        sono: validatedData.sono,
        
        // Bloco 2: Atividade Física
        frequenciaAtividade: validatedData.frequenciaAtividade,
        barreirasTreino: validatedData.barreirasTreino || null,
        tipoAtividade: validatedData.tipoAtividade || null,
        relacaoEmocionalTreino: validatedData.relacaoEmocionalTreino || null,
        preferenciaDificuldadeTreino: validatedData.preferenciaDificuldadeTreino || null,
        rotinaTreinoDetalhada: validatedData.rotinaTreinoDetalhada || null,
        outraAtividade: validatedData.outraAtividade || null,
        horarioTreino: validatedData.horarioTreino,
        
        // Bloco 3: Estrutura da Dieta
        quantidadeRefeicoes: validatedData.quantidadeRefeicoes,
        preferenciaRefeicoes: validatedData.preferenciaRefeicoes,
        
        // Bloco 4: Alimentação
        alimentosGosta: validatedData.alimentosGosta || null,
        alimentosEvita: validatedData.alimentosEvita || null,
        tempoPreparacao: validatedData.tempoPreparacao,
        confortoPesar: validatedData.confortoPesar,
        preferenciaVariacao: validatedData.preferenciaVariacao,
        alimentacaoFimSemana: validatedData.alimentacaoFimSemana || null,
        
        // Bloco 5: Alimentos do Dia a Dia
        alimentosDoDiaADia: alimentosJson,
        
        // Bloco 6: Restrições
        restricaoAlimentar: validatedData.restricaoAlimentar,
        outraRestricao: validatedData.restricaoAlimentar === 'Outra' 
          ? (validatedData.outraRestricao || null)
          : null,
        
        // Bloco 7: Flexibilidade Real
        opcoesSubstituicao: validatedData.opcoesSubstituicao,
        refeicoesLivres: validatedData.refeicoesLivres,
        
        // Bloco 8: Saúde e Limitações
        problemasSaude: validatedData.problemasSaude,
        quaisProblemasSaude: validatedData.quaisProblemasSaude || null,
        usoMedicacao: validatedData.usoMedicacao,
        quaisMedicamentos: validatedData.quaisMedicamentos || null,
        limitacoesFisicas: validatedData.limitacoesFisicas,
        detalhesLimitacao: validatedData.detalhesLimitacao || null,
        restricoesMedicasExercicio: validatedData.restricoesMedicasExercicio,
        movimentosEvitar: validatedData.movimentosEvitar || null,
        receiosSaude: validatedData.receiosSaude || null
      }

      questionnaireData = existing
        ? await prisma.questionnaireData.update({
            where: { userId },
            data: dataToSave
          })
        : await prisma.questionnaireData.create({
            data: {
              userId,
              ...dataToSave
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
    console.error('Error code:', error.code, 'meta:', error.meta)
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Erro de integridade',
        details: 'Usuário não encontrado ou relação inválida. Verifique se o usuário existe.'
      })
    }
    
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
