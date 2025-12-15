import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Função auxiliar para normalizar URLs de webhook (substitui webhook-test por webhook)
const normalizeWebhookUrl = (url) => {
  if (!url) return ''
  // Substituir webhook-test por webhook na URL
  return url.replace(/\/webhook-test\//g, '/webhook/')
}

// Função para extrair URL base do N8N_WEBHOOK_URL e construir getDiet URL
const getDietUrl = () => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL || ''
  if (!webhookUrl) return ''
  
  const normalized = normalizeWebhookUrl(webhookUrl)
  // Extrair a base URL (antes de /webhook/...)
  const baseMatch = normalized.match(/^(https?:\/\/[^\/]+)/)
  if (!baseMatch) return ''
  
  const baseUrl = baseMatch[1]
  return `${baseUrl}/webhook/getDiet`
}

const N8N_GET_DIET_URL = getDietUrl()
const N8N_API_KEY = process.env.N8N_API_KEY || ''

// Rota para gerar dieta
router.post('/generate', authenticate, async (req, res) => {
  try {
    // Verificar se N8N está configurado
    if (!N8N_GET_DIET_URL) {
      return res.status(500).json({ 
        error: 'Serviço de geração de dieta não configurado',
        details: 'Configure N8N_WEBHOOK_URL no arquivo .env'
      })
    }

    const userId = req.user.userId
    console.log('Gerando dieta para userId:', userId)

    // Buscar dados do questionário
    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId }
    })

    if (!questionnaireData) {
      return res.status(400).json({ error: 'Complete o questionário antes de gerar a dieta' })
    }

    console.log('📋 Dados do questionário encontrados')

    // Parse das restrições
    let restricoesArray = []
    if (questionnaireData.restricoes) {
      try {
        restricoesArray = JSON.parse(questionnaireData.restricoes)
      } catch (e) {
        console.error('Erro ao fazer parse das restrições:', e)
      }
    }

    // Preparar contexto do questionário para N8N
    const questionnaireContext = {
      idade: questionnaireData.idade,
      sexo: questionnaireData.sexo,
      altura: questionnaireData.altura,
      pesoAtual: questionnaireData.pesoAtual,
      objetivo: questionnaireData.objetivo,
      nivelAtividade: questionnaireData.nivelAtividade,
      refeicoesDia: questionnaireData.refeicoesDia,
      restricoes: restricoesArray,
      alimentosNaoGosta: questionnaireData.alimentosNaoGosta || '',
      preferenciaAlimentacao: questionnaireData.preferenciaAlimentacao,
      costumaCozinhar: questionnaireData.costumaCozinhar,
      observacoes: questionnaireData.observacoes || ''
    }

    // Preparar payload para N8N
    const payload = {
      questionnaireContext
    }

    // Headers para N8N
    const headers = {
      'Content-Type': 'application/json'
    }

    if (N8N_API_KEY && !N8N_API_KEY.startsWith('http')) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY
    }

    console.log('📤 Enviando requisição para N8N:', N8N_GET_DIET_URL)

    // Fazer requisição para N8N
    let response
    try {
      // Timeout aumentado para 180 segundos (3 minutos) - geração de dieta pode demorar
      response = await fetch(N8N_GET_DIET_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(180000) // 180 segundos (3 minutos) de timeout
      })
    } catch (fetchError) {
      console.error('❌ Erro ao fazer fetch:', fetchError)
      
      // Verificar se é um erro de timeout
      if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
        throw new Error('Tempo limite excedido. A geração da dieta está demorando mais que o esperado. Tente novamente.')
      }
      
      throw new Error(`Erro ao comunicar com o serviço de geração de dieta: ${fetchError.message}`)
    }

    const responseText = await response.text()
    console.log('📥 Resposta recebida do N8N, status:', response.status)
    console.log('📥 Tamanho da resposta:', responseText.length, 'caracteres')

    if (!response.ok) {
      console.error('❌ Erro do N8N:', response.status, responseText)
      throw new Error(`Erro ao gerar dieta: ${response.status} ${responseText.substring(0, 200)}`)
    }

    // Parse da resposta do N8N
    let responseData
    try {
      // Tentar parse direto
      responseData = JSON.parse(responseText)
    } catch (e) {
      // Tentar extrair JSON se vier como string
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Resposta do N8N não contém JSON válido')
        }
      } catch (e2) {
        console.error('❌ Erro ao parsear resposta:', e2)
        console.error('📄 Resposta recebida:', responseText.substring(0, 500))
        throw new Error('Erro ao processar resposta do serviço de geração de dieta')
      }
    }

    // Se a resposta vier dentro de um array (formato do N8N)
    if (Array.isArray(responseData) && responseData.length > 0) {
      responseData = responseData[0]
    }

    // Se a resposta vier dentro de um objeto output (formato do N8N)
    if (responseData.output) {
      // Se output for string JSON, fazer parse primeiro
      if (typeof responseData.output === 'string') {
        try {
          // Fazer parse da string JSON (pode ter caracteres de escape como \n)
          responseData = JSON.parse(responseData.output)
        } catch (e) {
          // Tentar extrair JSON da string se parse direto falhar
          const jsonMatch = responseData.output.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            responseData = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('Não foi possível parsear JSON de output')
          }
        }
      } else if (typeof responseData.output === 'object') {
        // Se output já for objeto, usar diretamente
        responseData = responseData.output
      }
    }

    // Se ainda for string (caso não tenha vindo em output), tentar parsear
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData)
      } catch (e) {
        // Tentar extrair JSON da string
        const jsonMatch = responseData.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0])
        }
      }
    }

    console.log('✅ Resposta parseada com sucesso')
    console.log('📊 Chaves da resposta:', Object.keys(responseData))

    // Se a estrutura vier como { dieta: { nutritionalNeeds: {...}, dieta: {...} } }
    // Extrair nutritionalNeeds e dieta do objeto interno
    let nutritionalNeeds, dietaJson
    
    if (responseData.dieta && typeof responseData.dieta === 'object') {
      // Verificar se tem nutritionalNeeds e dieta dentro do objeto dieta
      if (responseData.dieta.nutritionalNeeds && responseData.dieta.dieta) {
        nutritionalNeeds = responseData.dieta.nutritionalNeeds
        dietaJson = responseData.dieta.dieta
        console.log('📦 Estrutura detectada: { dieta: { nutritionalNeeds, dieta } }')
      } else if (responseData.nutritionalNeeds && responseData.dieta) {
        // Estrutura direta: { nutritionalNeeds, dieta }
        nutritionalNeeds = responseData.nutritionalNeeds
        dietaJson = responseData.dieta
        console.log('📦 Estrutura detectada: { nutritionalNeeds, dieta }')
      } else {
        // Tentar usar o objeto dieta inteiro como dietaJson e buscar nutritionalNeeds em outro lugar
        console.warn('⚠️  Estrutura não reconhecida, tentando adaptar...')
        dietaJson = responseData.dieta
        nutritionalNeeds = responseData.dieta.nutritionalNeeds || responseData.nutritionalNeeds || null
      }
    } else {
      // Estrutura direta no nível raiz
      nutritionalNeeds = responseData.nutritionalNeeds
      dietaJson = responseData.dieta
    }

    // Validar que tem nutritionalNeeds e dieta
    if (!nutritionalNeeds || !dietaJson) {
      console.error('❌ Estrutura da resposta inválida:')
      console.error('   nutritionalNeeds:', nutritionalNeeds ? '✓' : '✗')
      console.error('   dieta:', dietaJson ? '✓' : '✗')
      console.error('   Estrutura atual:', JSON.stringify(responseData, null, 2))
      throw new Error(`Resposta inválida: falta ${!nutritionalNeeds ? 'nutritionalNeeds' : ''} ${!dietaJson ? 'dieta' : ''}`.trim())
    }

    // Normalizar estrutura do nutritionalNeeds para o formato esperado pelo frontend
    // Se vier com proteina, carboidrato, gordura diretamente, criar objeto macros
    if (nutritionalNeeds && !nutritionalNeeds.macros && (nutritionalNeeds.proteina || nutritionalNeeds.carboidrato || nutritionalNeeds.gordura)) {
      nutritionalNeeds = {
        ...nutritionalNeeds,
        macros: {
          proteina: nutritionalNeeds.proteina || 0,
          carboidrato: nutritionalNeeds.carboidrato || 0,
          gordura: nutritionalNeeds.gordura || 0
        }
      }
      console.log('✅ Estrutura nutritionalNeeds normalizada para incluir macros')
    }

    console.log('💾 Salvando dieta e necessidades nutricionais no banco...')

    // Combinar nutritionalNeeds e dieta em um único objeto para salvar
    const dietaCompleta = {
      nutritionalNeeds,
      dieta: dietaJson
    }
    const dietaString = JSON.stringify(dietaCompleta)

    try {
      const dietaSalva = await prisma.dieta.upsert({
        where: { userId },
        update: {
          dietaData: dietaString
        },
        create: {
          userId,
          dietaData: dietaString
        }
      })

      console.log('✅ Dieta salva com sucesso, ID:', dietaSalva.id)
    } catch (dbError) {
      console.error('❌ Erro ao salvar dieta no banco:', dbError)
      throw new Error(`Erro ao salvar dieta: ${dbError.message}`)
    }

    console.log('📤 Retornando resposta para o frontend:')
    console.log('   - nutritionalNeeds:', nutritionalNeeds ? '✓ presente' : '✗ ausente')
    console.log('   - dieta:', dietaJson ? '✓ presente' : '✗ ausente')
    
    res.json({
      message: 'Dieta gerada com sucesso!',
      nutritionalNeeds: nutritionalNeeds,
      dieta: dietaJson
    })

  } catch (error) {
    console.error('❌ Erro ao gerar dieta:', error)
    console.error('Stack trace:', error.stack)
    
    res.status(500).json({
      error: 'Erro ao gerar dieta',
      details: error.message || 'Erro desconhecido'
    })
  }
})

