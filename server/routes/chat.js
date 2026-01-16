import express from 'express'
import { authenticate } from '../middleware/auth.js'
import prisma from '../config/database.js'
import { normalizeQuestionnaireData } from '../utils/questionnaireNormalizer.js'

const router = express.Router()

// Função auxiliar para normalizar URLs de webhook (substitui webhook-test por webhook)
const normalizeWebhookUrl = (url) => {
  if (!url) return ''
  // Substituir webhook-test por webhook na URL
  return url.replace(/\/webhook-test\//g, '/webhook/')
}

// URL do webhook do N8N (configure no .env)
// A URL será normalizada para usar /webhook/ em vez de /webhook-test/
const N8N_WEBHOOK_URL = normalizeWebhookUrl(process.env.N8N_WEBHOOK_URL || '')
const N8N_API_KEY = process.env.N8N_API_KEY || ''

/**
 * Rota para enviar mensagem ao chat via N8N
 * POST /api/chat/message
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message } = req.body
    const userId = req.user.userId

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    if (!N8N_WEBHOOK_URL) {
      console.warn('⚠️  N8N_WEBHOOK_URL não configurado')
      return res.status(500).json({
        error: 'Serviço de chat não configurado',
        response: 'O chat ainda não está disponível. Entre em contato com o suporte.'
      })
    }

    console.log(`\n📤 ===== ENVIANDO MENSAGEM PARA N8N =====`)
    console.log(`   UserId: ${userId}`)
    console.log(`   Message: ${message.substring(0, 50)}...`)
    console.log(`   Webhook URL: ${N8N_WEBHOOK_URL}`)

    // Buscar dados do usuário (questionário e dieta) para contexto
    console.log(`   🔍 Buscando dados do usuário para contexto...`)
    let userContext = {
      questionnaire: null,
      diet: null
    }

    try {
      // Buscar dados do questionário
      const questionnaireData = await prisma.questionnaireData.findUnique({
        where: { userId }
      })

      if (questionnaireData) {
        // Normalizar dados do questionário
        const normalized = normalizeQuestionnaireData(questionnaireData)
        
        if (normalized) {
          // Usar estrutura clean com campos derivados
          userContext.questionnaire = {
            // Dados básicos
            idade: normalized.clean.idade,
            sexo: normalized.clean.sexo,
            altura: normalized.clean.altura,
            pesoAtual: normalized.clean.pesoAtual,
            objetivo: normalized.clean.objetivo,
            // Rotina e atividade
            rotinaDiaria: normalized.clean.rotinaDiaria,
            frequenciaAtividade: normalized.clean.frequenciaAtividade,
            tipoAtividade: normalized.clean.tipoAtividade || null,
            horarioTreino: normalized.clean.horarioTreino,
            // Alimentação
            quantidadeRefeicoes: normalized.clean.quantidadeRefeicoes,
            preferenciaRefeicoes: normalized.clean.preferenciaRefeicoes,
            alimentosGosta: normalized.clean.alimentosGosta || null,
            alimentosEvita: normalized.clean.alimentosEvita || null,
            restricaoAlimentar: normalized.clean.restricaoAlimentar,
            outraRestricao: normalized.clean.outraRestricao || null,
            // Campos derivados (booleanos explícitos)
            derived: normalized.derived
          }
          console.log(`   ✅ Dados do questionário normalizados e encontrados`)
        } else {
          console.warn(`   ⚠️  Erro ao normalizar dados do questionário`)
        }
      }

      // Buscar dados da dieta
      const dietaData = await prisma.dieta.findUnique({
        where: { userId }
      })

      if (dietaData && dietaData.dietaData) {
        try {
          userContext.diet = JSON.parse(dietaData.dietaData)
          console.log(`   ✅ Dados da dieta encontrados`)
        } catch (parseError) {
          console.warn(`   ⚠️  Erro ao parsear dieta: ${parseError.message}`)
        }
      }
    } catch (contextError) {
      console.warn(`   ⚠️  Erro ao buscar contexto do usuário: ${contextError.message}`)
      // Continua mesmo sem contexto
    }

    // Preparar payload para N8N no formato esperado
    // Formato: { message: { chat: { id }, text }, userContext: { ... } }
    const payload = {
      message: {
        chat: {
          id: userId
        },
        text: message.trim()
      },
      userContext: userContext
    }

    console.log(`   Payload completo:`)
    console.log(JSON.stringify(payload, null, 2))
    console.log(`   Payload size: ${JSON.stringify(payload).length} bytes`)

    // Headers para N8N
    const headers = {
      'Content-Type': 'application/json'
    }

    // Adicionar API key se configurada
    // Nota: Se N8N_API_KEY for uma URL OAuth, não enviar como header
    // A URL OAuth geralmente é usada para autenticação separada, não no header
    if (N8N_API_KEY && !N8N_API_KEY.startsWith('http')) {
      // Só adiciona header se não for uma URL
      headers['X-N8N-API-KEY'] = N8N_API_KEY
      console.log(`   🔑 Usando API Key no header`)
    } else if (N8N_API_KEY && N8N_API_KEY.startsWith('http')) {
      console.log(`   ℹ️  N8N_API_KEY é uma URL OAuth, não será enviada no header`)
      console.log(`   ℹ️  URL OAuth: ${N8N_API_KEY}`)
    }

    console.log(`   Headers:`, JSON.stringify(headers, null, 2))

    // Fazer requisição para N8N
    let response
    const requestStartTime = Date.now()
    
    try {
      console.log(`   🔄 Fazendo requisição POST...`)
      console.log(`   Headers enviados:`, JSON.stringify(headers, null, 2))
      
      response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        // Timeout de 30 segundos
        signal: AbortSignal.timeout(30000)
      })
      
      const requestDuration = Date.now() - requestStartTime
      console.log(`   ⏱️  Tempo de resposta: ${requestDuration}ms`)
      
    } catch (fetchError) {
      const requestDuration = Date.now() - requestStartTime
      console.error(`\n❌ ===== ERRO AO FAZER FETCH =====`)
      console.error(`   Tempo até erro: ${requestDuration}ms`)
      console.error(`   Tipo de erro: ${fetchError.name}`)
      console.error(`   Mensagem: ${fetchError.message}`)
      console.error(`   Stack: ${fetchError.stack}`)
      
      if (fetchError.name === 'TimeoutError') {
        throw new Error('Timeout ao comunicar com o serviço de chat. O servidor pode estar lento ou indisponível.')
      }
      if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique se a URL do webhook está correta e acessível.')
      }
      throw new Error(`Erro de conexão: ${fetchError.message}`)
    }

    console.log(`\n📥 ===== RESPOSTA DO N8N =====`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Headers recebidos:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na resposta do N8N:')
      console.error(`   Status: ${response.status} ${response.statusText}`)
      console.error(`   Body: ${errorText}`)
      
      // Mensagens mais específicas por código de erro
      let errorMessage = `Erro ao comunicar com o serviço de chat: ${response.status}`
      if (response.status === 502) {
        errorMessage = 'Servidor N8N indisponível ou com problemas. Verifique se o workflow está ativo e acessível.'
      } else if (response.status === 401) {
        errorMessage = 'Erro de autenticação. Verifique a configuração da API key.'
      } else if (response.status === 404) {
        errorMessage = 'Webhook não encontrado. Verifique se a URL está correta e o workflow está ativo.'
      } else if (response.status === 500) {
        errorMessage = 'Erro interno no servidor N8N. Verifique os logs do workflow.'
      }
      
      throw new Error(errorMessage)
    }

    let data = await response.json()
    
    // N8N pode retornar diferentes formatos, ajustar conforme necessário
    // Exemplo 1: { response: "..." }
    // Exemplo 2: [{ output: "..." }] - Array (quando usa "All Incoming Items")
    // Exemplo 3: { data: { response: "..." } }
    // Exemplo 4: resposta direta como string/objeto

    console.log('📋 Dados recebidos do N8N (formato completo):')
    console.log(JSON.stringify(data, null, 2))

    // Se for um array, pegar o primeiro item
    if (Array.isArray(data) && data.length > 0) {
      console.log('   ℹ️  Resposta é um array, pegando primeiro item')
      data = data[0]
    }

    let responseText = 'Desculpe, não consegui processar sua mensagem.'

    if (typeof data === 'string') {
      responseText = data
    } else if (data.response) {
      // Formato esperado: { response: "..." }
      responseText = data.response
    } else if (data.output) {
      // Formato direto do FINN: { output: "..." } ou [{ output: "..." }]
      responseText = typeof data.output === 'string' ? data.output : JSON.stringify(data.output)
    } else if (data.data?.response) {
      responseText = data.data.response
    } else if (data.body?.response) {
      responseText = data.body.response
    } else if (data.message) {
      responseText = data.message
    } else if (data.text) {
      responseText = data.text
    } else if (data.result) {
      responseText = typeof data.result === 'string' ? data.result : JSON.stringify(data.result)
    } else {
      // Tentar pegar qualquer campo de texto
      const possibleFields = ['content', 'answer', 'reply']
      for (const field of possibleFields) {
        if (data[field]) {
          responseText = typeof data[field] === 'string' ? data[field] : JSON.stringify(data[field])
          break
        }
      }
    }

    console.log('Resposta recebida do N8N:', responseText.substring(0, 100))

    res.json({
      response: responseText,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao processar mensagem do chat:', error)
    
    res.status(500).json({
      error: 'Erro ao processar mensagem',
      response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.'
    })
  }
})

/**
 * Rota para verificar status do chat (pública para testes)
 * GET /api/chat/status
 */
router.get('/status', async (req, res) => {
  try {
    const isConfigured = !!N8N_WEBHOOK_URL
    
    // Testar conectividade com o webhook
    let webhookReachable = false
    let webhookError = null
    
    if (isConfigured) {
      try {
        console.log(`🧪 Testando conectividade com N8N: ${N8N_WEBHOOK_URL}`)
        const testPayload = {
          message: {
            chat: { id: 'test-user-id' },
            text: 'test'
          }
        }
        console.log(`📤 Payload de teste:`, JSON.stringify(testPayload, null, 2))
        
        const testResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(10000)
        })
        
        webhookReachable = true
        const responseText = await testResponse.text()
        webhookError = `Status: ${testResponse.status} ${testResponse.statusText}`
        
        console.log(`📥 Resposta do teste:`)
        console.log(`   Status: ${testResponse.status} ${testResponse.statusText}`)
        console.log(`   Body: ${responseText.substring(0, 200)}`)
        
        if (testResponse.status === 502) {
          webhookError += ' - Workflow pode estar com erro ou não configurado corretamente'
          console.log(`   ⚠️  Erro 502: Verifique se o workflow tem um nó "Respond to Webhook" configurado`)
        }
      } catch (testError) {
        webhookReachable = false
        webhookError = testError.message
        console.error(`❌ Erro ao testar webhook:`, testError.message)
      }
    }
    
    res.json({
      available: isConfigured && webhookReachable,
      configured: isConfigured,
      webhookUrl: N8N_WEBHOOK_URL || null,
      webhookReachable: webhookReachable,
      webhookError: webhookError,
      hasApiKey: !!N8N_API_KEY
    })
  } catch (error) {
    console.error('Erro ao verificar status do chat:', error)
    res.status(500).json({ error: 'Erro ao verificar status' })
  }
})

export default router

