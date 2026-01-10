import express from 'express'
import AbacatePayModule from 'abacatepay-nodejs-sdk'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { z } from 'zod'

const router = express.Router()

// Inicializar AbacatePay
// O SDK pode exportar como default ou como propriedade default
const AbacatePay = AbacatePayModule.default || AbacatePayModule

// Verificar se AbacatePay é uma função
if (typeof AbacatePay !== 'function') {
  console.error('AbacatePay não é uma função. Tipo:', typeof AbacatePay)
  console.error('AbacatePayModule:', AbacatePayModule)
}

const abacate = process.env.ABACATEPAY_API_KEY 
  ? AbacatePay(process.env.ABACATEPAY_API_KEY) 
  : null

if (!abacate && process.env.ABACATEPAY_API_KEY) {
  console.error('Falha ao inicializar AbacatePay com a chave fornecida')
}

// Schema de validação para criar cobrança (com autenticação)
const createBillingSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  method: z.enum(['PIX', 'CREDIT_CARD']).optional().default('PIX')
})

// Schema para checkout público (sem autenticação)
const createPublicBillingSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  method: z.enum(['PIX', 'CREDIT_CARD']).optional().default('PIX'),
  email: z.string().email('Email inválido')
})

// Criar cobrança no AbacatePay
router.post('/create-billing', authenticate, async (req, res) => {
  try {
    // Verificar se AbacatePay está configurado
    if (!process.env.ABACATEPAY_API_KEY) {
      return res.status(503).json({ 
        error: 'AbacatePay não está configurado',
        message: 'O sistema de pagamento não está disponível no momento. Use o teste grátis.'
      })
    }

    const validatedData = createBillingSchema.parse(req.body)
    const userId = req.user.userId

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Definir valores e planos
    const plans = {
      monthly: {
        name: 'Plano Mensal - LifeFit',
        price: 4900, // R$ 49,00 em centavos
        externalId: 'PLAN_MONTHLY',
        plan: 'MONTHLY'
      },
      yearly: {
        name: 'Plano Anual - LifeFit',
        price: 46800, // R$ 468,00 em centavos (R$ 39/mês x 12)
        externalId: 'PLAN_YEARLY',
        plan: 'YEARLY'
      }
    }

    const selectedPlan = plans[validatedData.plan]
    const paymentMethod = validatedData.method || 'PIX'

    // URLs de retorno
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const returnUrl = `${baseUrl}/billing/success`
    const completionUrl = `${baseUrl}/billing/success`

    // Criar cobrança no AbacatePay
    // O SDK pode usar billing.create ou payments.create dependendo da versão
    let billing
    try {
      // Tentar billing.create primeiro (método mais recente)
      if (typeof abacate.billing?.create === 'function') {
        billing = await abacate.billing.create({
          frequency: 'ONE_TIME',
          methods: [paymentMethod],
          products: [
            {
              externalId: selectedPlan.externalId,
              name: selectedPlan.name,
              quantity: 1,
              price: selectedPlan.price
            }
          ],
          returnUrl,
          completionUrl,
          customer: {
            email: user.email,
            name: user.name || undefined,
            externalId: user.id
          },
          metadata: {
            userId: user.id,
            plan: selectedPlan.plan
          }
        })
      } else if (typeof abacate.payments?.create === 'function') {
        // Fallback para payments.create
        billing = await abacate.payments.create({
          amount: selectedPlan.price,
          currency: 'BRL',
          payment_method: paymentMethod.toLowerCase(),
          description: selectedPlan.name,
          customer: {
            name: user.name || user.email,
            email: user.email,
            external_id: user.id
          },
          metadata: {
            userId: user.id,
            plan: selectedPlan.plan
          },
          return_url: returnUrl,
          completion_url: completionUrl
        })
      } else {
        throw new Error('Método de criação de cobrança não encontrado no SDK')
      }
    } catch (sdkError) {
      console.error('Erro ao criar cobrança com SDK:', sdkError)
      throw new Error(`Erro ao criar cobrança: ${sdkError.message}`)
    }

    // Salvar referência da cobrança no banco (opcional, para rastreamento)
    if (user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          externalSubscriptionId: billing.id, // ID da cobrança do AbacatePay
          metadata: JSON.stringify({
            billingId: billing.id,
            plan: selectedPlan.plan,
            method: paymentMethod
          })
        }
      })
    }

    // A resposta pode ter 'url' ou 'payment_url' dependendo do método usado
    const paymentUrl = billing.url || billing.payment_url || billing.checkout_url
    
    if (!paymentUrl) {
      throw new Error('URL de pagamento não retornada pelo AbacatePay')
    }

    res.json({ 
      url: paymentUrl,
      billingId: billing.id || billing.payment_id
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors 
      })
    }

    console.error('Erro ao criar cobrança:', error)
    res.status(500).json({ 
      error: 'Erro ao criar cobrança',
      message: error.message 
    })
  }
})

