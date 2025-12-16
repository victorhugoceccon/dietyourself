import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Middlewares
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}))
// Aumentar limite para suportar fotos em base64 (padrão é 100KB, aumentamos para 5MB)
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// Rotas
app.use('/api/auth', authRoutes)
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

