import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { requireActiveSubscription } from '../middleware/subscription.js'
import { z } from 'zod'

const router = express.Router()

// Aplicar verificação de assinatura em todas as rotas
router.use(authenticate)
router.use(requireActiveSubscription)

// Schema de validação
const consumedMealSchema = z.object({
  mealIndex: z.number().int().min(0),
  mealName: z.string().min(1),
  consumedDate: z.string().datetime().optional()
})

// POST /api/consumed-meals - Marcar refeição como consumida
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const validatedData = consumedMealSchema.parse(req.body)

    // Determinar a data do consumo (usar a data fornecida ou hoje)
    let consumedDate = new Date()
    if (validatedData.consumedDate) {
      consumedDate = new Date(validatedData.consumedDate)
    }
    // Normalizar para meia-noite (apenas data, sem hora)
    consumedDate.setHours(0, 0, 0, 0)

    // Verificar se já existe consumo para esta refeição nesta data
    const existingConsumption = await prisma.consumedMeal.findUnique({
      where: {
        userId_mealIndex_consumedDate: {
          userId,
          mealIndex: validatedData.mealIndex,
          consumedDate
        }
      }
    })

    if (existingConsumption) {
      return res.json({
        message: 'Refeição já estava marcada como consumida',
        consumedMeal: existingConsumption
      })
    }

    // Criar novo registro
    const consumedMeal = await prisma.consumedMeal.create({
      data: {
        userId,
        mealIndex: validatedData.mealIndex,
        mealName: validatedData.mealName,
        consumedDate
      }
    })

    res.json({
      message: 'Refeição marcada como consumida',
      consumedMeal
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao marcar refeição como consumida:', error)
    res.status(500).json({ error: 'Erro ao marcar refeição como consumida' })
  }
})

// DELETE /api/consumed-meals/:mealIndex - Desmarcar refeição como consumida
router.delete('/:mealIndex', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const mealIndex = parseInt(req.params.mealIndex)

    if (isNaN(mealIndex)) {
      return res.status(400).json({ error: 'Índice de refeição inválido' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Buscar e deletar o consumo
    const consumedMeal = await prisma.consumedMeal.findUnique({
      where: {
        userId_mealIndex_consumedDate: {
          userId,
          mealIndex,
          consumedDate: today
        }
      }
    })

    if (!consumedMeal) {
      return res.status(404).json({ error: 'Refeição não encontrada como consumida hoje' })
    }

    await prisma.consumedMeal.delete({
      where: { id: consumedMeal.id }
    })

    res.json({
      message: 'Refeição desmarcada como consumida'
    })
  } catch (error) {
    console.error('Erro ao desmarcar refeição:', error)
    res.status(500).json({ error: 'Erro ao desmarcar refeição' })
  }
})

// GET /api/consumed-meals/today - Buscar refeições consumidas hoje
router.get('/today', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const consumedMeals = await prisma.consumedMeal.findMany({
      where: {
        userId,
        consumedDate: today
      }
    })

    res.json({ consumedMeals })
  } catch (error) {
    console.error('Erro ao buscar refeições consumidas:', error)
    res.status(500).json({ error: 'Erro ao buscar refeições consumidas' })
  }
})

