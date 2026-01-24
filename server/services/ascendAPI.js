// server/services/ascendAPI.js

const ASCEND_API_URL = process.env.ASCEND_API_URL || 'https://www.ascendapi.com/api/v1'

/**
 * Mapeamento de tradução para português
 */
const translateToPortuguese = {
  // Body Parts / Muscle Groups (valores exatos da API)
  'chest': 'Peito',
  'back': 'Costas',
  'shoulders': 'Ombros',
  'shoulder': 'Ombro',
  'biceps': 'Bíceps',
  'triceps': 'Tríceps',
  'forearms': 'Antebraços',
  'forearm': 'Antebraço',
  'abs': 'Abdômen',
  'legs': 'Pernas',
  'leg': 'Perna',
  'hamstrings': 'Isquiotibiais',
  'calves': 'Panturrilhas',
  'calf': 'Panturrilha',
  'glutes': 'Glúteos',
  'glute': 'Glúteo',
  'quadriceps': 'Quadríceps',
  'cardio': 'Cardio',
  'upper back': 'Costas Superiores',
  'lower back': 'Costas Inferiores',
  'middle back': 'Costas Médias',
  'chest': 'Peito',
  'waist': 'Cintura',
  'neck': 'Pescoço',
  'adductors': 'Adutores',
  'abductors': 'Abutores',
  
  // Equipment (valores exatos da API)
  'barbell': 'Barra',
  'dumbbell': 'Halter',
  'dumbbells': 'Halteres',
  'cable': 'Cabo',
  'machine': 'Máquina',
  'body weight': 'Peso Corporal',
  'bodyweight': 'Peso Corporal',
  'kettlebell': 'Kettlebell',
  'kettlebells': 'Kettlebells',
  'resistance band': 'Faixa Elástica',
  'resistance_band': 'Faixa Elástica',
  'ez bar': 'Barra E-Z',
  'ez_bar': 'Barra E-Z',
  'smith machine': 'Smith Machine',
  'smith_machine': 'Smith Machine',
  'band': 'Faixa Elástica',
  'medicine ball': 'Medicine Ball',
  'stability ball': 'Bola de Estabilidade',
  'pull-up bar': 'Barra de Flexão',
  'rope': 'Corda',
  
  // Difficulty
  'beginner': 'Iniciante',
  'intermediate': 'Intermediário',
  'advanced': 'Avançado',
  'expert': 'Expert',
  
  // Exercise Types
  'strength': 'Força',
  'cardio': 'Cardio',
  'stretching': 'Alongamento',
  'plyometric': 'Pliométrico',
  'olympic weightlifting': 'Levantamento Olímpico',
  'powerlifting': 'Powerlifting'
}

/**
 * Traduzir texto para português
 */
function translate(text) {
  if (!text) return text
  
  // Se for array, traduzir cada item
  if (Array.isArray(text)) {
    return text.map(item => translateToPortuguese[item?.toLowerCase()] || item)
  }
  
  // Traduzir valor conhecido
  const lowerText = String(text).toLowerCase()
  return translateToPortuguese[lowerText] || text
}

/**
 * Traduzir nome de músculo
 */
function translateMuscle(muscle) {
  if (!muscle) return muscle
  
  const muscleTranslations = {
    // Músculos principais
    'pectorals': 'Peitorais',
    'pectoralis major': 'Peitoral Maior',
    'pectoralis minor': 'Peitoral Menor',
    'chest': 'Peito',
    'upper chest': 'Peito Superior',
    'lower chest': 'Peito Inferior',
    
    // Costas
    'lats': 'Latíssimo do Dorso',
    'latissimus dorsi': 'Latíssimo do Dorso',
    'upper back': 'Costas Superiores',
    'lower back': 'Costas Inferiores',
    'middle back': 'Costas Médias',
    'back': 'Costas',
    'rhomboids': 'Romboides',
    'traps': 'Trapézio',
    'trapezius': 'Trapézio',
    'rear delts': 'Deltóides Posteriores',
    'rear deltoids': 'Deltóides Posteriores',
    
    // Ombros
    'deltoids': 'Deltóides',
    'deltoid': 'Deltóide',
    'anterior deltoid': 'Deltóide Anterior',
    'lateral deltoid': 'Deltóide Lateral',
    'posterior deltoid': 'Deltóide Posterior',
    'shoulders': 'Ombros',
    'shoulder': 'Ombro',
    
    // Braços
    'biceps': 'Bíceps',
    'biceps brachii': 'Bíceps Braquial',
    'triceps': 'Tríceps',
    'triceps brachii': 'Tríceps Braquial',
    'forearms': 'Antebraços',
    'forearm': 'Antebraço',
    
    // Pernas
    'quadriceps': 'Quadríceps',
    'quads': 'Quadríceps',
    'hamstrings': 'Isquiotibiais',
    'hamstring': 'Isquiotibial',
    'glutes': 'Glúteos',
    'glute': 'Glúteo',
    'gluteus maximus': 'Glúteo Máximo',
    'calves': 'Panturrilhas',
    'calf': 'Panturrilha',
    'gastrocnemius': 'Gastrocnêmio',
    'adductors': 'Adutores',
    'abductors': 'Abutores',
    'legs': 'Pernas',
    'leg': 'Perna',
    
    // Core
    'abs': 'Abdominais',
    'abdominals': 'Abdominais',
    'abdominal': 'Abdominal',
    'obliques': 'Oblíquos',
    'oblique': 'Oblíquo',
    'core': 'Core',
    'erector spinae': 'Eretor da Espinha',
    'lower back': 'Costas Inferiores',
    'waist': 'Cintura'
  }
  
  const lowerMuscle = String(muscle).toLowerCase().trim()
  return muscleTranslations[lowerMuscle] || muscle
}