// Criar cobrança pública (sem autenticação - para landing page)
router.post('/create-billing-public', async (req, res) => {
  try {
    console.log('=== INÍCIO DA REQUISIÇÃO create-billing-public ===')
    console.log('Body recebido:', req.body)
    
    // Verificar se AbacatePay está configurado
    if (!process.env.ABACATEPAY_API_KEY) {
      console.error('ABACATEPAY_API_KEY não configurada no .env')
      return res.status(503).json({ 
        error: 'AbacatePay não está configurado',
        message: 'O sistema de pagamento não está disponível no momento. Use o teste grátis.'
      })
    }
    
    console.log('ABACATEPAY_API_KEY configurada:', process.env.ABACATEPAY_API_KEY ? 'Sim (ocultada)' : 'Não')
    console.log('abacate inicializado:', abacate ? 'Sim' : 'Não')

    console.log('Recebida requisição de cobrança pública:', req.body)
    
    const validatedData = createPublicBillingSchema.parse(req.body)
    console.log('Dados validados:', validatedData)
    const { plan, method, email } = validatedData

    // Verificar se já existe usuário com esse email
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true }
    })

    // Se não existir, vamos criar depois do pagamento (via webhook)
    // Por enquanto, apenas criar a cobrança

    // Definir valores e planos
    const plans = {
      monthly: {
        name: 'Plano Mensal - LifeFit',
        price: 4900,
        externalId: 'PLAN_MONTHLY',
        plan: 'MONTHLY'
      },
      yearly: {
        name: 'Plano Anual - LifeFit',
        price: 46800,
        externalId: 'PLAN_YEARLY',
        plan: 'YEARLY'
      }
    }

    const selectedPlan = plans[plan]
    const paymentMethod = method || 'PIX'

    // URLs de retorno
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const returnUrl = `${baseUrl}/billing/success?email=${encodeURIComponent(email)}`
    const completionUrl = `${baseUrl}/billing/success?email=${encodeURIComponent(email)}`

    // Verificar se AbacatePay foi inicializado
    if (!abacate) {
      throw new Error('AbacatePay não foi inicializado corretamente')
    }

    // Criar cobrança no AbacatePay
    console.log('Verificando métodos disponíveis no SDK...')
    console.log('abacate.billing:', typeof abacate?.billing)
    console.log('abacate keys:', abacate ? Object.keys(abacate) : 'abacate é null')
    
    if (!abacate?.billing?.create) {
      console.error('abacate.billing.create não está disponível')
      throw new Error('SDK do AbacatePay não foi inicializado corretamente')
    }
    
    let billing
    try {
      console.log('Criando cobrança com os seguintes dados:')
      const billingData = {
        frequency: 'ONE_TIME',
        methods: [paymentMethod],
        products: [
          {
            externalId: selectedPlan.externalId,
            name: selectedPlan.name,
            quantity: 1,
            price: selectedPlan.price
          }
        ],
        returnUrl,
        completionUrl,
        customer: {
          email: email.toLowerCase(),
          name: user?.name || undefined,
          externalId: user?.id || undefined
        },
        metadata: {
          email: email.toLowerCase(),
          plan: selectedPlan.plan,
          userId: user?.id || null
        }
      }
      console.log('Dados da cobrança:', JSON.stringify(billingData, null, 2))
      
      billing = await abacate.billing.create(billingData)
      console.log('Resposta do AbacatePay:', JSON.stringify(billing, null, 2))
    } catch (sdkError) {
      console.error('Erro ao criar cobrança com SDK:')
      console.error('Mensagem:', sdkError.message)
      console.error('Stack:', sdkError.stack)
      console.error('Erro completo:', sdkError)
      
      // Se o erro tiver uma resposta da API, logar também
      if (sdkError.response) {
        console.error('Resposta da API:', sdkError.response)
      }
      
      throw new Error(`Erro ao criar cobrança: ${sdkError.message || 'Erro desconhecido'}`)
    }
    
    console.log('Cobrança criada com sucesso:', billing)

    const paymentUrl = billing.url || billing.payment_url || billing.checkout_url
    
    if (!paymentUrl) {
      throw new Error('URL de pagamento não retornada pelo AbacatePay')
    }

    res.json({ 
      url: paymentUrl,
      billingId: billing.id || billing.payment_id
    })
  } catch (error) {
    console.error('=== ERRO NA ROTA PÚBLICA create-billing-public ===')
    console.error('Tipo:', error.constructor.name)
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    
    if (error instanceof z.ZodError) {
      console.error('Erro de validação Zod:', error.errors)
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors 
      })
    }

    // Log adicional para erros do SDK
    if (error.response) {
      console.error('Resposta do erro:', error.response)
    }
    if (error.data) {
      console.error('Dados do erro:', error.data)
    }
    if (error.body) {
      console.error('Body do erro:', error.body)
    }

    console.error('=== FIM DO ERRO ===')
    
    res.status(500).json({ 
      error: 'Erro ao criar cobrança',
      message: error.message || 'Erro desconhecido',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
  }
})

