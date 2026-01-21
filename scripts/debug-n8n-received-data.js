/**
 * Script para mostrar como acessar os dados recebidos no N8N
 * 
 * Este script mostra exemplos de código para usar no N8N Code Node
 * para verificar o que está sendo recebido do webhook
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  CÓDIGO PARA USAR NO N8N CODE NODE - VERIFICAR DADOS         ║
╚════════════════════════════════════════════════════════════════╝

Cole este código no primeiro nó "Code" após o Webhook no N8N:

─────────────────────────────────────────────────────────────────

// ============================================================
// DEBUG: Verificar todos os dados recebidos
// ============================================================

// 1. Ver todos os dados JSON recebidos
console.log('📋 Dados JSON recebidos:')
console.log(JSON.stringify($json, null, 2))

// 2. Ver todos os dados binários recebidos
console.log('📦 Dados binários recebidos:')
console.log('Keys:', Object.keys($binary || {}))
if ($binary) {
  Object.keys($binary).forEach(key => {
    console.log(\`  - \${key}: \${$binary[key].mimeType} (\${$binary[key].fileName})\`)
  })
}

// 3. Ver estrutura completa do input
console.log('🔍 Estrutura completa do input:')
console.log('$input.item keys:', Object.keys($input.item || {}))
console.log('$input.item.json keys:', Object.keys($input.item?.json || {}))
console.log('$input.item.binary keys:', Object.keys($input.item?.binary || {}))

// 4. Tentar acessar dados do questionário
let questionnaireData = null
try {
  if ($json.questionnaireData) {
    questionnaireData = JSON.parse($json.questionnaireData)
    console.log('✅ Dados do questionário parseados com sucesso!')
    console.log('   UserId:', questionnaireData.userId)
    console.log('   Idade:', questionnaireData.idade)
    console.log('   Objetivo:', questionnaireData.objetivo)
  } else {
    console.log('⚠️  $json.questionnaireData não encontrado')
  }
} catch (error) {
  console.error('❌ Erro ao parsear questionnaireData:', error.message)
}

// 5. Tentar acessar imagens
let fotoFrente = null
let fotoCostas = null

// Tentar diferentes formas de acessar
if ($binary?.fotoFrente) {
  fotoFrente = $binary.fotoFrente
  console.log('✅ Foto Frente encontrada em $binary.fotoFrente')
} else if ($input.item?.binary?.fotoFrente) {
  fotoFrente = $input.item.binary.fotoFrente
  console.log('✅ Foto Frente encontrada em $input.item.binary.fotoFrente')
} else {
  console.log('⚠️  Foto Frente não encontrada')
}

if ($binary?.fotoCostas) {
  fotoCostas = $binary.fotoCostas
  console.log('✅ Foto Costas encontrada em $binary.fotoCostas')
} else if ($input.item?.binary?.fotoCostas) {
  fotoCostas = $input.item.binary.fotoCostas
  console.log('✅ Foto Costas encontrada em $input.item.binary.fotoCostas')
} else {
  console.log('⚠️  Foto Costas não encontrada')
}

// 6. Retornar resumo para visualização
return {
  json: {
    debug: {
      hasQuestionnaireData: !!$json.questionnaireData,
      questionnaireDataKeys: questionnaireData ? Object.keys(questionnaireData) : [],
      hasFotoFrente: !!fotoFrente,
      hasFotoCostas: !!fotoCostas,
      fotoFrenteSize: fotoFrente ? (fotoFrente.data?.length || 'unknown') : null,
      fotoCostasSize: fotoCostas ? (fotoCostas.data?.length || 'unknown') : null,
      allJsonKeys: Object.keys($json),
      allBinaryKeys: Object.keys($binary || {}),
      allInputItemKeys: Object.keys($input.item || {})
    },
    // Manter dados originais para passar adiante
    questionnaireData: $json.questionnaireData,
    // Se precisar passar as imagens adiante, mantenha em binary
    ...(fotoFrente && { fotoFrente }),
    ...(fotoCostas && { fotoCostas })
  },
  binary: {
    ...($binary || {}),
    ...($input.item?.binary || {})
  }
}

─────────────────────────────────────────────────────────────────

📝 INSTRUÇÕES:

1. Adicione um nó "Code" logo após o Webhook no seu workflow N8N
2. Cole o código acima no nó Code
3. Execute o workflow (ou aguarde uma requisição real)
4. Verifique os logs do N8N para ver o que foi captado
5. Ajuste o código conforme necessário baseado no que aparecer nos logs

💡 DICA: Os logs aparecerão no console do N8N quando você executar o workflow.

`)