/**
 * Buscar exercícios da Ascend API
 * @param {Object} params - Parâmetros de busca
 */
export async function searchExercises(params = {}) {
  try {
    const { limit = 50, offset = 0, muscle, equipment, difficulty, name } = params
    
    // Construir URL com parâmetros
    const urlParams = new URLSearchParams()
    if (limit) urlParams.append('limit', limit.toString())
    if (offset) urlParams.append('offset', offset.toString())
    if (muscle) urlParams.append('muscle', muscle)
    if (equipment) urlParams.append('equipment', equipment)
    if (difficulty) urlParams.append('difficulty', difficulty)
    if (name) urlParams.append('name', name)
    
    const url = `${ASCEND_API_URL}/exercises?${urlParams.toString()}`
    
    console.log('🔍 Buscando exercícios na Ascend API:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na Ascend API:', response.status, errorText)
      throw new Error(`Ascend API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    
    // A resposta pode ser um array ou um objeto com propriedade exercises ou data
    let exercises = []
    if (Array.isArray(data)) {
      exercises = data
    } else if (data.data && Array.isArray(data.data)) {
      exercises = data.data
    } else if (data.exercises && Array.isArray(data.exercises)) {
      exercises = data.exercises
    } else {
      exercises = [data]
    }
    
    console.log(`✅ Encontrados ${exercises.length} exercícios`)
    
    // Traduzir exercícios para português
    const translated = exercises.map(exercise => translateExercise(exercise))
    
    console.log('📝 Primeiro exercício traduzido:', JSON.stringify(translated[0], null, 2))
    
    return translated
  } catch (error) {
    console.error('❌ Erro ao buscar exercícios da Ascend API:', error)
    throw error
  }
}

/**
 * Buscar detalhes de um exercício específico
 * @param {string} exerciseId - ID do exercício
 */
export async function getExerciseDetails(exerciseId) {
  try {
    const url = `${ASCEND_API_URL}/exercises/${exerciseId}`
    
    console.log('🔍 Buscando detalhes do exercício:', exerciseId)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Ascend API error: ${response.status}`)
    }
    
    const data = await response.json()
    return translateExercise(data)
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes do exercício:', error)
    throw error
  }
}

/**
 * Traduzir exercício para português
 */
