/**
 * Ajusta automaticamente os valores nutricionais da dieta gerada
 * para garantir que batam exatamente com as necessidades nutricionais calculadas
 */

/**
 * Calcula o total de kcal e macros de uma dieta
 * @param {object} dieta - Objeto da dieta com refeicoes
 * @returns {object} Totais calculados { calorias, proteina, carboidrato, gordura }
 */
export function calcularTotaisDieta(dieta) {
  let totalCalorias = 0
  let totalProteina = 0
  let totalCarboidrato = 0
  let totalGordura = 0

  if (!dieta || !dieta.refeicoes || !Array.isArray(dieta.refeicoes)) {
    return { calorias: 0, proteina: 0, carboidrato: 0, gordura: 0 }
  }

  dieta.refeicoes.forEach(refeicao => {
    if (!refeicao.itens || !Array.isArray(refeicao.itens)) return

    refeicao.itens.forEach(item => {
      // Somar kcal
      if (typeof item.kcal === 'number') {
        totalCalorias += item.kcal
      }

      // Somar macros
      if (item.macros && typeof item.macros === 'object') {
        if (typeof item.macros.proteina_g === 'number') {
          totalProteina += item.macros.proteina_g
        }
        if (typeof item.macros.carbo_g === 'number') {
          totalCarboidrato += item.macros.carbo_g
        }
        if (typeof item.macros.gordura_g === 'number') {
          totalGordura += item.macros.gordura_g
        }
      }
    })
  })

  return {
    calorias: Math.round(totalCalorias * 100) / 100, // Arredondar para 2 casas decimais
    proteina: Math.round(totalProteina * 100) / 100,
    carboidrato: Math.round(totalCarboidrato * 100) / 100,
    gordura: Math.round(totalGordura * 100) / 100
  }
}

/**
 * Ajusta os valores nutricionais da dieta para corresponder exatamente às necessidades
 * @param {object} dieta - Objeto da dieta com refeicoes
 * @param {object} necessidades - Necessidades nutricionais { calorias, macros: { proteina, carboidrato, gordura } }
 * @returns {object} Dieta ajustada
 */
/**
 * Ajusta completamente a dieta: valores totais, equilíbrio entre refeições, frutas e vegetais
 * @param {object} dieta - Objeto da dieta com refeicoes
 * @param {object} necessidades - Necessidades nutricionais { calorias, macros: { proteina, carboidrato, gordura } }
 * @returns {object} Dieta completamente ajustada
 */
export function ajustarDietaCompleta(dieta, necessidades) {
  console.log('🔧 Iniciando ajuste completo da dieta...')
  
  // Passo 1: Ajustar valores totais para corresponder às necessidades
  let dietaAjustada = ajustarDietaParaNecessidades(dieta, necessidades)
  
  // Passo 2: Equilibrar distribuição entre refeições
  dietaAjustada = equilibrarRefeicoes(dietaAjustada, necessidades)
  
  // Passo 3: Garantir frutas e vegetais
  dietaAjustada = garantirFrutasEVegetais(dietaAjustada)
  
  // Passo 4: Reajustar valores totais após adicionar frutas/vegetais (para compensar)
  dietaAjustada = ajustarDietaParaNecessidades(dietaAjustada, necessidades)
  
  console.log('✅ Ajuste completo da dieta finalizado')
  
  return dietaAjustada
}

/**
 * Ajusta os valores nutricionais da dieta para corresponder exatamente às necessidades
 * @param {object} dieta - Objeto da dieta com refeicoes
 * @param {object} necessidades - Necessidades nutricionais { calorias, macros: { proteina, carboidrato, gordura } }
 * @returns {object} Dieta ajustada
 */