// GET /api/consumed-meals/stats - Estatísticas de consumo do dia
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Buscar refeições consumidas hoje
    const consumedMeals = await prisma.consumedMeal.findMany({
      where: {
        userId,
        consumedDate: today
      }
    })

    // Buscar dieta do usuário
    const dieta = await prisma.dieta.findUnique({
      where: { userId }
    })

    if (!dieta || !dieta.dietaData) {
      return res.json({
        consumedMeals: consumedMeals.map(c => c.mealIndex),
        totals: {
          consumedKcal: 0,
          consumedProtein: 0,
          consumedCarbs: 0,
          consumedFat: 0
        }
      })
    }

    // Parse da dieta - pode estar em diferentes estruturas
    let dietaDataParsed
    try {
      dietaDataParsed = JSON.parse(dieta.dietaData)
    } catch (e) {
      console.error('Erro ao parsear dietaData:', e)
      return res.json({
        consumedMeals: consumedMeals.map(c => c.mealIndex),
        totals: {
          consumedKcal: 0,
          consumedProtein: 0,
          consumedCarbs: 0,
          consumedFat: 0
        }
      })
    }
    
    // Detectar estrutura da dieta
    let refeicoes = []
    if (dietaDataParsed && dietaDataParsed.dieta && dietaDataParsed.dieta.refeicoes) {
      refeicoes = dietaDataParsed.dieta.refeicoes
    } else if (dietaDataParsed && dietaDataParsed.refeicoes) {
      refeicoes = dietaDataParsed.refeicoes
    }

    // Calcular totais consumidos
    let consumedKcal = 0
    let consumedProtein = 0
    let consumedCarbs = 0
    let consumedFat = 0

    // Função auxiliar para extrair peso em gramas de uma string de porção
    function extractPesoG(porcao) {
      if (typeof porcao === 'number') {
        return porcao
      }
      if (typeof porcao !== 'string' || !porcao) return 0
      
      const cleanedPorcao = porcao.toLowerCase().replace(',', '.')
      let match = cleanedPorcao.match(/(\d+(?:\.\d+)?)\s*g/)
      if (match) return parseFloat(match[1])
      
      match = cleanedPorcao.match(/(\d+(?:\.\d+)?)\s*ml/)
      if (match) return parseFloat(match[1])
      
      match = cleanedPorcao.match(/(\d+(?:\.\d+)?)/)
      if (match) return parseFloat(match[1])
      
      return 0
    }

    consumedMeals.forEach(consumed => {
      const meal = refeicoes[consumed.mealIndex]
      if (meal) {
        consumedKcal += meal.totalRefeicaoKcal || 0
        
        // Calcular macros da refeição baseado nos itens
        if (meal.itens && Array.isArray(meal.itens)) {
          meal.itens.forEach(item => {
            const itemKcal = item.kcal || 0
            const porcao = item.porcao || ''
            const pesoG = extractPesoG(porcao)
            
            // Tentar diferentes estruturas de dados nutricionais
            let itemProtein = 0
            let itemCarbs = 0
            let itemFat = 0
            
            // Opção 1: Novo formato com macros.proteina_g, macros.carbo_g, macros.gordura_g
            if (item.macros && typeof item.macros === 'object') {
              itemProtein = item.macros.proteina_g || item.macros.proteina || 0
              itemCarbs = item.macros.carbo_g || item.macros.carboidrato || item.macros.carbo || 0
              itemFat = item.macros.gordura_g || item.macros.gordura || 0
            }
            // Opção 2: _alimentoData com valores por 100g
            else if (item._alimentoData) {
              const fator = pesoG / 100 // Converter para gramas do item
              itemProtein = (item._alimentoData.proteina || 0) * fator
              itemCarbs = (item._alimentoData.carboidrato || 0) * fator
              itemFat = (item._alimentoData.lipideos || item._alimentoData.gordura || 0) * fator
            }
            // Opção 3: macros diretos no item (formato antigo)
            else if (item.proteina !== undefined || item.carboidrato !== undefined || item.gordura !== undefined) {
              itemProtein = item.proteina || 0
              itemCarbs = item.carboidrato || 0
              itemFat = item.gordura || item.lipideos || 0
            }
            // Opção 4: calcular proporcionalmente baseado nas kcal (aproximação)
            else if (itemKcal > 0 && pesoG > 0) {
              // Aproximação: usar proporções médias típicas
              // Isso é uma estimativa, não ideal mas melhor que zero
              // Proteína: ~4 kcal/g, Carboidrato: ~4 kcal/g, Gordura: ~9 kcal/g
              // Distribuição típica: 30% proteína, 40% carboidrato, 30% gordura (em kcal)
              const kcalProtein = itemKcal * 0.30
              const kcalCarbs = itemKcal * 0.40
              const kcalFat = itemKcal * 0.30
              
              itemProtein = kcalProtein / 4
              itemCarbs = kcalCarbs / 4
              itemFat = kcalFat / 9
            }
            
            consumedProtein += itemProtein
            consumedCarbs += itemCarbs
            consumedFat += itemFat
          })
        }
      }
    })

    // Incluir refeições por foto
    const photoMeals = await prisma.photoMeal.findMany({
      where: {
        userId,
        consumedDate: today
      }
    })

    photoMeals.forEach(photoMeal => {
      consumedKcal += photoMeal.totalKcal || 0
      consumedProtein += photoMeal.totalProtein || 0
      consumedCarbs += photoMeal.totalCarbs || 0
      consumedFat += photoMeal.totalFat || 0
    })

    res.json({
      consumedMeals: consumedMeals.map(c => c.mealIndex),
      totals: {
        consumedKcal: Math.round(consumedKcal),
        consumedProtein: Math.round(consumedProtein * 10) / 10,
        consumedCarbs: Math.round(consumedCarbs * 10) / 10,
        consumedFat: Math.round(consumedFat * 10) / 10
      }
    })
  } catch (error) {
    console.error('Erro ao calcular estatísticas de consumo:', error)
    res.status(500).json({ error: 'Erro ao calcular estatísticas de consumo' })
  }
})

export default router