// Rota para obter dieta do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    const dieta = await prisma.dieta.findUnique({
      where: { userId }
    })

    if (!dieta) {
      return res.json({ dieta: null, nutritionalNeeds: null })
    }

    // Parse do JSON
    let dietaData
    try {
      dietaData = JSON.parse(dieta.dietaData)
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao processar dieta salva' })
    }

    // Se a estrutura tiver nutritionalNeeds e dieta separados
    if (dietaData.nutritionalNeeds && dietaData.dieta) {
      // Normalizar estrutura do nutritionalNeeds se necessário
      let nutritionalNeeds = dietaData.nutritionalNeeds
      if (!nutritionalNeeds.macros && (nutritionalNeeds.proteina || nutritionalNeeds.carboidrato || nutritionalNeeds.gordura)) {
        nutritionalNeeds = {
          ...nutritionalNeeds,
          macros: {
            proteina: nutritionalNeeds.proteina || 0,
            carboidrato: nutritionalNeeds.carboidrato || 0,
            gordura: nutritionalNeeds.gordura || 0
          }
        }
      }
      
      return res.json({
        nutritionalNeeds: nutritionalNeeds,
        dieta: dietaData.dieta
      })
    }

    // Caso contrário, retornar estrutura antiga
    res.json({ dieta: dietaData, nutritionalNeeds: null })

  } catch (error) {
    console.error('Erro ao buscar dieta:', error)
    res.status(500).json({ error: 'Erro ao buscar dieta' })
  }
})