function translateExercise(exercise) {
  if (!exercise) return exercise
  
  // Mapear campos da API real (baseado no formato retornado)
  const id = exercise.exerciseId || exercise.id || exercise.exercise_id || exercise._id
  const name = exercise.name || exercise.title || exercise.exercise_name || 'Exercício sem nome'
  
  // Body parts (array)
  const bodyParts = exercise.bodyParts || exercise.body_parts || []
  const bodyPartsTranslated = Array.isArray(bodyParts) 
    ? bodyParts.map(bp => translate(bp))
    : translate(bodyParts)
  
  // Target muscles (array)
  const targetMuscles = exercise.targetMuscles || exercise.target_muscles || []
  const targetMusclesTranslated = Array.isArray(targetMuscles)
    ? targetMuscles.map(m => translateMuscle(m))
    : translateMuscle(targetMuscles)
  
  // Equipments (array)
  const equipments = exercise.equipments || exercise.equipment || []
  const equipmentsTranslated = Array.isArray(equipments)
    ? equipments.map(eq => translate(eq))
    : translate(equipments)
  
  // Secondary muscles (array)
  const secondaryMuscles = exercise.secondaryMuscles || exercise.secondary_muscles || []
  const secondaryMusclesTranslated = Array.isArray(secondaryMuscles)
    ? secondaryMuscles.map(m => translateMuscle(m))
    : translateMuscle(secondaryMuscles)
  
  // Instructions (array de strings)
  let instructions = exercise.instructions || exercise.steps || exercise.instruction || []
  if (typeof instructions === 'string') {
    instructions = instructions.split('\n').filter(Boolean)
  }
  if (!Array.isArray(instructions)) {
    instructions = []
  }
  
  // Remover prefixo "Step:X " das instruções
  instructions = instructions.map(inst => {
    return inst.replace(/^Step:\d+\s*/i, '').trim()
  })
  
  // GIF/Video URL
  const gifUrl = exercise.gifUrl || exercise.gif_url || exercise.video_url || exercise.video || exercise.videoUrl || null
  
  // Image URL (pode ser o mesmo GIF ou uma imagem separada)
  const imageUrl = exercise.imageUrl || exercise.image_url || exercise.image || gifUrl || null
  
  const translated = {
    id: id,
    exerciseId: id, // Manter ambos para compatibilidade
    name: name,
    description: instructions.length > 0 ? instructions.join('\n\n') : '',
    muscle: Array.isArray(bodyParts) ? bodyParts[0] : bodyParts,
    muscle_translated: Array.isArray(bodyPartsTranslated) ? bodyPartsTranslated[0] : bodyPartsTranslated,
    bodyParts: bodyParts,
    bodyParts_translated: bodyPartsTranslated,
    equipment: Array.isArray(equipments) ? equipments[0] : equipments,
    equipment_translated: Array.isArray(equipmentsTranslated) ? equipmentsTranslated[0] : equipmentsTranslated,
    equipments: equipments,
    equipments_translated: equipmentsTranslated,
    targetMuscles: targetMuscles,
    targetMuscles_translated: targetMusclesTranslated,
    primary_muscles: targetMuscles,
    primary_muscles_translated: targetMusclesTranslated,
    secondaryMuscles: secondaryMuscles,
    secondaryMuscles_translated: secondaryMusclesTranslated,
    secondary_muscles: secondaryMuscles,
    secondary_muscles_translated: secondaryMusclesTranslated,
    video_url: gifUrl,
    gifUrl: gifUrl,
    image_url: imageUrl,
    imageUrl: imageUrl,
    instructions: instructions,
    tips: exercise.tips || exercise.tip || exercise.cues || [],
    difficulty: exercise.difficulty || exercise.level || null,
    difficulty_translated: translate(exercise.difficulty || exercise.level || ''),
    type: exercise.type || exercise.exercise_type || null,
    type_translated: translate(exercise.type || exercise.exercise_type || '')
  }
  
  // Se tips for string, converter para array
  if (typeof translated.tips === 'string') {
    translated.tips = translated.tips.split('\n').filter(Boolean)
  }
  
  return translated
}

/**
 * Buscar lista de músculos disponíveis
 */
export async function getMuscleGroups() {
  try {
    // Tentar buscar de um endpoint específico ou retornar lista padrão
    const url = `${ASCEND_API_URL}/muscles`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        return translate(Array.isArray(data) ? data : data.muscles || [])
      }
    } catch (error) {
      console.log('⚠️ Endpoint de músculos não disponível, usando lista padrão')
    }
    
    // Retornar lista padrão traduzida
    return [
      'Peito',
      'Costas',
      'Ombros',
      'Bíceps',
      'Tríceps',
      'Antebraços',
      'Abdômen',
      'Pernas',
      'Isquiotibiais',
      'Panturrilhas',
      'Glúteos',
      'Quadríceps'
    ]
  } catch (error) {
    console.error('❌ Erro ao buscar músculos:', error)
    return []
  }
}

/**
 * Buscar lista de equipamentos disponíveis
 */
export async function getEquipmentList() {
  try {
    const url = `${ASCEND_API_URL}/equipment`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        return translate(Array.isArray(data) ? data : data.equipment || [])
      }
    } catch (error) {
      console.log('⚠️ Endpoint de equipamentos não disponível, usando lista padrão')
    }
    
    // Retornar lista padrão traduzida
    return [
      'Barra',
      'Halter',
      'Cabo',
      'Máquina',
      'Peso Corporal',
      'Kettlebell',
      'Faixa Elástica'
    ]
  } catch (error) {
    console.error('❌ Erro ao buscar equipamentos:', error)
    return []
  }
}
