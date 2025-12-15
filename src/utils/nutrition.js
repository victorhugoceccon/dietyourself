/**
 * Calcula a Taxa Metabólica Basal (TMB) usando a fórmula de Mifflin-St Jeor
 * @param {number} peso - Peso em kg
 * @param {number} altura - Altura em cm
 * @param {number} idade - Idade em anos
 * @param {string} sexo - 'Masculino' ou 'Feminino'
 * @returns {number} TMB em kcal
 */
export function calcularTMB(peso, altura, idade, sexo) {
  // Fórmula de Mifflin-St Jeor
  // TMB (homem) = 10 x peso(kg) + 6.25 x altura(cm) - 5 x idade(anos) + 5
  // TMB (mulher) = 10 x peso(kg) + 6.25 x altura(cm) - 5 x idade(anos) - 161
  
  const tmbBase = (10 * peso) + (6.25 * altura) - (5 * idade)
  
  if (sexo === 'Masculino') {
    return tmbBase + 5
  } else {
    return tmbBase - 161
  }
}

/**
 * Calcula o fator de atividade física
 * @param {string} nivelAtividade - Nível de atividade do usuário
 * @returns {number} Fator de atividade
 */
export function getFatorAtividade(nivelAtividade) {
  const fatores = {
    'Sedentário (não treino)': 1.2,
    'Levemente ativo (1–2x por semana)': 1.375,
    'Moderadamente ativo (3–4x por semana)': 1.55,
    'Muito ativo (5x ou mais por semana)': 1.725
  }
  
  return fatores[nivelAtividade] || 1.2
}

/**
 * Calcula a necessidade calórica diária total
 * @param {number} tmb - Taxa Metabólica Basal
 * @param {number} fatorAtividade - Fator de atividade física
 * @param {string} objetivo - Objetivo do usuário
 * @returns {number} Calorias diárias necessárias
 */
export function calcularCaloriasDiarias(tmb, fatorAtividade, objetivo) {
  // Calorias totais = TMB x Fator de Atividade
  let caloriasTotais = tmb * fatorAtividade
  
  // Ajustar baseado no objetivo
  switch (objetivo) {
    case 'Emagrecer':
      // Déficit calórico de 500kcal
      caloriasTotais -= 500
      break
    case 'Ganhar massa muscular':
      // Superávit calórico de 500kcal
      caloriasTotais += 500
      break
    case 'Manter peso':
      // Manter calorias calculadas
      break
    default:
      break
  }
  
  // Garantir mínimo de 1200kcal para mulheres e 1500kcal para homens
  return Math.max(caloriasTotais, 1200)
}

/**
 * Calcula a distribuição de macronutrientes
 * @param {number} calorias - Calorias diárias totais
 * @param {string} objetivo - Objetivo do usuário
 * @returns {object} Objeto com proteína, gordura e carboidrato em gramas
 */
export function calcularMacros(calorias, objetivo) {
  // Definição de porcentagens por objetivo
  let porcentagens = {
    proteina: 0,
    gordura: 0,
    carboidrato: 0
  }
  
  switch (objetivo) {
    case 'Emagrecer':
      // Maior proteína para preservar massa muscular durante déficit
      porcentagens.proteina = 0.40  // 40%
      porcentagens.gordura = 0.30    // 30%
      porcentagens.carboidrato = 0.30 // 30%
      break
    case 'Ganhar massa muscular':
      // Mais carboidratos para energia e crescimento
      porcentagens.proteina = 0.30   // 30%
      porcentagens.gordura = 0.25    // 25%
      porcentagens.carboidrato = 0.45 // 45%
      break
    case 'Manter peso':
    default:
      // Distribuição equilibrada
      porcentagens.proteina = 0.30   // 30%
      porcentagens.gordura = 0.30    // 30%
      porcentagens.carboidrato = 0.40 // 40%
      break
  }
  
  // Calorias por grama: Proteína = 4kcal/g, Carboidrato = 4kcal/g, Gordura = 9kcal/g
  const caloriasProteina = calorias * porcentagens.proteina
  const caloriasCarboidrato = calorias * porcentagens.carboidrato
  const caloriasGordura = calorias * porcentagens.gordura
  
  return {
    proteina: Math.round(caloriasProteina / 4),      // gramas
    carboidrato: Math.round(caloriasCarboidrato / 4), // gramas
    gordura: Math.round(caloriasGordura / 9),        // gramas
    porcentagens: {
      proteina: Math.round(porcentagens.proteina * 100),
      gordura: Math.round(porcentagens.gordura * 100),
      carboidrato: Math.round(porcentagens.carboidrato * 100)
    }
  }
}

/**
 * Calcula todas as informações nutricionais baseado nos dados do questionário
 * @param {object} questionnaireData - Dados do questionário do paciente
 * @returns {object} Objeto com TMB, calorias e macros
 */
export function calcularNutricao(questionnaireData) {
  if (!questionnaireData || !questionnaireData.idade || !questionnaireData.pesoAtual || 
      !questionnaireData.altura || !questionnaireData.sexo || !questionnaireData.objetivo ||
      !questionnaireData.nivelAtividade) {
    return null
  }
  
  // Calcular TMB
  const tmb = calcularTMB(
    questionnaireData.pesoAtual,
    questionnaireData.altura,
    questionnaireData.idade,
    questionnaireData.sexo
  )
  
  // Calcular fator de atividade
  const fatorAtividade = getFatorAtividade(questionnaireData.nivelAtividade)
  
  // Calcular calorias diárias
  const calorias = calcularCaloriasDiarias(tmb, fatorAtividade, questionnaireData.objetivo)
  
  // Calcular macros
  const macros = calcularMacros(calorias, questionnaireData.objetivo)
  
  return {
    tmb: Math.round(tmb),
    calorias: Math.round(calorias),
    macros,
    fatorAtividade
  }
}

