import express from 'express'
import { OpenAI } from 'openai'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Inicializar OpenAI
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
} else {
  console.warn('⚠️  OPENAI_API_KEY não configurada no .env')
}

// Rota para sugestão de IA
router.post('/ai-suggestion', authenticate, async (req, res) => {
  try {
    const nutricionistaId = req.user.userId
    const { pacienteId, mealIndex, itemIndex, mealData, currentDiet } = req.body
    const role = req.user.role?.toUpperCase()

    // Verificar se é nutricionista
    if (role !== 'NUTRICIONISTA' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado.' })
    }

    // Verificar se o paciente pertence ao nutricionista
    const paciente = await prisma.user.findFirst({
      where: {
        id: pacienteId,
        nutricionistaId: nutricionistaId
      },
      include: {
        questionnaireData: true
      }
    })

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado ou não está vinculado a você' })
    }

    if (!openai) {
      return res.status(500).json({ 
        error: 'API da OpenAI não configurada',
        details: 'Configure OPENAI_API_KEY no arquivo .env'
      })
    }

    // Construir prompt baseado no contexto
    let prompt = ''

    if (itemIndex !== null && itemIndex !== undefined) {
      // Sugestão para item específico
      const item = mealData.itens[itemIndex]
      prompt = `Como nutricionista, sugira uma melhoria para o seguinte alimento na refeição "${mealData.nome}":

Alimento atual: ${item.alimento}
Porção atual: ${item.porcao}
Calorias atuais: ${item.kcal} kcal

Contexto do paciente:
- Idade: ${paciente.questionnaireData?.idade || 'N/A'} anos
- Sexo: ${paciente.questionnaireData?.sexo || 'N/A'}
- Objetivo: ${paciente.questionnaireData?.objetivo || 'N/A'}
- Restrições: ${paciente.questionnaireData?.restricoes || 'Nenhuma'}

Retorne APENAS um JSON válido com a seguinte estrutura:
{
  "alimento": "nome do alimento sugerido",
  "porcao": "porção sugerida (ex: 100 g)",
  "kcal": número_de_calorias,
  "observacao": "breve justificativa nutricional"
}`
    } else {
      // Sugestão para refeição inteira
      prompt = `Como nutricionista, sugira uma refeição completa para "${mealData.nome}" considerando:

Total calórico atual da refeição: ${mealData.totalRefeicaoKcal} kcal
Número de itens: ${mealData.itens?.length || 0}

Contexto do paciente:
- Idade: ${paciente.questionnaireData?.idade || 'N/A'} anos
- Sexo: ${paciente.questionnaireData?.sexo || 'N/A'}
- Objetivo: ${paciente.questionnaireData?.objetivo || 'N/A'}
- Nível de atividade: ${paciente.questionnaireData?.nivelAtividade || 'N/A'}
- Restrições: ${paciente.questionnaireData?.restricoes || 'Nenhuma'}
- Preferência alimentar: ${paciente.questionnaireData?.preferenciaAlimentacao || 'N/A'}

Total calórico do dia: ${currentDiet?.totalDiaKcal || 0} kcal

Retorne APENAS um JSON válido com a seguinte estrutura:
{
  "itens": [
    {
      "alimento": "nome do alimento",
      "porcao": "porção (ex: 100 g)",
      "kcal": número_de_calorias,
      "substituicoes": []
    }
  ],
  "totalRefeicaoKcal": número_total_calorias
}`
    }

    // Chamar OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um nutricionista profissional. Retorne APENAS JSON válido, sem texto adicional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const responseContent = completion.choices[0].message.content
    const suggestion = JSON.parse(responseContent)

    res.json({
      suggestion,
      message: 'Sugestão gerada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao gerar sugestão da IA:', error)
    res.status(500).json({
      error: 'Erro ao gerar sugestão da IA',
      details: error.message
    })
  }
})

export default router

