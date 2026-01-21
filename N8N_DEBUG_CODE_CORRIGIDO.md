# 🔧 Código de Debug Corrigido para N8N

## ❌ Problema Identificado

O erro "Code doesn't return items properly" ocorre porque o N8N espera que o código retorne um **array de objetos**, não um objeto único.

## ✅ Código Corrigido

Cole este código no nó **Code** do N8N:

```javascript
// ============================================================
// DEBUG: Verificar todos os dados recebidos (VERSÃO CORRIGIDA)
// ============================================================

// 1. Ver todos os dados JSON recebidos
console.log('📋 Dados JSON recebidos ($json):')
console.log(JSON.stringify($json, null, 2))

// 2. Ver todos os dados binários recebidos
console.log('📦 Dados binários recebidos ($binary):')
console.log('Keys:', Object.keys($binary || {}))
if ($binary) {
  Object.keys($binary).forEach(key => {
    console.log(`  - ${key}: ${$binary[key].mimeType} (${$binary[key].fileName})`)
  })
}

// 3. Ver estrutura completa do input (IMPORTANTE: dados podem estar aqui!)
console.log('🔍 Estrutura completa do input:')
console.log('$input.item keys:', Object.keys($input.item || {}))
console.log('$input.item.json keys:', Object.keys($input.item?.json || {}))
console.log('$input.item.binary keys:', Object.keys($input.item?.binary || {}))

// 4. Tentar acessar dados do questionário (verificar múltiplos locais)
let questionnaireData = null
let questionnaireDataString = null

// Tentar diferentes locais onde os dados podem estar
if ($json.questionnaireData) {
  questionnaireDataString = $json.questionnaireData
  console.log('✅ questionnaireData encontrado em $json.questionnaireData')
} else if ($input.item?.json?.questionnaireData) {
  questionnaireDataString = $input.item.json.questionnaireData
  console.log('✅ questionnaireData encontrado em $input.item.json.questionnaireData')
} else if ($input.item?.questionnaireData) {
  questionnaireDataString = $input.item.questionnaireData
  console.log('✅ questionnaireData encontrado em $input.item.questionnaireData')
} else {
  console.log('⚠️  questionnaireData não encontrado em nenhum local')
  console.log('   $json keys:', Object.keys($json || {}))
  console.log('   $input.item.json keys:', Object.keys($input.item?.json || {}))
}

// Parse do questionário se encontrado
if (questionnaireDataString) {
  try {
    questionnaireData = JSON.parse(questionnaireDataString)
    console.log('✅ Dados do questionário parseados com sucesso!')
    console.log('   UserId:', questionnaireData.userId)
    console.log('   Idade:', questionnaireData.idade)
    console.log('   Objetivo:', questionnaireData.objetivo)
  } catch (error) {
    console.error('❌ Erro ao parsear questionnaireData:', error.message)
  }
}

// 5. Tentar acessar imagens (verificar múltiplos locais)
let fotoFrente = null
let fotoCostas = null

// Tentar diferentes formas de acessar fotoFrente
if ($binary?.fotoFrente) {
  fotoFrente = $binary.fotoFrente
  console.log('✅ Foto Frente encontrada em $binary.fotoFrente')
} else if ($input.item?.binary?.fotoFrente) {
  fotoFrente = $input.item.binary.fotoFrente
  console.log('✅ Foto Frente encontrada em $input.item.binary.fotoFrente')
} else {
  console.log('⚠️  Foto Frente não encontrada')
  console.log('   $binary keys:', Object.keys($binary || {}))
  console.log('   $input.item.binary keys:', Object.keys($input.item?.binary || {}))
}

// Tentar diferentes formas de acessar fotoCostas
if ($binary?.fotoCostas) {
  fotoCostas = $binary.fotoCostas
  console.log('✅ Foto Costas encontrada em $binary.fotoCostas')
} else if ($input.item?.binary?.fotoCostas) {
  fotoCostas = $input.item.binary.fotoCostas
  console.log('✅ Foto Costas encontrada em $input.item.binary.fotoCostas')
} else {
  console.log('⚠️  Foto Costas não encontrada')
}

// 6. IMPORTANTE: Retornar como ARRAY de objetos (requisito do N8N)
return [{
  json: {
    debug: {
      hasQuestionnaireData: !!questionnaireDataString,
      questionnaireDataKeys: questionnaireData ? Object.keys(questionnaireData) : [],
      hasFotoFrente: !!fotoFrente,
      hasFotoCostas: !!fotoCostas,
      fotoFrenteSize: fotoFrente ? (fotoFrente.data?.length || 'unknown') : null,
      fotoCostasSize: fotoCostas ? (fotoCostas.data?.length || 'unknown') : null,
      allJsonKeys: Object.keys($json || {}),
      allBinaryKeys: Object.keys($binary || {}),
      allInputItemKeys: Object.keys($input.item || {}),
      allInputItemJsonKeys: Object.keys($input.item?.json || {})
    },
    // Manter dados originais para passar adiante
    questionnaireData: questionnaireDataString || $json.questionnaireData || $input.item?.json?.questionnaireData,
    // Dados parseados se disponíveis
    ...(questionnaireData && { questionnaireDataParsed: questionnaireData })
  },
  binary: {
    // Manter dados binários originais
    ...($binary || {}),
    ...($input.item?.binary || {}),
    // Garantir que as fotos estejam disponíveis
    ...(fotoFrente && { fotoFrente }),
    ...(fotoCostas && { fotoCostas })
  }
}]
```

## 🔑 Diferenças Principais

1. **Retorno como Array**: `return [{ ... }]` ao invés de `return { ... }`
2. **Verificação Múltipla**: Verifica `$json`, `$input.item.json`, e `$input.item` para encontrar os dados
3. **Logs Detalhados**: Mais logs para identificar onde os dados realmente estão
4. **Preservação de Dados**: Mantém todos os dados originais para passar adiante no workflow

## 📝 Próximos Passos

1. Cole o código corrigido no nó Code
2. Execute o workflow novamente
3. Verifique os logs no console do N8N para ver onde os dados estão
4. Ajuste o código conforme necessário baseado nos logs

## 💡 Dica

Se os dados ainda não aparecerem, verifique a configuração do Webhook:
- **Raw Body** deve estar como `false` (para processar multipart/form-data)
- **Response Mode** pode afetar como os dados são estruturados