// Rota para atualizar um item específico da dieta
router.patch('/update-item', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { mealIndex, itemIndex, newItem } = req.body

    if (mealIndex === undefined || itemIndex === undefined || !newItem) {
      return res.status(400).json({ error: 'Parâmetros inválidos: mealIndex, itemIndex e newItem são obrigatórios' })
    }

    // Buscar dieta atual
    const dieta = await prisma.dieta.findUnique({
      where: { userId }
    })

    if (!dieta) {
      return res.status(404).json({ error: 'Dieta não encontrada' })
    }

    // Parse do JSON
    let dietaDataParsed
    try {
      dietaDataParsed = JSON.parse(dieta.dietaData)
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao processar dieta salva' })
    }

    // A dieta pode estar em dietaDataParsed.dieta ou diretamente em dietaDataParsed
    let dietaData
    if (dietaDataParsed.dieta && typeof dietaDataParsed.dieta === 'object') {
      // Estrutura: { nutritionalNeeds: {...}, dieta: {...} }
      dietaData = dietaDataParsed.dieta
    } else {
      // Estrutura antiga: dieta diretamente
      dietaData = dietaDataParsed
    }

    // Validar índices
    if (!dietaData.refeicoes || !Array.isArray(dietaData.refeicoes)) {
      console.error('❌ Estrutura inválida - refeicoes:', dietaData.refeicoes)
      console.error('❌ dietaData completo:', JSON.stringify(dietaData, null, 2))
      return res.status(400).json({ error: 'Estrutura de dieta inválida' })
    }

    if (!dietaData.refeicoes[mealIndex] || !dietaData.refeicoes[mealIndex].itens) {
      return res.status(400).json({ error: 'Refeição ou item não encontrado' })
    }

    if (!dietaData.refeicoes[mealIndex].itens[itemIndex]) {
      return res.status(400).json({ error: 'Item não encontrado' })
    }

    // Atualizar o item
    const oldItem = dietaData.refeicoes[mealIndex].itens[itemIndex]
    const kcalDiff = (newItem.kcal || oldItem.kcal) - oldItem.kcal

    // Substituir o item
    dietaData.refeicoes[mealIndex].itens[itemIndex] = {
      ...newItem,
      substituicoes: oldItem.substituicoes || [] // Manter substituições originais
    }

    // Atualizar total da refeição
    const totalRefeicaoKcal = dietaData.refeicoes[mealIndex].itens.reduce((sum, item) => sum + (item.kcal || 0), 0)
    dietaData.refeicoes[mealIndex].totalRefeicaoKcal = totalRefeicaoKcal

    // Atualizar total do dia se existir
    const totalDiaKcal = dietaData.refeicoes.reduce((sum, ref) => sum + (ref.totalRefeicaoKcal || 0), 0)
    if (dietaData.totalDiaKcal !== undefined) {
      dietaData.totalDiaKcal = totalDiaKcal
    }

    // Salvar dieta atualizada (manter estrutura original se tiver nutritionalNeeds)
    let dietaString
    if (dietaDataParsed.nutritionalNeeds) {
      // Manter estrutura com nutritionalNeeds
      dietaDataParsed.dieta = dietaData
      dietaString = JSON.stringify(dietaDataParsed)
    } else {
      // Salvar apenas a dieta
      dietaString = JSON.stringify(dietaData)
    }

    await prisma.dieta.update({
      where: { userId },
      data: {
        dietaData: dietaString
      }
    })

    console.log(`Item atualizado na refeição ${mealIndex}, item ${itemIndex}`)

    res.json({
      message: 'Item atualizado com sucesso!',
      dieta: dietaData
    })

  } catch (error) {
    console.error('Erro ao atualizar item da dieta:', error)
    res.status(500).json({ 
      error: 'Erro ao atualizar item da dieta',
      details: error.message 
    })
  }
})