// Webhook do AbacatePay (deve ser chamado sem autenticação)
export const handleAbacatePayWebhook = async (req, res) => {
  try {
    // Verificar se AbacatePay está configurado
    if (!process.env.ABACATEPAY_API_KEY) {
      return res.status(500).json({ error: 'AbacatePay não configurado' })
    }

    // O AbacatePay envia eventos via webhook
    // Verificar a documentação para o formato exato do payload
    const event = req.body

    // Verificar assinatura do webhook (se disponível)
    // const signature = req.headers['x-abacatepay-signature']
    // if (!verifySignature(event, signature)) {
    //   return res.status(401).json({ error: 'Assinatura inválida' })
    // }

    switch (event.type) {
      case 'billing.paid':
      case 'billing.completed':
      case 'payment.paid':
      case 'payment.completed': {
        const billingId = event.data?.id || event.billing?.id || event.payment?.id || event.id
        if (!billingId) {
          console.error('ID da cobrança não encontrado no evento')
          break
        }

        // Buscar detalhes da cobrança (tentar ambos os métodos)
        let billing
        try {
          if (typeof abacate.billing?.get === 'function') {
            billing = await abacate.billing.get(billingId)
          } else if (typeof abacate.payments?.get === 'function') {
            billing = await abacate.payments.get(billingId)
          } else {
            // Se não conseguir buscar, usar dados do evento
            billing = event.data || event.billing || event.payment || event
          }
        } catch (getError) {
          console.error('Erro ao buscar detalhes da cobrança:', getError)
          // Usar dados do evento como fallback
          billing = event.data || event.billing || event.payment || event
        }
        
        const userId = billing.metadata?.userId || 
                       billing.customer?.externalId || 
                       billing.customer?.external_id ||
                       event.metadata?.userId
        if (!userId) {
          console.error('userId não encontrado no metadata da cobrança')
          break
        }

        const plan = billing.metadata?.plan || event.metadata?.plan || 'MONTHLY'
        const pricePaidCents = billing.amount || event.amount || 0

        // Calcular datas
        const now = new Date()
        let endDate = null

        if (plan === 'YEARLY') {
          endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        } else {
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        }

        // Atualizar ou criar assinatura no banco
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status: 'ACTIVE',
            startDate: now,
            endDate,
            paymentProvider: 'ABACATEPAY',
            externalSubscriptionId: billingId,
            pricePaidCents,
            currency: 'BRL'
          },
          update: {
            plan,
            status: 'ACTIVE',
            startDate: now,
            endDate,
            paymentProvider: 'ABACATEPAY',
            externalSubscriptionId: billingId,
            pricePaidCents,
            currency: 'BRL',
            cancelledAt: null,
            cancelReason: null
          }
        })

        console.log(`✅ Assinatura ativada para usuário ${userId}`)
        break
      }

      case 'billing.cancelled':
      case 'billing.refunded': {
        const billingId = event.data?.id || event.billing?.id
        if (!billingId) break

        const subscription = await prisma.subscription.findFirst({
          where: { externalSubscriptionId: billingId }
        })

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancelReason: 'Cancelado via AbacatePay'
            }
          })

          console.log(`✅ Assinatura cancelada: ${subscription.id}`)
        }
        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    res.status(500).json({ error: 'Erro ao processar webhook' })
  }
}

// Rota do webhook (também disponível como rota normal)
router.post('/abacatepay-webhook', express.json(), handleAbacatePayWebhook)

// Obter status da cobrança
router.get('/billing-status/:billingId', authenticate, async (req, res) => {
  try {
    if (!process.env.ABACATEPAY_API_KEY) {
      return res.status(503).json({ error: 'AbacatePay não configurado' })
    }

    const { billingId } = req.params
    const billing = await abacate.billing.get(billingId)

    res.json({
      status: billing.status,
      paid: billing.status === 'paid' || billing.status === 'completed',
      amount: billing.amount,
      method: billing.method
    })
  } catch (error) {
    console.error('Erro ao buscar status da cobrança:', error)
    res.status(500).json({ error: 'Erro ao buscar status da cobrança' })
  }
})

export default router
