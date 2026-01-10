import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import subscriptionRoutes from './routes/subscription.js'
import questionnaireRoutes from './routes/questionnaire.js'
import dietRoutes from './routes/diet.js'
import chatRoutes from './routes/chat.js'
import nutricionistaRoutes from './routes/nutricionista.js'
import nutricionistaAIRoutes from './routes/nutricionista-ai.js'
import alimentosRoutes from './routes/alimentos.js'
import userRoutes from './routes/user.js'
import checkInRoutes from './routes/checkin.js'
import consumedMealsRoutes from './routes/consumed-meals.js'
import mealsRoutes from './routes/meals.js'
import exerciciosRoutes from './routes/exercicios.js'
import divisoesTreinoRoutes from './routes/divisoes-treino.js'
import prescricoesTreinoRoutes from './routes/prescricoes-treino.js'
import treinosExecutadosRoutes from './routes/treinos-executados.js'
import solicitacoesMudancaRoutes from './routes/solicitacoes-mudanca.js'
import personalRoutes from './routes/personal.js'
import adminRoutes from './routes/admin.js'
import brandingRoutes from './routes/branding.js'
import notificationsRoutes from './routes/notifications.js'
import dietTemplatesRoutes from './routes/diet-templates.js'
import bodyMeasurementsRoutes from './routes/body-measurements.js'
import recipesRoutes from './routes/recipes.js'
import groupsRoutes from './routes/groups.js'
import placesRoutes from './routes/places.js'
import billingRoutes, { handleAbacatePayWebhook } from './routes/billing.js'
import checkoutExternalRoutes from './routes/checkout-external.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// ===== SEGURANÇA =====

// Helmet - Headers de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Desabilitar CSP para permitir inline scripts do Vite em dev
}))

// Rate Limiting - Prevenir ataques DDoS e brute force
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Limite de 500 requests por IP por janela
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de 10 tentativas de login por IP
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Aplicar rate limit geral
app.use(generalLimiter)

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [FRONTEND_URL, /\.seudominio\.com$/] 
    : true, // Em dev, aceita qualquer origem
  credentials: true
}))

// Webhook do AbacatePay (pode vir antes ou depois do body parser, dependendo do formato)
app.post('/api/billing/abacatepay-webhook', express.json(), handleAbacatePayWebhook)

// Rota de health check (útil para testar ngrok)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LifeFit API está rodando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API Health Check',
    timestamp: new Date().toISOString()
  })
})

// Body parsers - Aumentar limite para suportar fotos em base64
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// Rotas
app.use('/api/auth', authLimiter, authRoutes) // Rate limit específico para auth
app.use('/api/subscription', subscriptionRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/checkout-external', checkoutExternalRoutes)
app.use('/api/questionnaire', questionnaireRoutes)
app.use('/api/diet', dietRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/nutricionista', nutricionistaRoutes)
app.use('/api/nutricionista/ai', nutricionistaAIRoutes)
app.use('/api/nutricionista/alimentos', alimentosRoutes)
app.use('/api/user', userRoutes)
app.use('/api/checkin', checkInRoutes)
app.use('/api/consumed-meals', consumedMealsRoutes)
app.use('/api/meals', mealsRoutes)
app.use('/api/exercicios', exerciciosRoutes)
app.use('/api/divisoes-treino', divisoesTreinoRoutes)
app.use('/api/prescricoes-treino', prescricoesTreinoRoutes)
app.use('/api/treinos-executados', treinosExecutadosRoutes)
app.use('/api/solicitacoes-mudanca', solicitacoesMudancaRoutes)
app.use('/api/personal', personalRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/branding', brandingRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/diet-templates', dietTemplatesRoutes)
app.use('/api/body-measurements', bodyMeasurementsRoutes)
app.use('/api/recipes', recipesRoutes)
app.use('/api/groups', groupsRoutes)
app.use('/api/places', placesRoutes)

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ message: 'Servidor funcionando!', timestamp: new Date().toISOString() })
})

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
  console.log(`📡 Frontend configurado para: ${FRONTEND_URL}`)
})