// Função para extrair URL base do N8N_WEBHOOK_URL e construir swap-food URL
const getSwapFoodUrl = () => {
  const baseUrl = normalizeWebhookUrl(process.env.N8N_WEBHOOK_URL || '')
  if (!baseUrl) return ''
  
  // Extrair base URL removendo o último path
  const urlParts = baseUrl.split('/')
  urlParts.pop() // Remove último segmento
  const basePath = urlParts.join('/')
  
  return `${basePath}/swap-food`
}

const N8N_SWAP_FOOD_URL = getSwapFoodUrl()

// Função auxiliar para extrair peso em gramas de uma string de porção
function extractPesoG(porcao) {
  if (!porcao) return 0
  
  // Se for número, retornar diretamente
  if (typeof porcao === 'number') {
    return porcao
  }
  
  // Se não for string, tentar converter
  const porcaoStr = String(porcao)
  
  // Procurar por números seguidos de 'g' ou 'g '
  const match = porcaoStr.match(/(\d+(?:\.\d+)?)\s*g/i)
  if (match) {
    return parseFloat(match[1])
  }
  
  // Tentar converter outras unidades comuns (ex: ml para g aproximado)
  const mlMatch = porcaoStr.match(/(\d+(?:\.\d+)?)\s*ml/i)
  if (mlMatch) {
    return parseFloat(mlMatch[1]) // Aproximação: 1ml ≈ 1g
  }
  
  // Tentar extrair número no início da string (caso seja só número com texto)
  const numMatch = porcaoStr.match(/^(\d+(?:\.\d+)?)/)
  if (numMatch) {
    return parseFloat(numMatch[1])
  }
  
  // Se não encontrar, retornar 0
  return 0
}

