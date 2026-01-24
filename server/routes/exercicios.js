import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { z } from 'zod'
import { ensureDefaultExercicios } from '../utils/personalDefaults.js'
import { 
  searchExercises, 
  getExerciseDetails, 
  getMuscleGroups, 
  getEquipmentList 
} from '../services/ascendAPI.js'

const router = express.Router()

// Schema de validação para exercício
const exercicioSchema = z.object({
  nome: z.string().min(1, 'Nome do exercício é obrigatório'),
  descricao: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable()
})

// GET /api/exercicios - Listar exercícios do personal
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas personal trainers podem gerenciar exercícios.' })
    }

    // Para PERSONAL, garantir que o pacote padrão de exercícios exista
    if (user?.role === 'PERSONAL') {
      try {
        await ensureDefaultExercicios(userId)
      } catch (seedError) {
        console.error('Erro ao criar exercícios padrão para personal:', seedError)
      }
    }
    
    // Buscar exercícios do personal E exercícios sincronizados da API (source = 'ASCEND_API')
    const exercicios = await prisma.exercicio.findMany({
      where: {
        OR: [
          { personalId: userId },
          { source: 'ASCEND_API' }
        ]
      },
      orderBy: { nome: 'asc' }
    })
    
    // Parsear ascendData se existir
    const exerciciosComDados = exercicios.map(ex => {
      if (ex.ascendData) {
        try {
          const parsed = JSON.parse(ex.ascendData)
          return {
            ...ex,
            ascendDataParsed: parsed
          }
        } catch (e) {
          return ex
        }
      }
      return ex
    })
    
    res.json({ exercicios: exerciciosComDados })
  } catch (error) {
    console.error('Erro ao listar exercícios:', error)
    res.status(500).json({ error: 'Erro ao listar exercícios' })
  }
})

// GET /api/exercicios/:id - Buscar exercício específico
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    const exercicio = await prisma.exercicio.findUnique({
      where: { id }
    })
    
    if (!exercicio) {
      return res.status(404).json({ error: 'Exercício não encontrado' })
    }
    
    // Verificar se o exercício pertence ao personal
    if (exercicio.personalId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Este exercício não pertence a você.' })
      }
    }
    
    res.json({ exercicio })
  } catch (error) {
    console.error('Erro ao buscar exercício:', error)
    res.status(500).json({ error: 'Erro ao buscar exercício' })
  }
})

// POST /api/exercicios - Criar novo exercício
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas personal trainers podem criar exercícios.' })
    }
    
    const validatedData = exercicioSchema.parse(req.body)
    
    const exercicio = await prisma.exercicio.create({
      data: {
        ...validatedData,
        personalId: userId
      }
    })
    
    res.status(201).json({
      message: 'Exercício criado com sucesso',
      exercicio
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao criar exercício:', error)
    res.status(500).json({ error: 'Erro ao criar exercício' })
  }
})

// PUT /api/exercicios/:id - Atualizar exercício
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    // Verificar se o exercício existe e pertence ao personal
    const existingExercicio = await prisma.exercicio.findUnique({
      where: { id }
    })
    
    if (!existingExercicio) {
      return res.status(404).json({ error: 'Exercício não encontrado' })
    }
    
    if (existingExercicio.personalId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Este exercício não pertence a você.' })
      }
    }
    
    const validatedData = exercicioSchema.parse(req.body)
    
    const exercicio = await prisma.exercicio.update({
      where: { id },
      data: validatedData
    })
    
    res.json({
      message: 'Exercício atualizado com sucesso',
      exercicio
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    console.error('Erro ao atualizar exercício:', error)
    res.status(500).json({ error: 'Erro ao atualizar exercício' })
  }
})

// DELETE /api/exercicios/:id - Deletar exercício
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    // Verificar se o exercício existe e pertence ao personal
    const existingExercicio = await prisma.exercicio.findUnique({
      where: { id }
    })
    
    if (!existingExercicio) {
      return res.status(404).json({ error: 'Exercício não encontrado' })
    }
    
    if (existingExercicio.personalId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Este exercício não pertence a você.' })
      }
    }
    
    // Verificar se o exercício está sendo usado em alguma prescrição
    const prescricoesUsando = await prisma.prescricaoTreinoItem.findFirst({
      where: { exercicioId: id }
    })
    
    if (prescricoesUsando) {
      return res.status(400).json({
        error: 'Não é possível deletar este exercício. Ele está sendo usado em prescrições de treino.'
      })
    }
    
    await prisma.exercicio.delete({
      where: { id }
    })
    
    res.json({ message: 'Exercício deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar exercício:', error)
    res.status(500).json({ error: 'Erro ao deletar exercício' })
  }
})

