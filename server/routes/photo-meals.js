import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { requireActiveSubscription } from '../middleware/subscription.js'
import { z } from 'zod'
import OpenAI from 'openai'

const router = express.Router()

// Aplicar verificação de assinatura em todas as rotas
router.use(authenticate)
router.use(requireActiveSubscription)

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Schema de validação
const analyzePhotoSchema = z.object({
  photoBase64: z.string().min(1, 'Foto é obrigatória'),
  mealName: z.string().optional()
})

// POST /api/photo-meals/analyze - Analisar foto e identificar alimentos
router.post('/analyze', async (req, res) => {
  try {
    const userId = req.user.userId
    const validatedData = analyzePhotoSchema.parse(req.body)
    
    const { photoBase64, mealName } = validatedData
    
    // Validar formato base64
    if (!photoBase64.startsWith('data:image/')) {
      return res.status(400).json({ 
        error: 'Formato de imagem inválido. Use base64 com prefixo data:image/' 
      })
    }
    
    // Extrair apenas a parte base64 (remover data:image/...;base64,)
    const base64Data = photoBase64.includes(',') 
      ? photoBase64.split(',')[1] 
      : photoBase64
    
    console.log('📸 Analisando foto de alimento...')
    
    // Prompt para OpenAI Vision API
    const prompt = `Você é um especialista em nutrição. Analise esta foto e:

1. PRIMEIRO: Verifique se a foto mostra um PRATO DE COMIDA. 
   - Se NÃO for um prato de comida (ex: pessoa, animal, objeto, paisagem, etc.), responda APENAS: "NOT_FOOD: Esta foto não mostra um prato de comida. Por favor, tire uma foto do seu prato de comida."
   - Se for um prato de comida, continue.

2. Se for comida, identifique TODOS os alimentos visíveis no prato.

3. Para cada alimento, estime:
   - Nome do alimento (em português)
   - Quantidade aproximada (em gramas ou unidades)
   - Calorias totais
   - Proteína (em gramas)
   - Carboidrato (em gramas)
   - Gordura (em gramas)

4. Retorne APENAS um JSON válido no seguinte formato:
{
  "isFood": true,
  "alimentos": [
    {
      "nome": "Arroz branco",
      "quantidade": "150g",
      "quantidadeGramas": 150,
      "kcal": 195,
      "proteina": 4.5,
      "carboidrato": 45,
      "gordura": 0.3
    }
  ],
  "totalKcal": 195,
  "totalProtein": 4.5,
  "totalCarbs": 45,
  "totalFat": 0.3
}

Se NÃO for comida, retorne:
{
  "isFood": false,
  "error": "Esta foto não mostra um prato de comida. Por favor, tire uma foto do seu prato de comida."
}

IMPORTANTE: 
- Seja preciso nas estimativas de quantidade
- Use valores nutricionais realistas
- Retorne APENAS JSON válido, sem texto adicional
- Se a foto não mostrar comida claramente, retorne isFood: false`
    
    // Chamar OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: photoBase64
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
    
    const analysisText = response.choices[0].message.content.trim()
    console.log('🤖 Resposta da IA:', analysisText.substring(0, 200))
    
    // Tentar extrair JSON da resposta
    let analysis
    try {
      // Remover markdown code blocks se existirem
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        analysis = JSON.parse(analysisText)
      }
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError)
      return res.status(500).json({ 
        error: 'Erro ao processar análise da foto. Tente novamente.' 
      })
    }
    
    // Verificar se é comida
    if (!analysis.isFood) {
      return res.status(400).json({ 
        error: analysis.error || 'Esta foto não mostra um prato de comida. Por favor, tire uma foto do seu prato de comida.' 
      })
    }
    
    // Validar estrutura dos dados
    if (!analysis.alimentos || !Array.isArray(analysis.alimentos) || analysis.alimentos.length === 0) {
      return res.status(400).json({ 
        error: 'Não foi possível identificar alimentos na foto. Tente novamente com uma foto mais clara.' 
      })
    }
    
    // Calcular totais se não vierem na resposta
    const totalKcal = analysis.totalKcal || analysis.alimentos.reduce((sum, a) => sum + (a.kcal || 0), 0)
    const totalProtein = analysis.totalProtein || analysis.alimentos.reduce((sum, a) => sum + (a.proteina || 0), 0)
    const totalCarbs = analysis.totalCarbs || analysis.alimentos.reduce((sum, a) => sum + (a.carboidrato || 0), 0)
    const totalFat = analysis.totalFat || analysis.alimentos.reduce((sum, a) => sum + (a.gordura || 0), 0)
    
    // Normalizar data para meia-noite
    const consumedDate = new Date()
    consumedDate.setHours(0, 0, 0, 0)
    
    // Salvar no banco
    const photoMeal = await prisma.photoMeal.create({
      data: {
        userId,
        photoUrl: photoBase64,
        alimentos: JSON.stringify(analysis.alimentos),
        totalKcal: Math.round(totalKcal * 10) / 10,
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        consumedDate,
        mealName: mealName || null
      }
    })
    
    console.log('✅ Refeição por foto salva:', photoMeal.id)
    
    res.json({
      success: true,
      photoMeal: {
        ...photoMeal,
        alimentos: JSON.parse(photoMeal.alimentos)
      },
      analysis: {
        alimentos: analysis.alimentos,
        totalKcal: Math.round(totalKcal),
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    
    if (error.message && error.message.includes('NOT_FOOD')) {
      return res.status(400).json({ 
        error: 'Esta foto não mostra um prato de comida. Por favor, tire uma foto do seu prato de comida.' 
      })
    }
    
    console.error('Erro ao analisar foto:', error)
    res.status(500).json({ 
      error: 'Erro ao analisar foto. Tente novamente.' 
    })
  }
})

// GET /api/photo-meals/today - Buscar refeições por foto de hoje
router.get('/today', async (req, res) => {
  try {
    const userId = req.user.userId
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const photoMeals = await prisma.photoMeal.findMany({
      where: {
        userId,
        consumedDate: today
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Parse dos alimentos
    const photoMealsWithParsed = photoMeals.map(pm => ({
      ...pm,
      alimentos: JSON.parse(pm.alimentos)
    }))
    
    res.json({ photoMeals: photoMealsWithParsed })
  } catch (error) {
    console.error('Erro ao buscar refeições por foto:', error)
    res.status(500).json({ error: 'Erro ao buscar refeições por foto' })
  }
})

// DELETE /api/photo-meals/:id - Deletar refeição por foto
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    const photoMeal = await prisma.photoMeal.findFirst({
      where: {
        id,
        userId
      }
    })
    
    if (!photoMeal) {
      return res.status(404).json({ error: 'Refeição não encontrada' })
    }
    
    await prisma.photoMeal.delete({
      where: { id }
    })
    
    res.json({ message: 'Refeição removida com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar refeição por foto:', error)
    res.status(500).json({ error: 'Erro ao deletar refeição' })
  }
})

export default router
