/**
 * Calcula os valores nutricionais consumidos baseado nas refeições marcadas
 */
export function calcularNutricaoConsumida(dieta, consumedMealsIndices = []) {
  if (!dieta || !dieta.refeicoes || consumedMealsIndices.length === 0) {
    return {
      calorias: 0,
      proteina: 0,
      carboidrato: 0,
      gordura: 0
    }
  }

  let totalCalorias = 0
  let totalProteina = 0
  let totalCarboidrato = 0
  let totalGordura = 0

  consumedMealsIndices.forEach(mealIndex => {
    const refeicao = dieta.refeicoes[mealIndex]
    if (!refeicao) return

    // Adicionar calorias da refeição
    totalCalorias += refeicao.totalRefeicaoKcal || 0

    // Calcular macros dos itens da refeição
    if (refeicao.itens) {
      refeicao.itens.forEach(item => {
        const kcal = item.kcal || 0
        
        // Calcular macros baseado nas calorias e distribuição típica
        // Assumindo distribuição padrão: 30% proteína, 40% carboidrato, 30% gordura
        // 1g proteína = 4 kcal, 1g carboidrato = 4 kcal, 1g gordura = 9 kcal
        // Isso é uma aproximação, o ideal seria ter os macros exatos da dieta
        // Por enquanto, vamos usar apenas as calorias e uma estimativa básica
        
        // Tentar extrair macros do item se disponível
        if (item.proteina !== undefined) {
          totalProteina += item.proteina
        }
        if (item.carboidrato !== undefined) {
          totalCarboidrato += item.carboidrato
        }
        if (item.gordura !== undefined || item.lipideos !== undefined) {
          totalGordura += (item.gordura || item.lipideos || 0)
        }
      })
    }
  })

  // Se não tivermos macros exatos, fazer uma estimativa básica
  // Distribuição padrão aproximada
  if (totalProteina === 0 && totalCarboidrato === 0 && totalGordura === 0 && totalCalorias > 0) {
    // Distribuição típica de uma dieta balanceada
    totalProteina = (totalCalorias * 0.25) / 4 // 25% das calorias de proteína
    totalCarboidrato = (totalCalorias * 0.50) / 4 // 50% das calorias de carboidrato
    totalGordura = (totalCalorias * 0.25) / 9 // 25% das calorias de gordura
  }

  return {
    calorias: Math.round(totalCalorias),
    proteina: Math.round(totalProteina * 10) / 10,
    carboidrato: Math.round(totalCarboidrato * 10) / 10,
    gordura: Math.round(totalGordura * 10) / 10
  }
}