// GET /api/exercicios/ascend/search - Buscar exercícios na Ascend API
router.get('/ascend/search', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas personal trainers podem buscar exercícios.' 
      })
    }
    
    const { limit, offset, muscle, equipment, difficulty, name } = req.query
    
    const exercises = await searchExercises({
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      muscle,
      equipment,
      difficulty,
      name
    })
    
    res.json({ 
      exercises: Array.isArray(exercises) ? exercises : [],
      total: Array.isArray(exercises) ? exercises.length : 0
    })
  } catch (error) {
    console.error('Erro ao buscar exercícios da Ascend API:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar exercícios da Ascend API',
      details: error.message 
    })
  }
})

// GET /api/exercicios/ascend/muscles - Listar grupos musculares
router.get('/ascend/muscles', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Acesso negado.' 
      })
    }
    
    const muscles = await getMuscleGroups()
    res.json({ muscles })
  } catch (error) {
    console.error('Erro ao buscar grupos musculares:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar grupos musculares',
      details: error.message 
    })
  }
})

// GET /api/exercicios/ascend/equipment - Listar equipamentos
router.get('/ascend/equipment', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Acesso negado.' 
      })
    }
    
    const equipment = await getEquipmentList()
    res.json({ equipment })
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar equipamentos',
      details: error.message 
    })
  }
})

// GET /api/exercicios/ascend/:id - Buscar detalhes de um exercício
router.get('/ascend/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Acesso negado.' 
      })
    }
    
    const exercise = await getExerciseDetails(id)
    res.json({ exercise })
  } catch (error) {
    console.error('Erro ao buscar detalhes do exercício:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar detalhes do exercício',
      details: error.message 
    })
  }
})