export function ajustarDietaParaNecessidades(dieta, necessidades) {
  if (!dieta || !dieta.refeicoes || !Array.isArray(dieta.refeicoes) || dieta.refeicoes.length === 0) {
    console.warn('⚠️  Dieta vazia ou inválida, não é possível ajustar')
    return dieta
  }

  if (!necessidades || !necessidades.calorias || !necessidades.macros) {
    console.warn('⚠️  Necessidades nutricionais inválidas, não é possível ajustar')
    return dieta
  }

  // Calcular totais atuais
  const totaisAtuais = calcularTotaisDieta(dieta)

  console.log('📊 Totais atuais da dieta:')
  console.log(`   Calorias: ${totaisAtuais.calorias} kcal (esperado: ${necessidades.calorias} kcal)`)
  console.log(`   Proteína: ${totaisAtuais.proteina}g (esperado: ${necessidades.macros.proteina}g)`)
  console.log(`   Carboidrato: ${totaisAtuais.carboidrato}g (esperado: ${necessidades.macros.carboidrato}g)`)
  console.log(`   Gordura: ${totaisAtuais.gordura}g (esperado: ${necessidades.macros.gordura}g)`)

  // Se os valores já estão muito próximos (diferença < 1%), não ajustar
  const diffCalorias = Math.abs(totaisAtuais.calorias - necessidades.calorias)
  const diffCaloriasPercent = (diffCalorias / necessidades.calorias) * 100

  const diffProteina = Math.abs(totaisAtuais.proteina - necessidades.macros.proteina)
  const diffProteinaPercent = (diffProteina / necessidades.macros.proteina) * 100

  const diffCarboidrato = Math.abs(totaisAtuais.carboidrato - necessidades.macros.carboidrato)
  const diffCarboidratoPercent = (diffCarboidrato / necessidades.macros.carboidrato) * 100

  const diffGordura = Math.abs(totaisAtuais.gordura - necessidades.macros.gordura)
  const diffGorduraPercent = (diffGordura / necessidades.macros.gordura) * 100

  // Se todas as diferenças são < 1%, não precisa ajustar
  if (diffCaloriasPercent < 1 && diffProteinaPercent < 1 && diffCarboidratoPercent < 1 && diffGorduraPercent < 1) {
    console.log('✅ Dieta já está dentro da tolerância (diferença < 1%), não precisa ajustar')
    // Ainda assim, garantir que totalDiaKcal e macrosDia estão corretos
    dieta.totalDiaKcal = necessidades.calorias
    dieta.macrosDia = {
      proteina_g: necessidades.macros.proteina,
      carbo_g: necessidades.macros.carboidrato,
      gordura_g: necessidades.macros.gordura
    }
    return dieta
  }

  console.log('🔧 Ajustando dieta para corresponder exatamente às necessidades...')

  // Calcular fatores de ajuste
  const fatorCalorias = necessidades.calorias / (totaisAtuais.calorias || 1)
  const fatorProteina = necessidades.macros.proteina / (totaisAtuais.proteina || 1)
  const fatorCarboidrato = necessidades.macros.carboidrato / (totaisAtuais.carboidrato || 1)
  const fatorGordura = necessidades.macros.gordura / (totaisAtuais.gordura || 1)

  console.log('📐 Fatores de ajuste:')
  console.log(`   Calorias: ${fatorCalorias.toFixed(4)}`)
  console.log(`   Proteína: ${fatorProteina.toFixed(4)}`)
  console.log(`   Carboidrato: ${fatorCarboidrato.toFixed(4)}`)
  console.log(`   Gordura: ${fatorGordura.toFixed(4)}`)

  // Criar cópia da dieta para ajustar
  const dietaAjustada = JSON.parse(JSON.stringify(dieta))

  // Ajustar cada item de cada refeição
  let totalCaloriasAjustado = 0
  let totalProteinaAjustado = 0
  let totalCarboidratoAjustado = 0
  let totalGorduraAjustado = 0

  dietaAjustada.refeicoes.forEach((refeicao, refeicaoIndex) => {
    if (!refeicao.itens || !Array.isArray(refeicao.itens)) return

    let totalRefeicaoKcal = 0

    refeicao.itens.forEach((item, itemIndex) => {
      // Ajustar kcal
      if (typeof item.kcal === 'number' && item.kcal > 0) {
        item.kcal = Math.round(item.kcal * fatorCalorias * 100) / 100
        totalRefeicaoKcal += item.kcal
        totalCaloriasAjustado += item.kcal
      }

      // Ajustar macros proporcionalmente
      if (item.macros && typeof item.macros === 'object') {
        if (typeof item.macros.proteina_g === 'number' && item.macros.proteina_g > 0) {
          item.macros.proteina_g = Math.round(item.macros.proteina_g * fatorProteina * 100) / 100
          totalProteinaAjustado += item.macros.proteina_g
        }
        if (typeof item.macros.carbo_g === 'number' && item.macros.carbo_g > 0) {
          item.macros.carbo_g = Math.round(item.macros.carbo_g * fatorCarboidrato * 100) / 100
          totalCarboidratoAjustado += item.macros.carbo_g
        }
        if (typeof item.macros.gordura_g === 'number' && item.macros.gordura_g > 0) {
          item.macros.gordura_g = Math.round(item.macros.gordura_g * fatorGordura * 100) / 100
          totalGorduraAjustado += item.macros.gordura_g
        }
      }

      // Ajustar substituições também (proporcionalmente)
      if (item.substituicoes && Array.isArray(item.substituicoes)) {
        item.substituicoes.forEach(substituicao => {
          if (typeof substituicao.kcalAproximada === 'number' && substituicao.kcalAproximada > 0) {
            substituicao.kcalAproximada = Math.round(substituicao.kcalAproximada * fatorCalorias * 100) / 100
          }
          if (substituicao.macrosAproximados && typeof substituicao.macrosAproximados === 'object') {
            if (typeof substituicao.macrosAproximados.proteina_g === 'number' && substituicao.macrosAproximados.proteina_g > 0) {
              substituicao.macrosAproximados.proteina_g = Math.round(substituicao.macrosAproximados.proteina_g * fatorProteina * 100) / 100
            }
            if (typeof substituicao.macrosAproximados.carbo_g === 'number' && substituicao.macrosAproximados.carbo_g > 0) {
              substituicao.macrosAproximados.carbo_g = Math.round(substituicao.macrosAproximados.carbo_g * fatorCarboidrato * 100) / 100
            }
            if (typeof substituicao.macrosAproximados.gordura_g === 'number' && substituicao.macrosAproximados.gordura_g > 0) {
              substituicao.macrosAproximados.gordura_g = Math.round(substituicao.macrosAproximados.gordura_g * fatorGordura * 100) / 100
            }
          }
        })
      }
    })

    // Atualizar total da refeição
    refeicao.totalRefeicaoKcal = Math.round(totalRefeicaoKcal)
  })

  // Garantir que os totais finais estão exatos
  // (pode haver pequenas diferenças por arredondamento, então fazer um ajuste fino final)
  const diffFinalCalorias = necessidades.calorias - totalCaloriasAjustado
  const diffFinalProteina = necessidades.macros.proteina - totalProteinaAjustado
  const diffFinalCarboidrato = necessidades.macros.carboidrato - totalCarboidratoAjustado
  const diffFinalGordura = necessidades.macros.gordura - totalGorduraAjustado

  // Distribuir a diferença residual nos últimos itens (ajuste fino)
  if (Math.abs(diffFinalCalorias) > 0.1 || Math.abs(diffFinalProteina) > 0.1 || 
      Math.abs(diffFinalCarboidrato) > 0.1 || Math.abs(diffFinalGordura) > 0.1) {
    
    console.log('🔧 Aplicando ajuste fino para diferenças residuais...')
    console.log(`   Diferenças: Cal=${diffFinalCalorias.toFixed(2)}, P=${diffFinalProteina.toFixed(2)}, C=${diffFinalCarboidrato.toFixed(2)}, G=${diffFinalGordura.toFixed(2)}`)

    // Encontrar o último item não vazio para ajustar
    let ultimoItemEncontrado = null
    let ultimaRefeicaoIndex = -1
    let ultimoItemIndex = -1

    for (let i = dietaAjustada.refeicoes.length - 1; i >= 0; i--) {
      const refeicao = dietaAjustada.refeicoes[i]
      if (refeicao.itens && refeicao.itens.length > 0) {
        for (let j = refeicao.itens.length - 1; j >= 0; j--) {
          const item = refeicao.itens[j]
          if (item.kcal > 0) {
            ultimoItemEncontrado = item
            ultimaRefeicaoIndex = i
            ultimoItemIndex = j
            break
          }
        }
        if (ultimoItemEncontrado) break
      }
    }

    // Ajustar o último item para compensar diferenças residuais
    if (ultimoItemEncontrado) {
      if (typeof ultimoItemEncontrado.kcal === 'number' && ultimoItemEncontrado.kcal > 0) {
        ultimoItemEncontrado.kcal = Math.round((ultimoItemEncontrado.kcal + diffFinalCalorias) * 100) / 100
        if (ultimoItemEncontrado.kcal < 0) ultimoItemEncontrado.kcal = 0
      }

      if (ultimoItemEncontrado.macros && typeof ultimoItemEncontrado.macros === 'object') {
        if (typeof ultimoItemEncontrado.macros.proteina_g === 'number' && ultimoItemEncontrado.macros.proteina_g > 0) {
          ultimoItemEncontrado.macros.proteina_g = Math.round((ultimoItemEncontrado.macros.proteina_g + diffFinalProteina) * 100) / 100
          if (ultimoItemEncontrado.macros.proteina_g < 0) ultimoItemEncontrado.macros.proteina_g = 0
        }
        if (typeof ultimoItemEncontrado.macros.carbo_g === 'number' && ultimoItemEncontrado.macros.carbo_g > 0) {
          ultimoItemEncontrado.macros.carbo_g = Math.round((ultimoItemEncontrado.macros.carbo_g + diffFinalCarboidrato) * 100) / 100
          if (ultimoItemEncontrado.macros.carbo_g < 0) ultimoItemEncontrado.macros.carbo_g = 0
        }
        if (typeof ultimoItemEncontrado.macros.gordura_g === 'number' && ultimoItemEncontrado.macros.gordura_g > 0) {
          ultimoItemEncontrado.macros.gordura_g = Math.round((ultimoItemEncontrado.macros.gordura_g + diffFinalGordura) * 100) / 100
          if (ultimoItemEncontrado.macros.gordura_g < 0) ultimoItemEncontrado.macros.gordura_g = 0
        }
      }

      // Recalcular total da refeição
      const refeicao = dietaAjustada.refeicoes[ultimaRefeicaoIndex]
      refeicao.totalRefeicaoKcal = Math.round(refeicao.itens.reduce((sum, item) => sum + (item.kcal || 0), 0))
    }
  }

  // Atualizar totais da dieta
  dietaAjustada.totalDiaKcal = necessidades.calorias
  dietaAjustada.macrosDia = {
    proteina_g: necessidades.macros.proteina,
    carbo_g: necessidades.macros.carboidrato,
    gordura_g: necessidades.macros.gordura
  }

  // Verificar totais finais
  const totaisFinais = calcularTotaisDieta(dietaAjustada)
  console.log('✅ Totais finais após ajuste:')
  console.log(`   Calorias: ${totaisFinais.calorias} kcal (esperado: ${necessidades.calorias} kcal) - Diferença: ${Math.abs(totaisFinais.calorias - necessidades.calorias).toFixed(2)} kcal`)
  console.log(`   Proteína: ${totaisFinais.proteina}g (esperado: ${necessidades.macros.proteina}g) - Diferença: ${Math.abs(totaisFinais.proteina - necessidades.macros.proteina).toFixed(2)}g`)
  console.log(`   Carboidrato: ${totaisFinais.carboidrato}g (esperado: ${necessidades.macros.carboidrato}g) - Diferença: ${Math.abs(totaisFinais.carboidrato - necessidades.macros.carboidrato).toFixed(2)}g`)
  console.log(`   Gordura: ${totaisFinais.gordura}g (esperado: ${necessidades.macros.gordura}g) - Diferença: ${Math.abs(totaisFinais.gordura - necessidades.macros.gordura).toFixed(2)}g`)

  return dietaAjustada
}

