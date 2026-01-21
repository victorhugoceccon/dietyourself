# 🔧 Solução: Body Vazio no N8N

## ⚠️ Problema Identificado

O body está aparecendo como `{empty object}`, o que significa que o N8N **não está processando o multipart/form-data** corretamente.

## ✅ Soluções

### 1. Verificar Configuração do Webhook

**CRÍTICO**: O Webhook precisa estar configurado assim:

1. Abra o nó **Webhook**
2. Vá em **Options** (ou **Settings**)
3. Procure por **"Raw Body"** ou **"Raw Request Body"**
4. **DEVE estar DESMARCADO** (false)
5. Se estiver marcado, **desmarque** e salve

### 2. Código para Modo "Run Once for All Items" (Corrigido)

```javascript
// ============================================================
// Código para "Run Once for All Items"
// NÃO usar $input.item neste modo!
// ============================================================

console.log('=== DEBUG COMPLETO ===')

// Verificar todos os dados disponíveis
console.log('$json:', JSON.stringify($json, null, 2))
console.log('$binary:', $binary)
console.log('$input.all() length:', $input.all().length)

// Acessar todos os itens
const allItems = $input.all()
console.log('allItems:', JSON.stringify(allItems, null, 2))

// Verificar primeiro item
let firstItem = null
if (allItems && allItems.length > 0) {
  firstItem = allItems[0]
  console.log('✅ Primeiro item encontrado')
  console.log('   firstItem.json:', JSON.stringify(firstItem.json, null, 2))
  console.log('   firstItem.binary keys:', Object.keys(firstItem.binary || {}))
}

// Verificar questionnaireData
let questionnaireData = null

if ($json && $json.questionnaireData) {
  questionnaireData = $json.questionnaireData
  console.log('✅ questionnaireData em $json')
} else if (firstItem && firstItem.json && firstItem.json.questionnaireData) {
  questionnaireData = firstItem.json.questionnaireData
  console.log('✅ questionnaireData em firstItem.json')
} else {
  console.log('⚠️ questionnaireData não encontrado')
}

// Verificar fotos
let fotoFrente = null
let fotoCostas = null

if ($binary && $binary.fotoFrente) {
  fotoFrente = $binary.fotoFrente
  console.log('✅ fotoFrente em $binary')
} else if (firstItem && firstItem.binary && firstItem.binary.fotoFrente) {
  fotoFrente = firstItem.binary.fotoFrente
  console.log('✅ fotoFrente em firstItem.binary')
} else {
  console.log('⚠️ fotoFrente não encontrada')
}

if ($binary && $binary.fotoCostas) {
  fotoCostas = $binary.fotoCostas
  console.log('✅ fotoCostas em $binary')
} else if (firstItem && firstItem.binary && firstItem.binary.fotoCostas) {
  fotoCostas = firstItem.binary.fotoCostas
  console.log('✅ fotoCostas em firstItem.binary')
} else {
  console.log('⚠️ fotoCostas não encontrada')
}

// Retornar resultado
const outputJson = {
  debug: {
    hasQuestionnaireData: !!questionnaireData,
    hasFotoFrente: !!fotoFrente,
    hasFotoCostas: !!fotoCostas,
    jsonKeys: Object.keys($json || {}),
    binaryKeys: Object.keys($binary || {}),
    allItemsCount: allItems ? allItems.length : 0
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

return [{
  json: outputJson,
  binary: outputBinary
}]
```

### 3. Versão de Debug Máximo (Para Ver Tudo)

Se ainda não funcionar, use este código para ver **exatamente** o que está chegando:

```javascript
// Debug máximo - ver TUDO
console.log('=== DEBUG MÁXIMO ===')
console.log('$json:', JSON.stringify($json, null, 2))
console.log('$binary:', $binary)
console.log('$input:', JSON.stringify($input, null, 2))
console.log('$input.all():', JSON.stringify($input.all(), null, 2))

// Retornar tudo que foi recebido (sem processamento)
return $input.all()
```

## 🔍 Diagnóstico

### Se o body continua vazio após verificar Raw Body:

1. **Teste o Webhook diretamente**:
   - Use: `node scripts/test-n8n-webhook.js`
   - Verifique se os dados estão sendo enviados

2. **Verifique a versão do N8N**:
   - Versões antigas podem ter problemas com multipart/form-data
   - Considere atualizar o N8N

3. **Tente mudar o modo do Code Node**:
   - Mude para **"Run Once for Each Item"**
   - Use este código:
   ```javascript
   // Modo "Run Once for Each Item"
   console.log('$json:', $json)
   console.log('$binary:', $binary)
   console.log('$input.item:', $input.item)
   
   return {
     json: $json || {},
     binary: $binary || {}
   }
   ```

## 📋 Checklist de Verificação

- [ ] **Raw Body no Webhook**: `false` (desmarcado)
- [ ] **Modo do Code Node**: "Run Once for All Items" ou "Run Once for Each Item"
- [ ] **Código sem `$input.item`** se estiver em modo "All Items"
- [ ] **Logs do console** mostram dados recebidos
- [ ] **Teste com script** confirma que dados estão sendo enviados

## 💡 Dica Final

Se nada funcionar, tente adicionar um nó **"Set"** logo após o Webhook para ver todos os dados recebidos antes do Code Node. Isso ajuda a identificar onde os dados estão.