// POST /api/exercicios/import/ascend - Importar exercício da Ascend API
router.post('/import/ascend', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { exerciseId, exerciseData } = req.body
    
    // Verificar se é personal trainer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'PERSONAL' && user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas personal trainers podem importar exercícios.' 
      })
    }
    
    // Se tiver exerciseData, usar diretamente, senão buscar da API
    let exerciseDB = exerciseData
    
    if (!exerciseDB && exerciseId) {
      exerciseDB = await getExerciseDetails(exerciseId)
    }
    
    if (!exerciseDB) {
      return res.status(400).json({ 
        error: 'Dados do exercício não fornecidos' 
      })
    }
    
    // Mapear categoria baseado no músculo (usar bodyParts se disponível)
    const muscleToCategory = {
      'chest': 'Peito',
      'back': 'Costas',
      'shoulders': 'Ombro',
      'shoulder': 'Ombro',
      'biceps': 'Bíceps',
      'triceps': 'Tríceps',
      'legs': 'Pernas',
      'leg': 'Pernas',
      'glutes': 'Glúteos',
      'glute': 'Glúteos',
      'abs': 'Abdômen',
      'cardio': 'Cardio',
      'upper back': 'Costas',
      'lower back': 'Costas',
      'middle back': 'Costas'
    }
    
    // Priorizar bodyParts_translated, depois muscle_translated, depois bodyParts
    let categoria = 'Outros'
    if (exerciseDB.bodyParts_translated && Array.isArray(exerciseDB.bodyParts_translated) && exerciseDB.bodyParts_translated.length > 0) {
      categoria = muscleToCategory[exerciseDB.bodyParts_translated[0].toLowerCase()] || exerciseDB.bodyParts_translated[0] || 'Outros'
    } else if (exerciseDB.muscle_translated) {
      categoria = muscleToCategory[exerciseDB.muscle_translated.toLowerCase()] || exerciseDB.muscle_translated || 'Outros'
    } else if (exerciseDB.bodyParts && Array.isArray(exerciseDB.bodyParts) && exerciseDB.bodyParts.length > 0) {
      const firstBodyPart = exerciseDB.bodyParts[0].toLowerCase()
      categoria = muscleToCategory[firstBodyPart] || 'Outros'
    } else if (exerciseDB.muscle) {
      categoria = muscleToCategory[exerciseDB.muscle.toLowerCase()] || 'Outros'
    }
    
    // Criar descrição combinando description e instructions
    const descricaoParts = []
    if (exerciseDB.description) {
      descricaoParts.push(exerciseDB.description)
    }
    if (exerciseDB.instructions && Array.isArray(exerciseDB.instructions) && exerciseDB.instructions.length > 0) {
      if (descricaoParts.length > 0) descricaoParts.push('')
      descricaoParts.push('Instruções:')
      exerciseDB.instructions.forEach((inst, idx) => {
        descricaoParts.push(`${idx + 1}. ${inst}`)
      })
    }
    if (exerciseDB.tips && Array.isArray(exerciseDB.tips) && exerciseDB.tips.length > 0) {
      if (descricaoParts.length > 0) descricaoParts.push('')
      descricaoParts.push('Dicas:')
      exerciseDB.tips.forEach(tip => {
        descricaoParts.push(`• ${tip}`)
      })
    }
    
    const descricao = descricaoParts.length > 0 ? descricaoParts.join('\n') : null
    
    // Criar observações com informações adicionais
    const observacoesParts = []
    
    // Equipamentos (pode ser array)
    if (exerciseDB.equipments_translated && Array.isArray(exerciseDB.equipments_translated) && exerciseDB.equipments_translated.length > 0) {
      observacoesParts.push(`Equipamento: ${exerciseDB.equipments_translated.join(', ')}`)
    } else if (exerciseDB.equipment_translated || exerciseDB.equipment) {
      observacoesParts.push(`Equipamento: ${exerciseDB.equipment_translated || exerciseDB.equipment}`)
    }
    
    // Dificuldade
    if (exerciseDB.difficulty_translated || exerciseDB.difficulty) {
      observacoesParts.push(`Dificuldade: ${exerciseDB.difficulty_translated || exerciseDB.difficulty}`)
    }
    
    // Músculos primários (targetMuscles)
    if (exerciseDB.targetMuscles_translated && Array.isArray(exerciseDB.targetMuscles_translated) && exerciseDB.targetMuscles_translated.length > 0) {
      observacoesParts.push(`Músculos alvo: ${exerciseDB.targetMuscles_translated.join(', ')}`)
    } else if (exerciseDB.primary_muscles_translated && Array.isArray(exerciseDB.primary_muscles_translated) && exerciseDB.primary_muscles_translated.length > 0) {
      observacoesParts.push(`Músculos primários: ${exerciseDB.primary_muscles_translated.join(', ')}`)
    }
    
    // Músculos secundários
    if (exerciseDB.secondaryMuscles_translated && Array.isArray(exerciseDB.secondaryMuscles_translated) && exerciseDB.secondaryMuscles_translated.length > 0) {
      observacoesParts.push(`Músculos secundários: ${exerciseDB.secondaryMuscles_translated.join(', ')}`)
    } else if (exerciseDB.secondary_muscles_translated && Array.isArray(exerciseDB.secondary_muscles_translated) && exerciseDB.secondary_muscles_translated.length > 0) {
      observacoesParts.push(`Músculos secundários: ${exerciseDB.secondary_muscles_translated.join(', ')}`)
    }
    
    const observacoes = observacoesParts.length > 0 ? observacoesParts.join('\n') : null
    
    // Criar exercício no banco local
    // Usar nome traduzido se disponível, senão usar o nome original
    const nomeExercicio = exerciseDB.name || 'Exercício sem nome'
    
    // Priorizar gifUrl (que é o que a API retorna), depois video_url
    const videoUrl = exerciseDB.gifUrl || exerciseDB.video_url || exerciseDB.image_url || null
    
    // Salvar dados completos traduzidos da API em JSON
    const ascendData = JSON.stringify({
      name: exerciseDB.name,
      name_translated: exerciseDB.name, // Pode ser traduzido no futuro
      bodyParts: exerciseDB.bodyParts || [],
      bodyParts_translated: exerciseDB.bodyParts_translated || [],
      targetMuscles: exerciseDB.targetMuscles || [],
      targetMuscles_translated: exerciseDB.targetMuscles_translated || [],
      equipments: exerciseDB.equipments || [],
      equipments_translated: exerciseDB.equipments_translated || [],
      secondaryMuscles: exerciseDB.secondaryMuscles || [],
      secondaryMuscles_translated: exerciseDB.secondaryMuscles_translated || [],
      instructions: exerciseDB.instructions || [],
      tips: exerciseDB.tips || [],
      difficulty: exerciseDB.difficulty,
      difficulty_translated: exerciseDB.difficulty_translated,
      gifUrl: exerciseDB.gifUrl,
      imageUrl: exerciseDB.image_url || exerciseDB.imageUrl
    })
    
    const exercicio = await prisma.exercicio.create({
      data: {
        nome: nomeExercicio,
        descricao: descricao || null,
        categoria: categoria,
        videoUrl: videoUrl,
        observacoes: observacoes || null,
        personalId: userId,
        source: 'ASCEND_API',
        ascendExerciseId: exerciseDB.id || exerciseDB.exerciseId || null,
        ascendData: ascendData
      }
    })
    
    res.status(201).json({
      message: 'Exercício importado com sucesso',
      exercicio
    })
  } catch (error) {
    console.error('Erro ao importar exercício:', error)
    res.status(500).json({ 
      error: 'Erro ao importar exercício',
      details: error.message 
    })
  }
})

