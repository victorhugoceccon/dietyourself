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

// Listar pacientes do nutricionista
router.get('/pacientes', authenticate, async (req, res) => {
  try {
    const nutricionistaId = req.user.userId
    const role = req.user.role?.toUpperCase()

    console.log(`\n📋 GET /pacientes - Nutricionista ID: ${nutricionistaId}, Role: ${role}`)

    // Verificar se é nutricionista
    if (role !== 'NUTRICIONISTA' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas nutricionistas podem acessar esta rota.' })
    }

    // Verificar se o nutricionista existe
    const nutricionista = await prisma.user.findUnique({
      where: { id: nutricionistaId },
      select: { id: true, email: true, role: true }
    })

    if (!nutricionista) {
      console.log(`❌ Nutricionista com ID ${nutricionistaId} não encontrado no banco!`)
      return res.status(404).json({ error: 'Nutricionista não encontrado' })
    }

    console.log(`✅ Nutricionista encontrado: ${nutricionista.email}`)

    // Buscar pacientes
    const pacientes = await prisma.user.findMany({
      where: {
        nutricionistaId: nutricionistaId,
        role: 'PACIENTE' // Garantir que apenas pacientes sejam retornados
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        questionnaireData: {
          select: {
            idade: true,
            sexo: true,
            altura: true,
            pesoAtual: true,
            objetivo: true
          }
        },
        dieta: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📋 Nutricionista ${nutricionistaId} tem ${pacientes.length} pacientes:`)
    pacientes.forEach(p => {
      console.log(`   - ${p.email} (${p.name || 'Sem nome'})`)
    })

    res.json({ pacientes })
  } catch (error) {
    console.error('Erro ao listar pacientes:', error)
    res.status(500).json({ error: 'Erro ao listar pacientes' })
  }
})

// Criar novo paciente
router.post('/pacientes', authenticate, async (req, res) => {
  try {
    const nutricionistaId = req.user.userId
    const role = req.user.role?.toUpperCase()

    // Verificar se é nutricionista
    if (role !== 'NUTRICIONISTA' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas nutricionistas podem criar pacientes.' })
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

    // Criar paciente vinculado ao nutricionista
    const paciente = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: 'PACIENTE',
        nutricionistaId: nutricionistaId
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
      message: 'Paciente criado com sucesso',
      paciente
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }

    console.error('Erro ao criar paciente:', error)
    res.status(500).json({ error: 'Erro ao criar paciente' })
  }
})

// Obter dieta de um paciente específico
router.get('/pacientes/:pacienteId/dieta', authenticate, async (req, res) => {
  try {
    const nutricionistaId = req.user.userId
    const { pacienteId } = req.params
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
      }
    })

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado ou não está vinculado a você' })
    }

    // Buscar dieta
    const dieta = await prisma.dieta.findUnique({
      where: { userId: pacienteId }
    })

    if (!dieta) {
      return res.json({ dieta: null, paciente })
    }

    // Parse do JSON
    let dietaData
    try {
      dietaData = JSON.parse(dieta.dietaData)
    } catch (e) {
      console.error('❌ Erro ao parsear dietaData:', e)
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

    // Buscar dados completos do paciente incluindo questionnaireData completo (novo formato 7 blocos)
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
            tipoAtividade: true,
            horarioTreino: true,
            rotinaDiaria: true,
            quantidadeRefeicoes: true,
            preferenciaRefeicoes: true,
            confortoPesar: true,
            tempoPreparacao: true,
            preferenciaVariacao: true,
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

    res.json({
      dieta: dietaFinal,
      paciente: pacienteCompleto,
      nutritionalNeeds: nutritionalNeeds
    })
  } catch (error) {
    console.error('❌ Erro ao buscar dieta do paciente:', error)
    console.error('   - Stack:', error.stack)
    console.error('   - Message:', error.message)
    res.status(500).json({ error: 'Erro ao buscar dieta do paciente', details: error.message })
  }
})

// Atualizar dieta de um paciente
router.patch('/pacientes/:pacienteId/dieta', authenticate, async (req, res) => {
  try {
    const nutricionistaId = req.user.userId
    const { pacienteId } = req.params
    const { dieta } = req.body
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
      }
    })

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado ou não está vinculado a você' })
    }

    if (!dieta || !dieta.refeicoes || !Array.isArray(dieta.refeicoes)) {
      return res.status(400).json({ error: 'Formato de dieta inválido' })
    }

    // Validar estrutura básica
    const dietaString = JSON.stringify(dieta)

    // Salvar/atualizar dieta
    await prisma.dieta.upsert({
      where: { userId: pacienteId },
      update: {
        dietaData: dietaString
      },
      create: {
        userId: pacienteId,
        dietaData: dietaString
      }
    })

    res.json({
      message: 'Dieta atualizada com sucesso',
      dieta
    })
  } catch (error) {
    console.error('Erro ao atualizar dieta do paciente:', error)
    res.status(500).json({
      error: 'Erro ao atualizar dieta do paciente',
      details: error.message
    })
  }
})

// Atualizar necessidades nutricionais de um paciente
router.patch('/pacientes/:pacienteId/necessidades', authenticate, async (req, res) => {
  try {
    const nutricionistaId = req.user.userId
    const { pacienteId } = req.params
    const { nutritionalNeeds } = req.body
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
      }
    })

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado ou não está vinculado a você' })
    }

    if (!nutritionalNeeds) {
      return res.status(400).json({ error: 'Necessidades nutricionais são obrigatórias' })
    }

    // Buscar dieta atual
    const dieta = await prisma.dieta.findUnique({
      where: { userId: pacienteId }
    })

    let dietaDataParsed = {}
    if (dieta && dieta.dietaData) {
      try {
        dietaDataParsed = JSON.parse(dieta.dietaData)
      } catch (e) {
        console.error('Erro ao parsear dieta:', e)
      }
    }

    // Atualizar nutritionalNeeds na estrutura da dieta
    dietaDataParsed.nutritionalNeeds = nutritionalNeeds
    const dietaString = JSON.stringify(dietaDataParsed)

    // Salvar/atualizar dieta com as novas necessidades
    await prisma.dieta.upsert({
      where: { userId: pacienteId },
      update: {
        dietaData: dietaString
      },
      create: {
        userId: pacienteId,
        dietaData: dietaString
      }
    })

    res.json({
      message: 'Necessidades nutricionais atualizadas com sucesso',
      nutritionalNeeds
    })
  } catch (error) {
    console.error('Erro ao atualizar necessidades nutricionais:', error)
    res.status(500).json({
      error: 'Erro ao atualizar necessidades nutricionais',
      details: error.message
    })
  }
})

// Gerar dieta para um paciente
router.post('/pacientes/:pacienteId/dieta/generate', authenticate, async (req, res) => {
  try {
    const nutricionistaId = req.user.userId
    const { pacienteId } = req.params
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
      }
    })

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado ou não está vinculado a você' })
    }

    // Buscar dados do questionário do paciente
    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId: pacienteId }
    })

    if (!questionnaireData) {
      return res.status(400).json({ error: 'Paciente precisa completar o questionário antes de gerar a dieta' })
    }

    // Importar OpenAI dinamicamente
    const { OpenAI } = await import('openai')

    // Inicializar OpenAI
    let openai = null
    if (process.env.OPENAI_API_KEY) {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    } else {
      return res.status(500).json({ 
        error: 'API da OpenAI não configurada',
        details: 'Configure OPENAI_API_KEY no arquivo .env'
      })
    }

    // Parse das restrições
    let restricoesArray = []
    if (questionnaireData.restricoes) {
      try {
        restricoesArray = JSON.parse(questionnaireData.restricoes)
      } catch (e) {
        console.error('Erro ao fazer parse das restrições:', e)
      }
    }

    // Construir prompt (mesmo usado em diet.js)
    const restricoesTexto = restricoesArray.length > 0 
      ? restricoesArray.join(', ') 
      : 'nenhuma restrição alimentar'

    const prompt = `Crie uma dieta diária personalizada para um usuário de ${questionnaireData.idade} anos, sexo ${questionnaireData.sexo}, ${questionnaireData.altura} cm de altura e ${questionnaireData.pesoAtual} kg, com objetivo de ${questionnaireData.objetivo}, nível de atividade ${questionnaireData.nivelAtividade} e preferência por ${questionnaireData.refeicoesDia} refeições por dia. O usuário possui as seguintes restrições alimentares: ${restricoesTexto}. O usuário não gosta dos seguintes alimentos e eles devem ser evitados: ${questionnaireData.alimentosNaoGosta || 'nenhum'}. A preferência alimentar é ${questionnaireData.preferenciaAlimentacao}, o usuário ${questionnaireData.costumaCozinhar} e trouxe as seguintes observações adicionais: ${questionnaireData.observacoes || 'nenhuma'}. Gere um plano alimentar para 1 dia, distribuído em ${questionnaireData.refeicoesDia} refeições, contendo para cada refeição uma lista clara de alimentos, porções objetivas (em gramas e/ou unidades), o valor calórico individual de cada alimento, o total de calorias da refeição e o total geral de calorias do dia. Para cada alimento listado, gere também uma lista de substituições simples e acessíveis, mantendo valor calórico aproximado e função nutricional semelhante, para evitar que o plano fique engessado. As substituições devem ser alimentos comuns, fáceis de encontrar e coerentes com a alimentação ${questionnaireData.preferenciaAlimentacao}, respeitando restrições, alimentos não aceitos e observações do usuário. Inclua também um resumo do dia com uma meta calórica estimada compatível com o objetivo informado e uma distribuição simples de macronutrientes (proteína, carboidrato e gordura) em gramas para o dia. As refeições devem ser práticas, fáceis de preparar e compatíveis com a rotina do usuário. Não utilize termos técnicos complexos, não faça diagnósticos médicos e não prescreva medicamentos. A resposta deve ser retornada obrigatoriamente em JSON válido, sem qualquer texto fora do JSON, seguindo exatamente o formato abaixo:

{
  "totalDiaKcal": 3000,
  "macrosDia": {
    "proteina_g": 170,
    "carbo_g": 400,
    "gordura_g": 80
  },
  "refeicoes": [
    {
      "nome": "Café da manhã",
      "itens": [
        {
          "alimento": "Aveia em flocos",
          "porcao": "80 g",
          "kcal": 310,
          "substituicoes": [
            {
              "alimento": "Pão francês",
              "porcaoEquivalente": "2 unidades",
              "kcalAproximada": 270
            }
          ]
        }
      ],
      "totalRefeicaoKcal": 580
    }
  ],
  "observacoesPlano": "Observações gerais do plano"
}`

    // Chamar OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um nutricionista especializado em criar dietas personalizadas. Retorne APENAS JSON válido, sem texto adicional.'
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
    let dietaJson
    try {
      dietaJson = JSON.parse(responseContent)
    } catch (e) {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        dietaJson = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Resposta do OpenAI não contém JSON válido')
      }
    }

    // Validar estrutura básica
    if (!dietaJson.refeicoes || !Array.isArray(dietaJson.refeicoes)) {
      throw new Error('Resposta do OpenAI não contém estrutura de dieta válida')
    }

    // Salvar dieta no banco
    const dietaString = JSON.stringify(dietaJson)

    const dietaSalva = await prisma.dieta.upsert({
      where: { userId: pacienteId },
      update: {
        dietaData: dietaString
      },
      create: {
        userId: pacienteId,
        dietaData: dietaString
      }
    })

    res.json({
      message: 'Dieta gerada com sucesso!',
      dieta: dietaJson
    })

  } catch (error) {
    console.error('Erro ao gerar dieta:', error)
    
    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: 'Erro ao comunicar com OpenAI',
        details: error.response.data?.error?.message || error.message
      })
    }

    res.status(500).json({
      error: 'Erro ao gerar dieta',
      details: error.message || 'Erro desconhecido'
    })
  }
})

export default router

