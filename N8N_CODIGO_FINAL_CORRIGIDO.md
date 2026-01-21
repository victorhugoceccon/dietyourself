# ✅ Código Final Corrigido para N8N

## ⚠️ Problemas Identificados

1. **Modo incorreto**: "Run Once for Each Item" → deve ser **"Run Once for All Items"**
2. **Erro de sintaxe**: Pode estar relacionado ao spread operator ou estrutura do return
3. **Dados binários não acessíveis**: Precisam ser acessados corretamente

## ✅ Configuração Correta do Nó Code

### 1. Configuração do Nó

- **Mode**: `Run Once for All Items` ⚠️ **IMPORTANTE!**
- **Language**: `JavaScript`

### 2. Código Corrigido (Sem Erros de Sintaxe)

```javascript
// ============================================================
// DEBUG: Verificar dados recebidos do multipart/form-data
// Modo: Run Once for All Items
// ============================================================

// 1. Logs para debug
console.log('📋 $json keys:', Object.keys($json || {}))
console.log('📦 $binary keys:', Object.keys($binary || {}))
console.log('🔍 $input.item keys:', Object.keys($input.item || {}))
console.log('🔍 $input.item.json keys:', Object.keys($input.item?.json || {}))
console.log('🔍 $input.item.binary keys:', Object.keys($input.item?.binary || {}))

// 2. Verificar questionnaireData
let questionnaireData = null
let questionnaireDataString = null

if ($json && $json.questionnaireData) {
  questionnaireDataString = $json.questionnaireData
  console.log('✅ questionnaireData encontrado em $json')
} else if ($input.item && $input.item.json && $input.item.json.questionnaireData) {
  questionnaireDataString = $input.item.json.questionnaireData
  console.log('✅ questionnaireData encontrado em $input.item.json')
} else if ($input.item && $input.item.questionnaireData) {
  questionnaireDataString = $input.item.questionnaireData
  console.log('✅ questionnaireData encontrado em $input.item')
} else {
  console.log('⚠️ questionnaireData não encontrado')
  console.log('   $json completo:', JSON.stringify($json, null, 2))
}

// Parse do questionário
if (questionnaireDataString) {
  try {
    questionnaireData = JSON.parse(questionnaireDataString)
    console.log('✅ Questionnaire parseado! UserId:', questionnaireData.userId)
  } catch (error) {
    console.error('❌ Erro ao parsear:', error.message)
  }
}

// 3. Verificar imagens (múltiplas tentativas)
let fotoFrente = null
let fotoCostas = null

// Tentar $binary primeiro
if ($binary && $binary.fotoFrente) {
  fotoFrente = $binary.fotoFrente
  console.log('✅ Foto Frente em $binary')
} else if ($input.item && $input.item.binary && $input.item.binary.fotoFrente) {
  fotoFrente = $input.item.binary.fotoFrente
  console.log('✅ Foto Frente em $input.item.binary')
} else {
  console.log('⚠️ Foto Frente não encontrada')
}

if ($binary && $binary.fotoCostas) {
  fotoCostas = $binary.fotoCostas
  console.log('✅ Foto Costas em $binary')
} else if ($input.item && $input.item.binary && $input.item.binary.fotoCostas) {
  fotoCostas = $input.item.binary.fotoCostas
  console.log('✅ Foto Costas em $input.item.binary')
} else {
  console.log('⚠️ Foto Costas não encontrada')
}

// 4. Preparar objeto de retorno
const resultJson = {
  debug: {
    hasQuestionnaireData: !!questionnaireDataString,
    hasFotoFrente: !!fotoFrente,
    hasFotoCostas: !!fotoCostas,
    allJsonKeys: Object.keys($json || {}),
    allBinaryKeys: Object.keys($binary || {}),
    allInputItemKeys: Object.keys($input.item || {})
  }
}

// Adicionar questionnaireData se existir
if (questionnaireDataString) {
  resultJson.questionnaireData = questionnaireDataString
}
if (questionnaireData) {
  resultJson.questionnaireDataParsed = questionnaireData
}

// 5. Preparar objeto binary
const resultBinary = {}
if ($binary) {
  Object.assign(resultBinary, $binary)
}
if ($input.item && $input.item.binary) {
  Object.assign(resultBinary, $input.item.binary)
}
if (fotoFrente) {
  resultBinary.fotoFrente = fotoFrente
}
if (fotoCostas) {
  resultBinary.fotoCostas = fotoCostas
}

// 6. RETORNAR (sem spread operator para evitar erros)
return [{
  json: resultJson,
  binary: resultBinary
}]
```

## 🔑 Pontos Importantes

### 1. Modo Correto
- ✅ **"Run Once for All Items"** - Para multipart/form-data
- ❌ **"Run Once for Each Item"** - Causa problemas com multipart

### 2. Sintaxe Segura
- Evite spread operator (`...`) se estiver causando erros
- Use `Object.assign()` para mesclar objetos
- Verifique se variáveis existem antes de acessar propriedades

### 3. Acesso aos Dados
- Tente `$binary` primeiro
- Depois tente `$input.item.binary`
- Use logs para identificar onde os dados realmente estão

## 📝 Passo a Passo

1. **Configure o Webhook**:
   - **Raw Body**: `false` (importante!)
   - **Response Mode**: `Using 'Respond to Webhook' Node`

2. **Configure o Nó Code**:
   - **Mode**: `Run Once for All Items`
   - **Language**: `JavaScript`
   - Cole o código acima

3. **Execute e Verifique**:
   - Execute o workflow
   - Veja os logs no console do N8N
   - Verifique o OUTPUT para ver onde os dados estão

## 🐛 Se Ainda Não Funcionar

Se as fotos ainda não aparecerem, adicione este código de debug mais simples primeiro:

```javascript
// Debug simples - apenas logs
console.log('=== DEBUG COMPLETO ===')
console.log('$json:', JSON.stringify($json, null, 2))
console.log('$binary:', $binary)
console.log('$input:', JSON.stringify($input, null, 2))

// Retornar dados originais
return $input.all()
```

Isso vai mostrar exatamente onde os dados estão sendo recebidos.
