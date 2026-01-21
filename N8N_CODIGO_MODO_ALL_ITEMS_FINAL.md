# ✅ Código Final para "Run Once for All Items"

## ⚠️ Problema Identificado

No modo **"Run Once for All Items"**:
- ❌ `$json` **NÃO está disponível**
- ❌ `$binary` **NÃO está disponível**
- ✅ Use `$input.all()` para acessar os dados

## ✅ Código Correto

```javascript
// ============================================================
// Código para "Run Once for All Items"
// IMPORTANTE: $json e $binary NÃO estão disponíveis neste modo!
// ============================================================

console.log('=== DEBUG COMPLETO ===')

// 1. Acessar todos os itens
const allItems = $input.all()
console.log('Total de itens:', allItems.length)

if (allItems.length === 0) {
  console.log('⚠️ Nenhum item encontrado')
  return [{
    json: {
      error: 'Nenhum item recebido',
      debug: {
        allItemsCount: 0
      }
    }
  }]
}

// 2. Pegar o primeiro item (onde estão os dados do webhook)
const firstItem = allItems[0]
console.log('Primeiro item keys:', Object.keys(firstItem))
console.log('firstItem.json keys:', Object.keys(firstItem.json || {}))
console.log('firstItem.binary keys:', Object.keys(firstItem.binary || {}))

// 3. Verificar onde estão os dados
// No webhook, os dados podem estar em:
// - firstItem.json.body (se Raw Body = true)
// - firstItem.json.questionnaireData (se Raw Body = false e processado)
// - firstItem.binary (arquivos binários)

let questionnaireData = null
let fotoFrente = null
let fotoCostas = null

// Verificar questionnaireData
if (firstItem.json && firstItem.json.questionnaireData) {
  questionnaireData = firstItem.json.questionnaireData
  console.log('✅ questionnaireData em firstItem.json.questionnaireData')
} else if (firstItem.json && firstItem.json.body) {
  // Se Raw Body estiver ativo, o body pode estar aqui
  console.log('⚠️ Body encontrado em firstItem.json.body (Raw Body pode estar ativo)')
  console.log('   Body type:', typeof firstItem.json.body)
  console.log('   Body content:', firstItem.json.body)
} else {
  console.log('⚠️ questionnaireData não encontrado')
  console.log('   firstItem.json completo:', JSON.stringify(firstItem.json, null, 2))
}

// Verificar fotos (arquivos binários)
if (firstItem.binary && firstItem.binary.fotoFrente) {
  fotoFrente = firstItem.binary.fotoFrente
  console.log('✅ fotoFrente encontrada em firstItem.binary.fotoFrente')
} else {
  console.log('⚠️ fotoFrente não encontrada')
  console.log('   firstItem.binary keys:', Object.keys(firstItem.binary || {}))
}

if (firstItem.binary && firstItem.binary.fotoCostas) {
  fotoCostas = firstItem.binary.fotoCostas
  console.log('✅ fotoCostas encontrada em firstItem.binary.fotoCostas')
} else {
  console.log('⚠️ fotoCostas não encontrada')
}

// 4. Preparar retorno
const outputJson = {
  debug: {
    hasQuestionnaireData: !!questionnaireData,
    hasFotoFrente: !!fotoFrente,
    hasFotoCostas: !!fotoCostas,
    allItemsCount: allItems.length,
    firstItemJsonKeys: Object.keys(firstItem.json || {}),
    firstItemBinaryKeys: Object.keys(firstItem.binary || {})
  }
}

if (questionnaireData) {
  outputJson.questionnaireData = questionnaireData
}

const outputBinary = {}
if (fotoFrente) {
  outputBinary.fotoFrente = fotoFrente
}
if (fotoCostas) {
  outputBinary.fotoCostas = fotoCostas
}

// 5. Retornar
return [{
  json: outputJson,
  binary: outputBinary
}]
```

## 🔍 Versão de Debug Máximo

Se ainda não encontrar os dados, use este código para ver **TUDO**:

```javascript
// Debug máximo - ver TUDO que foi recebido
const allItems = $input.all()

console.log('=== DEBUG MÁXIMO ===')
console.log('Total de itens:', allItems.length)

if (allItems.length > 0) {
  const firstItem = allItems[0]
  console.log('=== PRIMEIRO ITEM ===')
  console.log('firstItem completo:', JSON.stringify(firstItem, null, 2))
  console.log('firstItem.json:', JSON.stringify(firstItem.json, null, 2))
  console.log('firstItem.binary:', firstItem.binary)
  
  // Verificar cada chave do json
  if (firstItem.json) {
    Object.keys(firstItem.json).forEach(key => {
      console.log(`firstItem.json.${key}:`, firstItem.json[key])
    })
  }
  
  // Verificar cada chave do binary
  if (firstItem.binary) {
    Object.keys(firstItem.binary).forEach(key => {
      console.log(`firstItem.binary.${key}:`, firstItem.binary[key])
    })
  }
}

// Retornar tudo que foi recebido
return allItems
```

## ⚠️ Verificação Importante

Se os dados ainda não aparecerem, verifique:

1. **Raw Body no Webhook**:
   - Deve estar **DESMARCADO** (false)
   - Se estiver marcado, o N8N não processa o multipart/form-data

2. **Verifique os logs do console**:
   - Os logs mostrarão exatamente onde os dados estão
   - Procure por mensagens como "✅ questionnaireData encontrado" ou "⚠️ não encontrado"

3. **Teste o webhook**:
   - Execute: `node scripts/test-n8n-webhook.js`
   - Verifique se os dados estão sendo enviados corretamente

## 📋 Resumo

- ✅ Use `$input.all()` para acessar os dados
- ✅ Use `$input.all()[0]` para o primeiro item
- ✅ Use `firstItem.json` para dados JSON
- ✅ Use `firstItem.binary` para dados binários
- ❌ **NÃO use** `$json` ou `$binary` neste modo
