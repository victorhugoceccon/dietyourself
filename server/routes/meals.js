import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { z } from 'zod'

const router = express.Router()

// Schema para marcar/desmarcar refeição consumida
const toggleMealSchema = z.object({
  mealIndex: z.number().int().min(0)
})

// POST /api/meals/toggle - Marcar/desmarcar refeição como consumida
router.post('/toggle', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const validatedData = toggleMealSchema.parse(req.body)
    const { mealIndex } = validatedData

    // Obter data de hoje (normalizada para meia-noite)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Buscar ou criar check-in de hoje
    let checkIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_checkInDate: {
          userId,
          checkInDate: today
        }
      }
    })

    // Parse das refeições consumidas
    let refeicoesConsumidas = []
    if (checkIn && checkIn.refeicoesConsumidas) {
      try {
        refeicoesConsumidas = JSON.parse(checkIn.refeicoesConsumidas)
      } catch (e) {
        refeicoesConsumidas = []
      }
    }

    // Toggle: se já está marcada, remove; se não está, adiciona
    const index = refeicoesConsumidas.indexOf(mealIndex)
    if (index > -1) {
      refeicoesConsumidas.splice(index, 1)
    } else {
      refeicoesConsumidas.push(mealIndex)
      // Ordenar para manter consistência
      refeicoesConsumidas.sort((a, b) => a - b)
    }

    // Atualizar ou criar check-in
    if (checkIn) {
      checkIn = await prisma.dailyCheckIn.update({
        where: { id: checkIn.id },
        data: {
          refeicoesConsumidas: JSON.stringify(refeicoesConsumidas)
        }
      })
    } else {
      checkIn = await prisma.dailyCheckIn.create({
        data: {
          userId,
          adherence: 'PARCIAL', // Default ao criar via toggle de refeição
          checkInDate: today,
          refeicoesConsumidas: JSON.stringify(refeicoesConsumidas)
        }
      })
    }

    // Parse de volta para retornar
    try {
      checkIn.refeicoesConsumidas = JSON.parse(checkIn.refeicoesConsumidas || '[]')
    } catch (e) {
      checkIn.refeicoesConsumidas = []
    }

    res.json({
      message: 'Refeição atualizada com sucesso',
      checkIn
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao atualizar refeição consumida:', error)
    res.status(500).json({ error: 'Erro ao atualizar refeição consumida' })
  }
})

// GET /api/meals/consumed-today - Buscar refeições consumidas hoje
router.get('/consumed-today', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_checkInDate: {
          userId,
          checkInDate: today
        }
      }
    })

    let refeicoesConsumidas = []
    if (checkIn && checkIn.refeicoesConsumidas) {
      try {
        refeicoesConsumidas = JSON.parse(checkIn.refeicoesConsumidas)
      } catch (e) {
        refeicoesConsumidas = []
      }
    }

    res.json({ refeicoesConsumidas })
  } catch (error) {
    console.error('Erro ao buscar refeições consumidas:', error)
    res.status(500).json({ error: 'Erro ao buscar refeições consumidas' })
  }
})

export default router