/**
 * Verifica se um alimento é uma fruta (busca por palavras-chave comuns)
 * @param {string} alimento - Nome do alimento
 * @returns {boolean}
 */
function isFruta(alimento) {
  if (!alimento || typeof alimento !== 'string') return false
  
  const frutas = [
    'banana', 'maçã', 'laranja', 'pera', 'uva', 'mamão', 'manga', 'abacaxi',
    'melancia', 'morango', 'kiwi', 'pêssego', 'ameixa', 'caqui', 'tangerina',
    'limão', 'acerola', 'caju', 'goiaba', 'maracujá', 'abacate', 'carambola'
  ]
  
  const alimentoLower = alimento.toLowerCase()
  return frutas.some(fruta => alimentoLower.includes(fruta))
}

/**
 * Verifica se um alimento é vegetal/salada (busca por palavras-chave comuns)
 * @param {string} alimento - Nome do alimento
 * @returns {boolean}
 */
function isVegetal(alimento) {
  if (!alimento || typeof alimento !== 'string') return false
  
  const vegetais = [
    'alface', 'rúcula', 'agrião', 'repolho', 'couve', 'brócolis', 'espinafre',
    'couve-flor', 'cenoura', 'tomate', 'pepino', 'abobrinha', 'berinjela',
    'chuchu', 'vagem', 'quiabo', 'pimentão', 'cebola', 'alho', 'salada',
    'legume', 'verdura', 'folha'
  ]
  
  const alimentoLower = alimento.toLowerCase()
  return vegetais.some(vegetal => alimentoLower.includes(vegetal))
}

