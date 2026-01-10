import express from 'express'
import prisma from '../config/database.js'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const router = express.Router()

// Schema para validar dados do webhook
const webhookSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  plan: z.enum(['MONTHLY', 'YEARLY']),
  transactionId: z.string(),
  amount: z.number(),
  status: z.enum(['paid', 'completed', 'approved']),
  paymentMethod: z.string().optional(),
  customerData: z.record(z.any()).optional()
})

// Webhook para receber confirmação de pagamento externo
router.post('/webhook', express.json(), async (req, res) => {
  try {
    console.log('=== WEBHOOK DE CHECKOUT EXTERNO RECEBIDO ===')
    console.log('Body:', JSON.stringify(req.body, null, 2))
    console.log('Headers:', req.headers)

    // Validar dados do webhook
    const data = webhookSchema.parse(req.body)

    // Verificar se já existe usuário com esse email
    let user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { subscription: true }
    })

    // Se não existir, criar usuário
    if (!user) {
      console.log('Criando novo usuário para:', data.email)
      
      // Gerar senha aleatória
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
      const hashedPassword = await bcrypt.hash(randomPassword, 10)

      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          name: data.name || data.email.split('@')[0],
          password: hashedPassword,
          role: 'PACIENTE'
        }
      })

      console.log('Usuário criado:', user.id)
      
      // TODO: Enviar email com senha temporária (opcional)
      // await sendWelcomeEmail(user.email, randomPassword)
    }

    // Calcular datas da assinatura
    const now = new Date()
    let endDate = null

    if (data.plan === 'YEARLY') {
      endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    } else {
      endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    // Criar ou atualizar assinatura
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: data.plan,
        status: 'ACTIVE',
        startDate: now,
        endDate,
        paymentProvider: 'EXTERNAL',
        externalSubscriptionId: data.transactionId,
        pricePaidCents: data.amount,
        currency: 'BRL',
        metadata: JSON.stringify({
          paymentMethod: data.paymentMethod,
          customerData: data.customerData
        })
      },
      update: {
        plan: data.plan,
        status: 'ACTIVE',
        startDate: now,
        endDate,
        paymentProvider: 'EXTERNAL',
        externalSubscriptionId: data.transactionId,
        pricePaidCents: data.amount,
        currency: 'BRL',
        cancelledAt: null,
        cancelReason: null,
        metadata: JSON.stringify({
          paymentMethod: data.paymentMethod,
          customerData: data.customerData
        })
      }
    })

    console.log('✅ Assinatura ativada para usuário:', user.id)

    res.json({ 
      success: true,
      message: 'Usuário e assinatura criados/atualizados com sucesso',
      userId: user.id
    })
  } catch (error) {
    console.error('=== ERRO NO WEBHOOK ===')
    console.error('Tipo:', error.constructor.name)
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    
    if (error instanceof z.ZodError) {
      console.error('Erro de validação:', error.errors)
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors 
      })
    }

    // Sempre retornar 200 para o webhook não ser reenviado
    // (mas logar o erro para investigação)
    res.status(200).json({ 
      success: false,
      error: 'Erro ao processar webhook',
      message: error.message 
    })
  }
})

// Rota para obter link de checkout (opcional - pode ser hardcoded na landing)
router.get('/checkout-url', (req, res) => {
  const checkoutUrl = process.env.EXTERNAL_CHECKOUT_URL
  
  if (!checkoutUrl) {
    return res.status(503).json({ 
      error: 'Checkout externo não configurado',
      message: 'Configure EXTERNAL_CHECKOUT_URL no .env'
    })
  }

  res.json({ url: checkoutUrl })
})

export default router