// Rota para trocar alimento usando o agente swap-food
router.post('/swap-food', authenticate, async (req, res) => {
  try {
    const { mealIndex, itemIndex, userDesiredFood, dieta } = req.body

    if (mealIndex === undefined || itemIndex === undefined || !userDesiredFood) {
      return res.status(400).json({ error: 'Parâmetros inválidos: mealIndex, itemIndex e userDesiredFood são obrigatórios' })
    }

    if (!dieta || !dieta.refeicoes || !dieta.refeicoes[mealIndex]) {
      return res.status(400).json({ error: 'Dados da dieta inválidos' })
    }

    const userId = req.user.userId

    // Buscar dados do questionário para contexto
    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId }
    })

    const refeicao = dieta.refeicoes[mealIndex]
    const itemOriginal = refeicao.itens[itemIndex]

    if (!itemOriginal) {
      return res.status(400).json({ error: 'Item não encontrado' })
    }

    // Preparar currentMealItems
    const currentMealItems = refeicao.itens.map(item => ({
      alimento: item.alimento,
      peso_g: extractPesoG(item.porcao),
      kcal: item.kcal || 0
    }))

    // Preparar originalItem
    const originalItem = {
      alimento: itemOriginal.alimento,
      peso_g: extractPesoG(itemOriginal.porcao),
      kcal: itemOriginal.kcal || 0
    }

    // Preparar userContext.questionnaire
    let questionnaireContext = null
    if (questionnaireData) {
      questionnaireContext = {
        restricoes: questionnaireData.restricoes ? JSON.parse(questionnaireData.restricoes) : [],
        alimentosNaoGosta: questionnaireData.alimentosNaoGosta || null,
        preferenciaAlimentacao: questionnaireData.preferenciaAlimentacao || null,
        observacoes: questionnaireData.observacoes || null
      }
    }

    // Preparar payload para N8N
    const payload = {
      swapRequest: {
        mealName: refeicao.nome,
        originalItem: originalItem,
        currentMealItems: currentMealItems,
        userDesiredFood: userDesiredFood.trim()
      },
      userContext: {
        questionnaire: questionnaireContext
      }
    }

    console.log('\n📤 ===== ENVIANDO REQUEST PARA SWAP-FOOD =====')
    console.log('Payload:', JSON.stringify(payload, null, 2))
    console.log('URL:', N8N_SWAP_FOOD_URL)

    if (!N8N_SWAP_FOOD_URL) {
      return res.status(500).json({
        error: 'Serviço de troca de alimento não configurado',
        details: 'Configure N8N_WEBHOOK_URL no arquivo .env'
      })
    }

    // Headers para N8N
    const headers = {
      'Content-Type': 'application/json'
    }

    if (N8N_API_KEY && !N8N_API_KEY.startsWith('http')) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY
    }

    // Fazer requisição para N8N
    let response
    try {
      response = await fetch(N8N_SWAP_FOOD_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      })
    } catch (fetchError) {
      console.error('Erro ao fazer fetch:', fetchError)
      throw new Error('Erro ao comunicar com o serviço de troca de alimento')
    }

    // Ler resposta como texto primeiro
    const responseText = await response.text()
    console.log('Resposta recebida (texto):', responseText.substring(0, 300))
    
    if (!response.ok) {
      console.error('Erro do N8N:', response.status, responseText)
      throw new Error(`Erro do servidor: ${response.status}`)
    }

    // Parse da resposta
    let responseData
    
    try {
      // Tentar parsear como JSON diretamente
      responseData = JSON.parse(responseText)
      
      // Se o resultado for uma string, fazer parse novamente
      if (typeof responseData === 'string') {
        console.log('Resposta é uma string JSON, fazendo parse novamente...')
        responseData = JSON.parse(responseData)
      }
    } catch (parseError) {
      console.log('Erro no parse inicial, tentando extrair JSON:', parseError.message)
      // Se não conseguir parsear diretamente, tentar extrair JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0]
          responseData = JSON.parse(extractedJson)
          
          // Se ainda for string, parsear novamente
          if (typeof responseData === 'string') {
            responseData = JSON.parse(responseData)
          }
        } catch (e) {
          console.error('Erro ao parsear JSON extraído:', e)
          throw new Error('Resposta não é um JSON válido')
        }
      } else {
        throw new Error('Resposta não contém JSON válido')
      }
    }

    // Se a resposta vier dentro de um array (formato do N8N)
    if (Array.isArray(responseData) && responseData.length > 0) {
      responseData = responseData[0]
    }

    // Se a resposta tiver um campo 'output' ou similar
    if (responseData && responseData.output) {
      responseData = responseData.output
    }

    // Se a resposta for uma string JSON, tentar parsear novamente
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData)
      } catch (e) {
        console.error('Erro ao parsear string JSON:', e)
        throw new Error('Resposta é uma string JSON inválida')
      }
    }

    console.log('Resposta parseada:', JSON.stringify(responseData, null, 2))

    // Validar estrutura da resposta
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Resposta inválida: não é um objeto')
    }

    // Se tiver reasonBlocked, retornar como erro
    if (responseData.reasonBlocked) {
      return res.status(400).json({
        error: 'Troca bloqueada',
        reason: responseData.reasonBlocked,
        details: responseData
      })
    }

    // Se status for ok, retornar mesmo sem bestMatch (pode ter apenas suggestions)
    if (responseData.status === 'ok') {
      // Se não tiver bestMatch mas tiver suggestions e notes, é válido
      if (!responseData.bestMatch && responseData.suggestions && responseData.suggestions.length > 0) {
        console.log('Resposta válida sem bestMatch, mas com suggestions e notes')
        return res.json(responseData)
      }
      
      // Se tiver bestMatch, retornar normalmente
      if (responseData.bestMatch) {
        return res.json(responseData)
      }
    }

    // Se chegou aqui, a resposta não está no formato esperado
    console.error('Resposta não tem formato esperado:', responseData)
    throw new Error('Resposta inválida do servidor: formato não reconhecido')

  } catch (error) {
    console.error('Erro ao trocar alimento:', error)
    res.status(500).json({
      error: 'Erro ao trocar alimento',
      details: error.message
    })
  }
})

export default router