/**
 * Calcula a distribuição percentual de macros por refeição
 * @param {object} dieta - Objeto da dieta com refeicoes
 * @returns {object} Distribuição percentual { refeicoes: [{ nome, proteinaPct, carboPct, gorduraPct, caloriasPct }] }
 */
export function calcularDistribuicaoRefeicoes(dieta) {
  if (!dieta || !dieta.refeicoes || !Array.isArray(dieta.refeicoes)) {
    return { refeicoes: [] }
  }

  // Calcular totais diários
  const totais = calcularTotaisDieta(dieta)
  
  const distribuicao = dieta.refeicoes.map(refeicao => {
    let refeicaoProteina = 0
    let refeicaoCarbo = 0
    let refeicaoGordura = 0
    let refeicaoCalorias = 0

    if (refeicao.itens && Array.isArray(refeicao.itens)) {
      refeicao.itens.forEach(item => {
        if (typeof item.kcal === 'number') refeicaoCalorias += item.kcal
        if (item.macros && typeof item.macros === 'object') {
          refeicaoProteina += item.macros.proteina_g || 0
          refeicaoCarbo += item.macros.carbo_g || 0
          refeicaoGordura += item.macros.gordura_g || 0
        }
      })
    }

    return {
      nome: refeicao.nome || '',
      proteinaPct: totais.proteina > 0 ? (refeicaoProteina / totais.proteina) * 100 : 0,
      carboPct: totais.carboidrato > 0 ? (refeicaoCarbo / totais.carboidrato) * 100 : 0,
      gorduraPct: totais.gordura > 0 ? (refeicaoGordura / totais.gordura) * 100 : 0,
      caloriasPct: totais.calorias > 0 ? (refeicaoCalorias / totais.calorias) * 100 : 0,
      proteinaAbs: refeicaoProteina,
      carboAbs: refeicaoCarbo,
      gorduraAbs: refeicaoGordura,
      caloriasAbs: refeicaoCalorias
    }
  })

  return { refeicoes: distribuicao, totais }
}

