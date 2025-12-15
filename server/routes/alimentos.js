import express from 'express'
import { z } from 'zod'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Schema de validação para criar alimento
const createAlimentoSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  categoria: z.string().optional(),
  energiaKcal: z.number().min(0, 'Energia kcal deve ser >= 0'),
  proteina: z.number().min(0, 'Proteína deve ser >= 0'),
  lipideos: z.number().min(0, 'Lipídios devem ser >= 0'),
  carboidrato: z.number().min(0, 'Carboidrato deve ser >= 0'),
  umidade: z.number().optional(),
  energiaKj: z.number().optional(),
  colesterol: z.number().optional(),
  fibraAlimentar: z.number().optional(),
  cinzas: z.number().optional()
})

// GET /api/nutricionista/alimentos - Listar alimentos
router.get('/', authenticate, async (req, res) => {
  try {
    const nutricionistaId = req.user.userId
    const role = req.user.role?.toUpperCase()

    if (role !== 'NUTRICIONISTA' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    // Buscar alimentos do CSV (sem nutricionistaId) e alimentos criados pelo nutricionista
    const alimentos = await prisma.alimento.findMany({
      where: {
        OR: [
          { nutricionistaId: null }, // Alimentos do CSV
          { nutricionistaId: nutricionistaId } // Alimentos criados pelo nutricionista
        ]
      },
      orderBy: {
        descricao: 'asc'
      }
    })

    res.json({ alimentos })
  } catch (error) {
    console.error('Erro ao listar alimentos:', error)
    res.status(500).json({ error: 'Erro ao listar alimentos' })
  }
})

// POST /api/nutricionista/alimentos - Criar alimento
router.post('/', authenticate, async (req, res) => {
  try {
    const nutricionistaId = req.user.userId
    const role = req.user.role?.toUpperCase()

    if (role !== 'NUTRICIONISTA' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    const validatedData = createAlimentoSchema.parse(req.body)

    const alimento = await prisma.alimento.create({
      data: {
        ...validatedData,
        nutricionistaId: nutricionistaId
      }
    })

    res.status(201).json({ alimento })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao criar alimento:', error)
    res.status(500).json({ error: 'Erro ao criar alimento' })
  }
})

// POST /api/nutricionista/alimentos/calcular - Calcular valores para um peso específico
router.post('/calcular', authenticate, async (req, res) => {
  try {
    const { alimentoId, pesoGramas } = req.body

    if (!alimentoId || !pesoGramas) {
      return res.status(400).json({ error: 'alimentoId e pesoGramas são obrigatórios' })
    }

    const alimento = await prisma.alimento.findUnique({
      where: { id: alimentoId }
    })

    if (!alimento) {
      return res.status(404).json({ error: 'Alimento não encontrado' })
    }

    // Valores são por 100g, então calcular para o peso fornecido
    const fator = pesoGramas / 100

    const calculado = {
      pesoGramas: pesoGramas,
      energiaKcal: Math.round(alimento.energiaKcal * fator * 10) / 10,
      proteina: Math.round(alimento.proteina * fator * 10) / 10,
      lipideos: Math.round(alimento.lipideos * fator * 10) / 10,
      carboidrato: Math.round(alimento.carboidrato * fator * 10) / 10
    }

    res.json({ calculado, alimento })
  } catch (error) {
    console.error('Erro ao calcular:', error)
    res.status(500).json({ error: 'Erro ao calcular valores' })
  }
})

// POST /api/nutricionista/alimentos/import-csv - Importar alimentos do CSV
router.post('/import-csv', authenticate, async (req, res) => {
  try {
    const role = req.user.role?.toUpperCase()

    if (role !== 'NUTRICIONISTA' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    const csvPath = path.join(__dirname, '../../alimentos.csv')

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: 'Arquivo alimentos.csv não encontrado' })
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

    let imported = 0
    let skipped = 0

    // Pular header e processar linhas
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      // Parse CSV linha (considerando aspas)
      const values = []
      let current = ''
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const numeroIndex = headers.indexOf('Número do Alimento')
      const categoriaIndex = headers.indexOf('Categoria do alimento')
      const descricaoIndex = headers.indexOf('Descrição dos alimentos')
      const umidadeIndex = headers.indexOf('Umidade....')
      const energiaKcalIndex = headers.indexOf('Energia..kcal.')
      const energiaKjIndex = headers.indexOf('Energia..kJ.')
      const proteinaIndex = headers.indexOf('Proteína..g.')
      const lipideosIndex = headers.indexOf('Lipídeos..g.')
      const colesterolIndex = headers.indexOf('Colesterol..mg.')
      const carboidratoIndex = headers.indexOf('Carboidrato..g.')
      const fibraIndex = headers.indexOf('Fibra.Alimentar..g.')
      const cinzasIndex = headers.indexOf('Cinzas..g.')

      const parseFloatSafe = (val) => {
        if (!val || val === 'NA' || val.trim() === '') return null
        const num = parseFloat(val)
        return isNaN(num) ? null : num
      }

      const parseFloatRequired = (val) => {
        const num = parseFloatSafe(val)
        return num !== null ? num : 0
      }

      try {
        const numero = parseFloatSafe(values[numeroIndex]) ? parseInt(values[numeroIndex]) : null
        const descricao = values[descricaoIndex] || 'Sem descrição'
        
        // Verificar se já existe pelo número ou pela descrição
        const existing = numero 
          ? await prisma.alimento.findFirst({
              where: { numero, nutricionistaId: null }
            })
          : await prisma.alimento.findFirst({
              where: { descricao, nutricionistaId: null }
            })

        if (!existing) {
          await prisma.alimento.create({
            data: {
              numero,
              categoria: values[categoriaIndex] || null,
              descricao,
              umidade: parseFloatSafe(values[umidadeIndex]),
              energiaKcal: parseFloatRequired(values[energiaKcalIndex]),
              energiaKj: parseFloatSafe(values[energiaKjIndex]),
              proteina: parseFloatRequired(values[proteinaIndex]),
              lipideos: parseFloatRequired(values[lipideosIndex]),
              colesterol: parseFloatSafe(values[colesterolIndex]),
              carboidrato: parseFloatRequired(values[carboidratoIndex]),
              fibraAlimentar: parseFloatSafe(values[fibraIndex]),
              cinzas: parseFloatSafe(values[cinzasIndex]),
              nutricionistaId: null // Alimentos do CSV não têm nutricionista
            }
          })
        }
        imported++
      } catch (err) {
        console.error(`Erro ao importar linha ${i}:`, err)
        skipped++
      }
    }

    res.json({
      message: 'Importação concluída',
      imported,
      skipped
    })
  } catch (error) {
    console.error('Erro ao importar CSV:', error)
    res.status(500).json({ error: 'Erro ao importar alimentos do CSV' })
  }
})

export default router

