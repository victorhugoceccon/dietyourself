/**
 * Normaliza dados do questionário antes de enviar para os agentes n8n
 * 
 * Funcionalidades:
 * - Normaliza strings vazias para null
 * - Deriva campos booleanos explícitos
 * - Resolve duplicidade semântica entre campos novos e legados
 * - Adiciona metadados sobre campos legados
 */

/**
 * Normaliza uma string vazia ou apenas espaços para null
 */
function normalizeEmptyString(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }
  return value
}

/**
 * Normaliza todos os campos de string vazia em um objeto
 */
function normalizeEmptyStrings(obj) {
  const normalized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      normalized[key] = null
    } else if (typeof value === 'string') {
      normalized[key] = normalizeEmptyString(value)
    } else if (Array.isArray(value)) {
      normalized[key] = value // Arrays vazios são mantidos
    } else if (typeof value === 'object') {
      normalized[key] = normalizeEmptyStrings(value)
    } else {
      normalized[key] = value
    }
  }
  return normalized
}

/**
 * Deriva campos booleanos explícitos baseados nos dados do questionário
 */
function deriveBooleanFields(data) {
  const frequenciaAtividade = data.frequenciaAtividade || ''
  const problemasSaude = data.problemasSaude || ''
  const limitacoesFisicas = data.limitacoesFisicas || ''
  const restricoesMedicasExercicio = data.restricoesMedicasExercicio || ''

  return {
    treinaAtualmente: frequenciaAtividade !== 'Não pratico atualmente' && 
                      frequenciaAtividade !== 'Não pratico',
    temRestricaoClinica: problemasSaude === 'Sim',
    temLimitacaoFisica: limitacoesFisicas === 'Sim',
    temRestricaoMedicaExercicio: restricoesMedicasExercicio === 'Sim'
  }
}

/**
 * Resolve duplicidade semântica entre campos novos e legados
 * Prioriza campos novos, usa legados como fallback
 */
function resolveSemanticDuplicates(data) {
  const resolved = { ...data }

  // tipoAtividade (novo) > outraAtividade (legado)
  if (!resolved.tipoAtividade && resolved.outraAtividade) {
    resolved.tipoAtividade = resolved.outraAtividade
  }

  // preferenciaDificuldadeTreino (novo) > rotinaTreinoDetalhada (legado)
  if (!resolved.preferenciaDificuldadeTreino && resolved.rotinaTreinoDetalhada) {
    resolved.preferenciaDificuldadeTreino = resolved.rotinaTreinoDetalhada
  }

  return resolved
}

/**
 * Cria estrutura clean com apenas campos novos e preenchidos
 */
function createCleanStructure(data) {
  const clean = {}
  
  // Campos básicos (sempre incluir)
  const basicFields = [
    'idade', 'sexo', 'altura', 'pesoAtual', 'objetivo',
    'rotinaDiaria', 'sono', 'frequenciaAtividade', 'horarioTreino',
    'quantidadeRefeicoes', 'preferenciaRefeicoes',
    'tempoPreparacao', 'confortoPesar', 'preferenciaVariacao',
    'restricaoAlimentar', 'opcoesSubstituicao', 'refeicoesLivres',
    'problemasSaude', 'usoMedicacao', 'limitacoesFisicas', 'restricoesMedicasExercicio'
  ]

  // Campos opcionais (incluir apenas se preenchidos)
  const optionalFields = [
    'sentimentosCorpo', 'expectativaSucesso',
    'barreirasTreino', 'tipoAtividade', 'relacaoEmocionalTreino', 
    'preferenciaDificuldadeTreino',
    'alimentosGosta', 'alimentosEvita', 'alimentacaoFimSemana',
    'outraRestricao',
    'quaisProblemasSaude', 'quaisMedicamentos', 'detalhesLimitacao',
    'movimentosEvitar', 'receiosSaude'
  ]

  // Incluir campos básicos
  for (const field of basicFields) {
    if (data[field] !== undefined && data[field] !== null) {
      clean[field] = data[field]
    }
  }

  // Incluir campos opcionais apenas se preenchidos
  for (const field of optionalFields) {
    const value = data[field]
    if (value !== undefined && value !== null && value !== '') {
      clean[field] = value
    }
  }

  // Alimentos do dia a dia (sempre incluir, mesmo se vazio, mas sinalizar como legado)
  if (data.alimentosDoDiaADia !== undefined) {
    clean.alimentosDoDiaADia = data.alimentosDoDiaADia
  }

  return clean
}

/**
 * Adiciona metadados sobre campos legados
 */
function addLegacyMetadata() {
  return {
    alimentosDoDiaADia: true, // Sempre vem vazio, não usado no novo formulário
    rotinaTreinoDetalhada: 'fallback', // Usado apenas como fallback se preferenciaDificuldadeTreino estiver vazio
    outraAtividade: 'fallback' // Usado apenas como fallback se tipoAtividade estiver vazio
  }
}

/**
 * Normaliza dados do questionário para envio aos agentes n8n
 * 
 * @param {Object} questionnaireData - Dados do questionário do Prisma
 * @returns {Object} Dados normalizados com campos derivados e estrutura clean
 */
function normalizeQuestionnaireData(questionnaireData) {
  if (!questionnaireData) {
    return null
  }

  // Converter para objeto simples (remover métodos do Prisma se necessário)
  const data = { ...questionnaireData }

  // 1. Normalizar strings vazias para null
  const normalized = normalizeEmptyStrings(data)

  // 2. Resolver duplicidade semântica (priorizar campos novos)
  const resolved = resolveSemanticDuplicates(normalized)

  // 3. Derivar campos booleanos explícitos
  const derived = deriveBooleanFields(resolved)

  // 4. Criar estrutura clean (apenas campos novos e preenchidos)
  const clean = createCleanStructure(resolved)

  // 5. Adicionar metadados sobre campos legados
  const _legacy = addLegacyMetadata()

  return {
    // Campos originais normalizados (strings vazias → null)
    ...resolved,
    
    // Campos derivados (booleanos explícitos)
    derived,
    
    // Campos limpos (sem legados duplicados, sem vazios)
    clean,
    
    // Metadados sobre campos legados
    _legacy
  }
}

export {
  normalizeQuestionnaireData,
  normalizeEmptyString,
  deriveBooleanFields,
  resolveSemanticDuplicates,
  createCleanStructure,
  addLegacyMetadata
}