/**
 * Equilibra a distribuição de macronutrientes entre as refeições
 * Garante que cada refeição tenha 20-35% dos macros (25% ideal, 35% para almoço/jantar)
 * @param {object} dieta - Objeto da dieta com refeicoes
 * @param {object} necessidades - Necessidades nutricionais { calorias, macros: { proteina, carboidrato, gordura } }
 * @returns {object} Dieta equilibrada
 */
export function equilibrarRefeicoes(dieta, necessidades) {
  if (!dieta || !dieta.refeicoes || !Array.isArray(dieta.refeicoes) || dieta.refeicoes.length === 0) {
    console.warn('⚠️  Dieta vazia ou inválida, não é possível equilibrar')
    return dieta
  }

  if (!necessidades || !necessidades.calorias || !necessidades.macros) {
    console.warn('⚠️  Necessidades nutricionais inválidas, não é possível equilibrar')
    return dieta
  }

  console.log('⚖️  Equilibrando distribuição de macronutrientes entre refeições...')
  
  const numRefeicoes = dieta.refeicoes.length
  const idealPct = 100 / numRefeicoes // Porcentagem ideal por refeição
  const minPct = 20 // Mínimo aceitável
  const maxPctRefeicoesMenores = 35 // Máximo para refeições menores
  const maxPctRefeicoesMaiores = 40 // Máximo para almoço/jantar
  
  // Identificar refeições maiores (almoço e jantar)
  const refeicoesMaiores = ['almoço', 'jantar', 'almoco', 'janta'].map(n => n.toLowerCase())
  
  // Calcular distribuição atual
  const distribuicaoAtual = calcularDistribuicaoRefeicoes(dieta)
  
  console.log('📊 Distribuição atual:')
  distribuicaoAtual.refeicoes.forEach((dist, index) => {
    const isRefeicaoMaior = refeicoesMaiores.some(rm => dist.nome.toLowerCase().includes(rm))
    const maxPctPermitido = isRefeicaoMaior ? maxPctRefeicoesMaiores : maxPctRefeicoesMenores
    console.log(`   ${dist.nome}:`)
    console.log(`      Proteína: ${dist.proteinaPct.toFixed(1)}% (ideal: ${idealPct.toFixed(1)}%, max: ${maxPctPermitido}%)`)
    console.log(`      Carboidrato: ${dist.carboPct.toFixed(1)}% (ideal: ${idealPct.toFixed(1)}%, max: ${maxPctPermitido}%)`)
    console.log(`      Calorias: ${dist.caloriasPct.toFixed(1)}%`)
  })

  // Verificar se precisa reequilibrar
  let precisaReequilibrar = false
  
  distribuicaoAtual.refeicoes.forEach((dist, index) => {
    const isRefeicaoMaior = refeicoesMaiores.some(rm => dist.nome.toLowerCase().includes(rm))
    const maxPctPermitido = isRefeicaoMaior ? maxPctRefeicoesMaiores : maxPctRefeicoesMenores
    
    // Verificar proteína
    if (dist.proteinaPct < minPct || dist.proteinaPct > maxPctPermitido) {
      precisaReequilibrar = true
    }
    // Verificar carboidrato
    if (dist.carboPct < minPct || dist.carboPct > maxPctPermitido) {
      precisaReequilibrar = true
    }
  })

  if (!precisaReequilibrar) {
    console.log('✅ Distribuição já está equilibrada, não precisa reequilibrar')
    return dieta
  }

  console.log('🔧 Reequilibrando distribuição...')

  // Criar cópia da dieta
  const dietaEquilibrada = JSON.parse(JSON.stringify(dieta))
  
  // Calcular valores ideais por refeição
  const proteinaPorRefeicao = necessidades.macros.proteina / numRefeicoes
  const carboPorRefeicao = necessidades.macros.carboidrato / numRefeicoes
  const gorduraPorRefeicao = necessidades.macros.gordura / numRefeicoes
  const caloriasPorRefeicao = necessidades.calorias / numRefeicoes

  // Para refeições maiores, permitir até 35-40%
  const proteinaRefeicaoMaior = necessidades.macros.proteina * 0.35
  const carboRefeicaoMaior = necessidades.macros.carboidrato * 0.35
  const gorduraRefeicaoMaior = necessidades.macros.gordura * 0.35
  const caloriasRefeicaoMaior = necessidades.calorias * 0.35

  // Ajustar cada refeição
  dietaEquilibrada.refeicoes.forEach((refeicao, index) => {
    const isRefeicaoMaior = refeicoesMaiores.some(rm => refeicao.nome.toLowerCase().includes(rm))
    const distAtual = distribuicaoAtual.refeicoes[index]
    
    // Valores alvo para esta refeição
    let alvoProteina, alvoCarbo, alvoGordura, alvoCalorias
    
    if (isRefeicaoMaior) {
      // Para almoço/jantar, permitir 30-35%
      alvoProteina = necessidades.macros.proteina * 0.325
      alvoCarbo = necessidades.macros.carboidrato * 0.325
      alvoGordura = necessidades.macros.gordura * 0.325
      alvoCalorias = necessidades.calorias * 0.325
    } else {
      // Para outras refeições, usar valor médio
      alvoProteina = proteinaPorRefeicao
      alvoCarbo = carboPorRefeicao
      alvoGordura = gorduraPorRefeicao
      alvoCalorias = caloriasPorRefeicao
    }

    // Calcular totais atuais desta refeição
    let atualProteina = 0
    let atualCarbo = 0
    let atualGordura = 0
    let atualCalorias = 0

    if (refeicao.itens && Array.isArray(refeicao.itens)) {
      refeicao.itens.forEach(item => {
        if (typeof item.kcal === 'number') atualCalorias += item.kcal
        if (item.macros && typeof item.macros === 'object') {
          atualProteina += item.macros.proteina_g || 0
          atualCarbo += item.macros.carbo_g || 0
          atualGordura += item.macros.gordura_g || 0
        }
      })
    }

    // Calcular fatores de ajuste
    const fatorProteina = atualProteina > 0 ? alvoProteina / atualProteina : 1
    const fatorCarbo = atualCarbo > 0 ? alvoCarbo / atualCarbo : 1
    const fatorGordura = atualGordura > 0 ? alvoGordura / atualGordura : 1
    const fatorCalorias = atualCalorias > 0 ? alvoCalorias / atualCalorias : 1

    // Ajustar itens desta refeição
    if (refeicao.itens && Array.isArray(refeicao.itens)) {
      let novoTotalCalorias = 0
      
      refeicao.itens.forEach(item => {
        // Usar fator médio (peso ponderado) para manter proporções
        const fatorMedio = (fatorCalorias + fatorProteina + fatorCarbo + fatorGordura) / 4
        
        // Ajustar kcal
        if (typeof item.kcal === 'number' && item.kcal > 0) {
          item.kcal = Math.round(item.kcal * fatorMedio * 100) / 100
          novoTotalCalorias += item.kcal
        }

        // Ajustar macros proporcionalmente
        if (item.macros && typeof item.macros === 'object') {
          if (typeof item.macros.proteina_g === 'number' && item.macros.proteina_g > 0) {
            item.macros.proteina_g = Math.round(item.macros.proteina_g * fatorMedio * 100) / 100
          }
          if (typeof item.macros.carbo_g === 'number' && item.macros.carbo_g > 0) {
            item.macros.carbo_g = Math.round(item.macros.carbo_g * fatorMedio * 100) / 100
          }
          if (typeof item.macros.gordura_g === 'number' && item.macros.gordura_g > 0) {
            item.macros.gordura_g = Math.round(item.macros.gordura_g * fatorMedio * 100) / 100
          }
        }
      })

      refeicao.totalRefeicaoKcal = Math.round(novoTotalCalorias)
    }
  })

  console.log('✅ Reequilíbrio concluído')
  
  // Verificar distribuição final
  const distribuicaoFinal = calcularDistribuicaoRefeicoes(dietaEquilibrada)
  console.log('📊 Distribuição final após reequilíbrio:')
  distribuicaoFinal.refeicoes.forEach(dist => {
    console.log(`   ${dist.nome}: P=${dist.proteinaPct.toFixed(1)}% C=${dist.carboPct.toFixed(1)}% Cal=${dist.caloriasPct.toFixed(1)}%`)
  })

  return dietaEquilibrada
}

