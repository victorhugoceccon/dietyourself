import html2canvas from 'html2canvas'

/**
 * Exporta um elemento HTML como imagem PNG.
 * @param {HTMLElement} element - Elemento a ser exportado
 * @param {string} filename - Nome do arquivo (sem extensão)
 * @returns {Promise<void>}
 */
export async function exportAsPng(element, filename = 'export') {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Melhor qualidade
      useCORS: true,
      backgroundColor: null,
      logging: false
    })

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('Erro ao exportar como PNG:', error)
    throw error
  }
}

/**
 * Exporta dados da dieta como texto formatado.
 * @param {Object} dieta - Objeto da dieta
 * @param {string} pacienteName - Nome do paciente
 * @returns {string} - Texto formatado
 */
export function formatDietaAsText(dieta, pacienteName = 'Paciente') {
  if (!dieta || !dieta.refeicoes) return ''

  // Design Monster Ultra - Gradientes e estilo moderno
  let text = `╔═══════════════════════════════════════════════════════════╗\n`
  text += `║                                                           ║\n`
  text += `║          🥗 PLANO ALIMENTAR PERSONALIZADO 🥗            ║\n`
  text += `║                                                           ║\n`
  text += `║              ${pacienteName.toUpperCase().padEnd(43)}║\n`
  text += `║                                                           ║\n`
  text += `╚═══════════════════════════════════════════════════════════╝\n\n`
  
  // Informações nutricionais destacadas
  text += `┌─────────────────────────────────────────────────────────┐\n`
  text += `│  📊 META NUTRICIONAL DIÁRIA                             │\n`
  text += `├─────────────────────────────────────────────────────────┤\n`
  text += `│  🔥 Calorias: ${String(dieta.totalDiaKcal || 0).padStart(6)} kcal                                    │\n`
  
  if (dieta.macrosDia) {
    text += `│  💪 Proteínas: ${String(dieta.macrosDia.proteina_g || 0).padStart(5)}g                              │\n`
    text += `│  🍞 Carboidratos: ${String(dieta.macrosDia.carbo_g || 0).padStart(4)}g                            │\n`
    text += `│  🥑 Gorduras: ${String(dieta.macrosDia.gordura_g || 0).padStart(5)}g                               │\n`
  }
  
  text += `└─────────────────────────────────────────────────────────┘\n\n`

  // Refeições com design melhorado
  dieta.refeicoes.forEach((refeicao, idx) => {
    text += `╔═══════════════════════════════════════════════════════════╗\n`
    text += `║  🍽️  ${refeicao.nome.toUpperCase().padEnd(47)}║\n`
    text += `║  ${String(refeicao.totalRefeicaoKcal || 0).padStart(6)} kcal total${' '.repeat(40)}║\n`
    text += `╠═══════════════════════════════════════════════════════════╣\n`
    
    if (refeicao.itens && refeicao.itens.length > 0) {
      refeicao.itens.forEach((item, itemIdx) => {
        const alimento = item.alimento || 'Alimento não especificado'
        const porcao = item.porcao || 'N/A'
        const kcal = item.kcal || 0
        
        text += `║  • ${alimento.padEnd(50)}║\n`
        text += `║    └─ Porção: ${String(porcao).padEnd(8)} | ${String(kcal).padStart(4)} kcal${' '.repeat(20)}║\n`
        
        if (item.macros) {
          const macros = `P:${String(item.macros.proteina_g || 0).padStart(4)}g C:${String(item.macros.carbo_g || 0).padStart(4)}g G:${String(item.macros.gordura_g || 0).padStart(4)}g`
          text += `║      ${macros.padEnd(51)}║\n`
        }
        
        if (itemIdx < refeicao.itens.length - 1) {
          text += `║                                                           ║\n`
        }
      })
    } else {
      text += `║  (Nenhum item cadastrado)${' '.repeat(30)}║\n`
    }
    
    text += `╚═══════════════════════════════════════════════════════════╝\n\n`
  })

  // Rodapé estilizado
  text += `┌─────────────────────────────────────────────────────────┐\n`
  text += `│  Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${' '.repeat(20)}│\n`
  text += `│  LifeFit Diet - Sistema de Nutrição Personalizada       │\n`
  text += `│  💚 Transformando vidas através da alimentação 💚       │\n`
  text += `└─────────────────────────────────────────────────────────┘\n`

  return text
}

/**
 * Exporta dieta como arquivo TXT.
 * @param {Object} dieta - Objeto da dieta
 * @param {string} pacienteName - Nome do paciente
 */
export function exportDietaAsTxt(dieta, pacienteName = 'Paciente') {
  const text = formatDietaAsText(dieta, pacienteName)
  
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.download = `dieta_${pacienteName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Copia dieta para a área de transferência.
 * @param {Object} dieta - Objeto da dieta
 * @param {string} pacienteName - Nome do paciente
 * @returns {Promise<boolean>}
 */
export async function copyDietaToClipboard(dieta, pacienteName = 'Paciente') {
  try {
    const text = formatDietaAsText(dieta, pacienteName)
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error)
    return false
  }
}

/**
 * Formata dados de evolução do paciente como texto.
 * @param {Array} checkIns - Lista de check-ins
 * @param {Object} questionnaireData - Dados do questionário
 * @returns {string}
 */
export function formatProgressReport(checkIns, questionnaireData) {
  let text = `RELATÓRIO DE EVOLUÇÃO\n`
  text += `${'='.repeat(50)}\n\n`

  if (questionnaireData) {
    text += `DADOS INICIAIS:\n`
    text += `• Peso inicial: ${questionnaireData.pesoAtual || 'N/A'} kg\n`
    text += `• Altura: ${questionnaireData.altura || 'N/A'} cm\n`
    text += `• Objetivo: ${questionnaireData.objetivo || 'N/A'}\n\n`
  }

  if (checkIns && checkIns.length > 0) {
    text += `HISTÓRICO DE CHECK-INS:\n`
    text += `${'-'.repeat(30)}\n`
    
    checkIns.slice(0, 30).forEach(checkIn => {
      const date = new Date(checkIn.createdAt).toLocaleDateString('pt-BR')
      text += `${date}: `
      text += `Peso: ${checkIn.pesoAtual || 'N/A'} kg | `
      text += `Aderência: ${checkIn.adherence || 'N/A'}\n`
    })

    // Calcular variação de peso
    const firstCheckIn = checkIns[checkIns.length - 1]
    const lastCheckIn = checkIns[0]
    if (firstCheckIn?.pesoAtual && lastCheckIn?.pesoAtual) {
      const variation = (lastCheckIn.pesoAtual - firstCheckIn.pesoAtual).toFixed(1)
      const signal = variation > 0 ? '+' : ''
      text += `\nVariação total de peso: ${signal}${variation} kg\n`
    }
  }

  text += `\n${'='.repeat(50)}\n`
  text += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n`

  return text
}

/**
 * Exporta relatório de evolução como TXT.
 */
export function exportProgressAsTxt(checkIns, questionnaireData, pacienteName = 'Paciente') {
  const text = formatProgressReport(checkIns, questionnaireData)
  
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.download = `evolucao_${pacienteName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}


