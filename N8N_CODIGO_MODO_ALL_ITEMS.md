# ✅ Código Correto para "Run Once for All Items"

## ⚠️ Problema Identificado

No modo **"Run Once for All Items"**, você **NÃO deve usar** `$input.item`. Use `$input.all()` ou acesse diretamente `$json` e `$binary`.

## ✅ Código Corrigido

```javascript
// ============================================================
// DEBUG: Modo "Run Once for All Items"
// IMPORTANTE: Não usar $input.item neste modo!
// ============================================================

console.log('=== INÍCIO DEBUG ===')

// 1. Verificar estrutura completa
console.log('$json:', JSON.stringify($json, null, 2))
console.log('$binary keys:', Object.keys($binary || {}))
console.log('$input.all() length:', $input.all().length)

// 2. Acessar todos os itens
const allItems = $input.all()

// 3. Verificar primeiro item (onde geralmente estão os dados)
let firstItem = null
if (allItems && allItems.length > 0) {
  firstItem = allItems[0]
  console.log('✅ Primeiro item encontrado')
  console.log('   firstItem.json keys:', Object.keys(firstItem.json || {}))
  console.log('   firstItem.binary keys:', Object.keys(firstItem.binary || {}))
} else {
  console.log('⚠️ Nenhum item encontrado em $input.all()')
}

// 4. Verificar questionnaireData (múltiplos locais)
let questionnaireData = null

// Tentar $json primeiro
if ($json && $json.questionnaireData) {
  questionnaireData = $json.questionnaireData
  console.log('✅ questionnaireData em $json')
}
// Tentar primeiro item
else if (firstItem && firstItem.json && firstItem.json.questionnaireData) {
  questionnaireData = firstItem.json.questionnaireData
  console.log('✅ questionnaireData em firstItem.json')
}
// Tentar acessar diretamente do input
else if (allItems && allItems[0] && allItems[0].json && allItems[0].json.questionnaireData) {
  questionnaireData = allItems[0].json.questionnaireData
  console.log('✅ questionnaireData em allItems[0].json')
}
else {
  console.log('⚠️ questionnaireData não encontrado')
  console.log('   $json keys:', Object.keys($json || {}))
  if (firstItem) {
    console.log('   firstItem.json keys:', Object.keys(firstItem.json || {}))
  }
}

// 5. Verificar fotos (múltiplos locais)
let fotoFrente = null
let fotoCostas = null

// Tentar $binary primeiro
if ($binary && $binary.fotoFrente) {
  fotoFrente = $binary.fotoFrente
  console.log('✅ fotoFrente em $binary')
}
// Tentar primeiro item
else if (firstItem && firstItem.binary && firstItem.binary.fotoFrente) {
  fotoFrente = firstItem.binary.fotoFrente
  console.log('✅ fotoFrente em firstItem.binary')
}
// Tentar acessar diretamente do input
else if (allItems && allItems[0] && allItems[0].binary && allItems[0].binary.fotoFrente) {
  fotoFrente = allItems[0].binary.fotoFrente
  console.log('✅ fotoFrente em allItems[0].binary')
}
else {
  console.log('⚠️ fotoFrente não encontrada')
  console.log('   $binary keys:', Object.keys($binary || {}))
  if (firstItem) {
    console.log('   firstItem.binary keys:', Object.keys(firstItem.binary || {}))
  }
}

if ($binary && $binary.fotoCostas) {
  fotoCostas = $binary.fotoCostas
  console.log('✅ fotoCostas em $binary')
}
else if (firstItem && firstItem.binary && firstItem.binary.fotoCostas) {
  fotoCostas = firstItem.binary.fotoCostas
  console.log('✅ fotoCostas em firstItem.binary')
}
else if (allItems && allItems[0] && allItems[0].binary && allItems[0].binary.fotoCostas) {
  fotoCostas = allItems[0].binary.fotoCostas
  console.log('✅ fotoCostas em allItems[0].binary')
}
else {
  console.log('⚠️ fotoCostas não encontrada')
}

// 6. Criar objeto de retorno
const outputJson = {
  debug: {
    hasQuestionnaireData: questionnaireData ? true : false,
    hasFotoFrente: fotoFrente ? true : false,
    hasFotoCostas: fotoCostas ? true : false,
    allItemsCount: allItems ? allItems.length : 0,
    jsonKeys: Object.keys($json || {}),
    binaryKeys: Object.keys($binary || {})
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

// 7. Retornar como array
return [{
  json: outputJson,
  binary: outputBinary
}]
```

## 🔄 Versão Simplificada (Para Teste)

Se ainda não funcionar, use esta versão que retorna tudo:

```javascript
// Versão que retorna tudo que foi recebido
console.log('=== DEBUG MÁXIMO ===')
console.log('$json:', JSON.stringify($json, null, 2))
console.log('$binary:', $binary)
console.log('$input.all():', $input.all())

// Retornar todos os itens recebidos
return $input.all()
```

## ⚠️ Verificação Importante

Se o body está vazio (`{empty object}`), o problema pode estar na configuração do Webhook:

1. **Verifique o Webhook**:
   - **Raw Body** deve estar como `false` (desmarcado)
   - Se estiver como `true`, o N8N não processa o multipart/form-data

2. **Teste o Webhook**:
   - Use o script de teste: `node scripts/test-n8n-webhook.js`
   - Verifique se os dados estão sendo enviados corretamente

3. **Verifique os Logs**:
   - Veja os logs do console do N8N
   - Procure por mensagens de erro ou avisos

## 🔑 Diferença entre Modos

### "Run Once for All Items"
- Use: `$input.all()` para acessar todos os itens
- Use: `$json` e `$binary` diretamente
- ❌ NÃO use: `$input.item`

### "Run Once for Each Item"
- Use: `$input.item` para acessar o item atual
- Use: `$json` e `$binary` diretamente
- ✅ Pode usar: `$input.item.json` e `$input.item.binary`