/**
 * Garante que há pelo menos 2 porções de frutas no dia e vegetais em todas as refeições
 * @param {object} dieta - Objeto da dieta com refeicoes
 * @returns {object} Dieta com frutas e vegetais garantidos
 */
export function garantirFrutasEVegetais(dieta) {
  if (!dieta || !dieta.refeicoes || !Array.isArray(dieta.refeicoes)) {
    console.warn('⚠️  Dieta vazia ou inválida, não é possível adicionar frutas/vegetais')
    return dieta
  }

  console.log('🍎🍅 Verificando frutas e vegetais na dieta...')

  const dietaCompleta = JSON.parse(JSON.stringify(dieta))
  let frutasEncontradas = 0
  const refeicoesSemVegetais = []

  // Identificar refeições principais (almoço e jantar) para verificar vegetais
  const refeicoesPrincipaisNomes = ['almoço', 'almoco', 'jantar', 'janta'].map(n => n.toLowerCase())
  
  // Verificar frutas e vegetais existentes
  dietaCompleta.refeicoes.forEach((refeicao, refeicaoIndex) => {
    const nomeRefeicaoLower = refeicao.nome.toLowerCase()
    const isRefeicaoPrincipal = refeicoesPrincipaisNomes.some(rp => nomeRefeicaoLower.includes(rp))
    
    // Só verificar vegetais em refeições principais (almoço/jantar)
    if (isRefeicaoPrincipal) {
      let temVegetal = false
      
      if (refeicao.itens && Array.isArray(refeicao.itens)) {
        refeicao.itens.forEach(item => {
          if (item.alimento) {
            if (isFruta(item.alimento)) {
              frutasEncontradas++
            }
            if (isVegetal(item.alimento)) {
              temVegetal = true
            }
          }
        })
      }
      
      // Só adicionar à lista se for refeição principal e não tiver vegetal
      if (!temVegetal) {
        refeicoesSemVegetais.push({ refeicaoIndex, nome: refeicao.nome })
      }
    } else {
      // Para refeições não principais, só contar frutas
      if (refeicao.itens && Array.isArray(refeicao.itens)) {
        refeicao.itens.forEach(item => {
          if (item.alimento && isFruta(item.alimento)) {
            frutasEncontradas++
          }
        })
      }
    }
  })

  console.log(`   Frutas encontradas: ${frutasEncontradas}`)
  console.log(`   Refeições sem vegetais: ${refeicoesSemVegetais.length}`)

  // Adicionar frutas se necessário (mínimo 2 porções)
  const frutasParaAdicionar = Math.max(0, 2 - frutasEncontradas)
  
  if (frutasParaAdicionar > 0) {
    console.log(`   Adicionando ${frutasParaAdicionar} porção(ões) de fruta...`)
    
    // Adicionar frutas em refeições menores (lanches)
    const refeicoesLanche = dietaCompleta.refeicoes.filter((r, idx) => {
      const nomeLower = r.nome.toLowerCase()
      return !nomeLower.includes('almoço') && 
             !nomeLower.includes('almoco') && 
             !nomeLower.includes('jantar') && 
             !nomeLower.includes('janta') &&
             !nomeLower.includes('café') &&
             !nomeLower.includes('cafe')
    })

    // Se não há lanches, adicionar em qualquer refeição
    const refeicoesParaAdicionar = refeicoesLanche.length > 0 ? refeicoesLanche : dietaCompleta.refeicoes

    for (let i = 0; i < frutasParaAdicionar && i < refeicoesParaAdicionar.length; i++) {
      const refeicao = refeicoesParaAdicionar[i]
      
      // Adicionar banana como fruta padrão (fácil de calcular)
      if (!refeicao.itens) refeicao.itens = []
      
      refeicao.itens.push({
        alimento: "Banana, nanica, crua",
        porcao: "100g",
        kcal: 92,
        macros: {
          proteina_g: 1.4,
          carbo_g: 23.8,
          gordura_g: 0.1
        },
        substituicoes: [
          {
            alimento: "Maçã, Argentina, com casca, crua",
            porcaoEquivalente: "100g",
            kcalAproximada: 63,
            macrosAproximados: {
              proteina_g: 0.2,
              carbo_g: 16.6,
              gordura_g: 0.2
            }
          },
          {
            alimento: "Mamão, Formosa, cru",
            porcaoEquivalente: "100g",
            kcalAproximada: 45,
            macrosAproximados: {
              proteina_g: 0.8,
              carbo_g: 11.6,
              gordura_g: 0.1
            }
          }
        ]
      })

      // Atualizar total da refeição
      const totalRefeicao = refeicao.itens.reduce((sum, item) => sum + (item.kcal || 0), 0)
      refeicao.totalRefeicaoKcal = Math.round(totalRefeicao)
    }
  }

  // Adicionar vegetais/saladas APENAS em almoço e jantar (refeições principais)
  // Não adicionar em café da manhã, lanches, ceia, etc.
  const refeicoesPrincipais = ['almoço', 'almoco', 'jantar', 'janta'].map(n => n.toLowerCase())
  
  // Filtrar apenas refeições principais sem vegetais
  const refeicoesPrincipaisSemVegetais = refeicoesSemVegetais.filter(({ nome }) => {
    const nomeLower = nome.toLowerCase()
    return refeicoesPrincipais.some(rp => nomeLower.includes(rp))
  })
  
  if (refeicoesPrincipaisSemVegetais.length > 0) {
    console.log(`   Adicionando vegetais/saladas em ${refeicoesPrincipaisSemVegetais.length} refeição(ões) principais (almoço/jantar)...`)
    
    refeicoesPrincipaisSemVegetais.forEach(({ refeicaoIndex, nome }) => {
      const refeicao = dietaCompleta.refeicoes[refeicaoIndex]
      
      if (!refeicao.itens) refeicao.itens = []
      
      // Adicionar salada padrão (alface)
      refeicao.itens.push({
        alimento: "Salada, alface crespa, crua",
        porcao: "50g",
        kcal: 6,
        macros: {
          proteina_g: 0.65,
          carbo_g: 0.85,
          gordura_g: 0.1
        },
        substituicoes: [
          {
            alimento: "Salada, rúcula, crua",
            porcaoEquivalente: "50g",
            kcalAproximada: 7,
            macrosAproximados: {
              proteina_g: 0.9,
              carbo_g: 1.1,
              gordura_g: 0.05
            }
          },
          {
            alimento: "Brócolis, cozido",
            porcaoEquivalente: "50g",
            kcalAproximada: 12.5,
            macrosAproximados: {
              proteina_g: 1.05,
              carbo_g: 2.2,
              gordura_g: 0.25
            }
          }
        ]
      })

      // Atualizar total da refeição
      const totalRefeicao = refeicao.itens.reduce((sum, item) => sum + (item.kcal || 0), 0)
      refeicao.totalRefeicaoKcal = Math.round(totalRefeicao)
    })
  } else if (refeicoesSemVegetais.length > 0) {
    console.log(`   ⚠️  ${refeicoesSemVegetais.length} refeição(ões) sem vegetais, mas não são almoço/jantar - não adicionando`)
  }

  console.log('✅ Frutas e vegetais verificados e adicionados se necessário')
  
  return dietaCompleta
}