// POST /api/exercicios/sync/ascend - Sincronizar todos os exercícios da Ascend API
router.post('/sync/ascend', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas administradores podem sincronizar exercícios.' 
      })
    }
    
    console.log('🔄 Iniciando sincronização de exercícios da Ascend API...')
    
    let totalExercises = 0
    let imported = 0
    let updated = 0
    let skipped = 0
    let offset = 0
    const limit = 50 // Buscar 50 por vez
    let hasMore = true
    
    // Buscar um usuário admin para usar como personalId (ou criar um usuário sistema)
    // Por enquanto, vamos usar o userId do admin que está sincronizando
    const systemPersonalId = userId
    
    while (hasMore) {
      try {
        console.log(`📥 Buscando exercícios (offset: ${offset}, limit: ${limit})...`)
        
        const exercises = await searchExercises({
          limit,
          offset
        })
        
        if (!exercises || exercises.length === 0) {
          hasMore = false
          break
        }
        
        console.log(`✅ Recebidos ${exercises.length} exercícios`)
        
        for (const exercise of exercises) {
          try {
            const exerciseId = exercise.id || exercise.exerciseId
            
            if (!exerciseId) {
              skipped++
              continue
            }
            
            // Verificar se já existe
            const existing = await prisma.exercicio.findUnique({
              where: { ascendExerciseId: exerciseId }
            })
            
            // Mapear categoria
            const muscleToCategory = {
              'chest': 'Peito',
              'back': 'Costas',
              'shoulders': 'Ombro',
              'shoulder': 'Ombro',
              'biceps': 'Bíceps',
              'triceps': 'Tríceps',
              'legs': 'Pernas',
              'leg': 'Pernas',
              'glutes': 'Glúteos',
              'glute': 'Glúteos',
              'abs': 'Abdômen',
              'cardio': 'Cardio',
              'upper back': 'Costas',
              'lower back': 'Costas',
              'middle back': 'Costas'
            }
            
            let categoria = 'Outros'
            if (exercise.bodyParts_translated && Array.isArray(exercise.bodyParts_translated) && exercise.bodyParts_translated.length > 0) {
              categoria = muscleToCategory[exercise.bodyParts_translated[0].toLowerCase()] || exercise.bodyParts_translated[0] || 'Outros'
            } else if (exercise.bodyParts && Array.isArray(exercise.bodyParts) && exercise.bodyParts.length > 0) {
              const firstBodyPart = exercise.bodyParts[0].toLowerCase()
              categoria = muscleToCategory[firstBodyPart] || 'Outros'
            }
            
            // Criar descrição
            const descricaoParts = []
            if (exercise.description) {
              descricaoParts.push(exercise.description)
            }
            if (exercise.instructions && Array.isArray(exercise.instructions) && exercise.instructions.length > 0) {
              if (descricaoParts.length > 0) descricaoParts.push('')
              descricaoParts.push('Instruções:')
              exercise.instructions.forEach((inst, idx) => {
                descricaoParts.push(`${idx + 1}. ${inst}`)
              })
            }
            const descricao = descricaoParts.length > 0 ? descricaoParts.join('\n') : null
            
            // Criar observações
            const observacoesParts = []
            if (exercise.equipments_translated && Array.isArray(exercise.equipments_translated) && exercise.equipments_translated.length > 0) {
              observacoesParts.push(`Equipamento: ${exercise.equipments_translated.join(', ')}`)
            }
            if (exercise.difficulty_translated) {
              observacoesParts.push(`Dificuldade: ${exercise.difficulty_translated}`)
            }
            if (exercise.targetMuscles_translated && Array.isArray(exercise.targetMuscles_translated) && exercise.targetMuscles_translated.length > 0) {
              observacoesParts.push(`Músculos alvo: ${exercise.targetMuscles_translated.join(', ')}`)
            }
            const observacoes = observacoesParts.length > 0 ? observacoesParts.join('\n') : null
            
            // Salvar dados completos traduzidos
            const ascendData = JSON.stringify({
              name: exercise.name,
              bodyParts: exercise.bodyParts || [],
              bodyParts_translated: exercise.bodyParts_translated || [],
              targetMuscles: exercise.targetMuscles || [],
              targetMuscles_translated: exercise.targetMuscles_translated || [],
              equipments: exercise.equipments || [],
              equipments_translated: exercise.equipments_translated || [],
              secondaryMuscles: exercise.secondaryMuscles || [],
              secondaryMuscles_translated: exercise.secondaryMuscles_translated || [],
              instructions: exercise.instructions || [],
              tips: exercise.tips || [],
              difficulty: exercise.difficulty,
              difficulty_translated: exercise.difficulty_translated,
              gifUrl: exercise.gifUrl,
              imageUrl: exercise.image_url || exercise.imageUrl
            })
            
            const videoUrl = exercise.gifUrl || exercise.video_url || exercise.image_url || null
            
            if (existing) {
              // Atualizar existente
              await prisma.exercicio.update({
                where: { id: existing.id },
                data: {
                  nome: exercise.name || existing.nome,
                  descricao: descricao || existing.descricao,
                  categoria: categoria || existing.categoria,
                  videoUrl: videoUrl || existing.videoUrl,
                  observacoes: observacoes || existing.observacoes,
                  ascendData: ascendData,
                  updatedAt: new Date()
                }
              })
              updated++
            } else {
              // Criar novo
              await prisma.exercicio.create({
                data: {
                  nome: exercise.name || 'Exercício sem nome',
                  descricao: descricao,
                  categoria: categoria,
                  videoUrl: videoUrl,
                  observacoes: observacoes,
                  personalId: systemPersonalId,
                  source: 'ASCEND_API',
                  ascendExerciseId: exerciseId,
                  ascendData: ascendData
                }
              })
              imported++
            }
            
            totalExercises++
          } catch (exerciseError) {
            console.error(`❌ Erro ao processar exercício:`, exerciseError)
            skipped++
          }
        }
        
        // Se recebeu menos que o limite, não há mais páginas
        if (exercises.length < limit) {
          hasMore = false
        } else {
          offset += limit
        }
        
        // Log de progresso a cada 100 exercícios
        if (totalExercises % 100 === 0) {
          console.log(`📊 Progresso: ${totalExercises} exercícios processados (${imported} novos, ${updated} atualizados, ${skipped} ignorados)`)
        }
        
      } catch (batchError) {
        console.error(`❌ Erro ao buscar lote (offset ${offset}):`, batchError)
        // Continuar com próximo lote
        offset += limit
        if (offset > 10000) { // Limite de segurança
          hasMore = false
        }
      }
    }
    
    console.log(`✅ Sincronização concluída!`)
    console.log(`   Total processado: ${totalExercises}`)
    console.log(`   Novos: ${imported}`)
    console.log(`   Atualizados: ${updated}`)
    console.log(`   Ignorados: ${skipped}`)
    
    res.json({
      message: 'Sincronização concluída com sucesso',
      stats: {
        total: totalExercises,
        imported,
        updated,
        skipped
      }
    })
  } catch (error) {
    console.error('❌ Erro ao sincronizar exercícios:', error)
    res.status(500).json({ 
      error: 'Erro ao sincronizar exercícios',
      details: error.message 
    })
  }
})

export default router

