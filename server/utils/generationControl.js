import prisma from '../config/database.js'

/**
 * Obtém ou cria o controle de geração para um usuário
 */
export async function getOrCreateGenerationControl(userId) {
  let control = await prisma.generationControl.findUnique({
    where: { userId }
  })

  if (!control) {
    control = await prisma.generationControl.create({
      data: {
        userId,
        resetsAvailable: 1,
        nextGenerationAllowed: null
      }
    })
  }

  return control
}

/**
 * Verifica se o usuário pode gerar dieta/treino
 * Retorna { canGenerate: boolean, reason: string, nextAllowedDate: Date | null }
 */
export async function canGenerate(userId) {
  const control = await getOrCreateGenerationControl(userId)

  const now = new Date()

  // Se não tem próxima geração permitida definida, pode gerar
  if (!control.nextGenerationAllowed) {
    return {
      canGenerate: true,
      reason: null,
      nextAllowedDate: null
    }
  }

  // Verifica se já passou 1 mês desde a última geração
  if (now >= control.nextGenerationAllowed) {
    return {
      canGenerate: true,
      reason: null,
      nextAllowedDate: null
    }
  }

  // Não pode gerar ainda
  return {
    canGenerate: false,
    reason: 'Você só pode gerar uma nova dieta/treino após 1 mês da última geração.',
    nextAllowedDate: control.nextGenerationAllowed
  }
}

/**
 * Verifica se o usuário pode resetar
 * Retorna { canReset: boolean, reason: string }
 */
export async function canReset(userId) {
  const control = await getOrCreateGenerationControl(userId)

  // Verifica se tem resets disponíveis
  if (control.resetsAvailable <= 0) {
    return {
      canReset: false,
      reason: 'Você já usou seu reset disponível. Você poderá resetar novamente após gerar uma nova dieta/treino.'
    }
  }

  // Verifica se tem dieta ou treino gerado
  const [hasDiet, hasWorkout] = await Promise.all([
    prisma.dieta.findUnique({ where: { userId } }),
    prisma.prescricaoTreino.findFirst({
      where: {
        pacienteId: userId,
        ativo: true
      }
    })
  ])

  if (!hasDiet && !hasWorkout) {
    return {
      canReset: false,
      reason: 'Você precisa ter uma dieta ou treino gerado para poder resetar.'
    }
  }

  return {
    canReset: true,
    reason: null
  }
}

/**
 * Registra uma geração de dieta
 */
export async function recordDietGeneration(userId) {
  const control = await getOrCreateGenerationControl(userId)
  const now = new Date()
  
  // Calcula a próxima geração permitida (1 mês a partir de agora)
  const nextAllowed = new Date(now)
  nextAllowed.setMonth(nextAllowed.getMonth() + 1)

  await prisma.generationControl.update({
    where: { userId },
    data: {
      lastDietGeneration: now,
      nextGenerationAllowed: nextAllowed,
      // Quando gera nova dieta/treino, ganha 1 reset disponível
      resetsAvailable: 1
    }
  })
}

/**
 * Registra uma geração de treino
 */
export async function recordWorkoutGeneration(userId) {
  const control = await getOrCreateGenerationControl(userId)
  const now = new Date()
  
  // Calcula a próxima geração permitida (1 mês a partir de agora)
  const nextAllowed = new Date(now)
  nextAllowed.setMonth(nextAllowed.getMonth() + 1)

  await prisma.generationControl.update({
    where: { userId },
    data: {
      lastWorkoutGeneration: now,
      nextGenerationAllowed: nextAllowed,
      // Quando gera nova dieta/treino, ganha 1 reset disponível
      resetsAvailable: 1
    }
  })
}

/**
 * Registra um reset
 */
export async function recordReset(userId) {
  const control = await getOrCreateGenerationControl(userId)
  const now = new Date()

  await prisma.generationControl.update({
    where: { userId },
    data: {
      lastReset: now,
      resetsAvailable: control.resetsAvailable - 1
    }
  })
}

/**
 * Obtém o status completo de geração para o usuário
 */
export async function getGenerationStatus(userId) {
  const control = await getOrCreateGenerationControl(userId)
  const now = new Date()

  const canGenerateResult = await canGenerate(userId)
  const canResetResult = await canReset(userId)

  // Verifica se tem dieta e treino
  const [hasDiet, hasWorkout] = await Promise.all([
    prisma.dieta.findUnique({ where: { userId } }),
    prisma.prescricaoTreino.findFirst({
      where: {
        pacienteId: userId,
        ativo: true
      }
    })
  ])

  return {
    hasDiet: !!hasDiet,
    hasWorkout: !!hasWorkout,
    canGenerate: canGenerateResult.canGenerate,
    canReset: canResetResult.canReset,
    resetsAvailable: control.resetsAvailable,
    nextGenerationAllowed: control.nextGenerationAllowed,
    lastDietGeneration: control.lastDietGeneration,
    lastWorkoutGeneration: control.lastWorkoutGeneration,
    lastReset: control.lastReset,
    // Calcula dias restantes até próxima geração
    daysUntilNextGeneration: control.nextGenerationAllowed
      ? Math.ceil((control.nextGenerationAllowed - now) / (1000 * 60 * 60 * 24))
      : null
  }
}
