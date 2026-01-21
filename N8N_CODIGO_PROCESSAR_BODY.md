# ✅ Código para Processar Body Manualmente

## ⚠️ Problema Identificado

Os dados estão em `firstItem.json.body`, mas o N8N não está processando o multipart/form-data automaticamente. Isso indica que:
- O **Raw Body** pode estar ativo no Webhook, OU
- O N8N não está processando o multipart corretamente

## ✅ Solução: Verificar e Processar o Body

```javascript
// ============================================================
// Código para "Run Once for All Items"
// Processar body manualmente se necessário
// ============================================================

console.log('=== DEBUG COMPLETO ===')

// 1. Acessar todos os itens
const allItems = $input.all()

if (allItems.length === 0) {
  return [{
    json: { error: 'Nenhum item recebido' }
  }]
}

const firstItem = allItems[0]
console.log('firstItem.json keys:', Object.keys(firstItem.json || {}))

// 2. Verificar se body existe e o que contém
let body = null
if (firstItem.json && firstItem.json.body) {
  body = firstItem.json.body
  console.log('✅ Body encontrado em firstItem.json.body')
  console.log('   Body type:', typeof body)
  console.log('   Body content (primeiros 500 chars):', String(body).substring(0, 500))
} else {
  console.log('⚠️ Body não encontrado')
}

// 3. Verificar questionnaireData (pode estar em body ou diretamente)
let questionnaireData = null

// Tentar diretamente primeiro
if (firstItem.json && firstItem.json.questionnaireData) {
  questionnaireData = firstItem.json.questionnaireData
  console.log('✅ questionnaireData em firstItem.json.questionnaireData')
}
// Se não, pode estar no body (se Raw Body estiver ativo)
else if (body && typeof body === 'string') {
  // Se o body for uma string, pode ser JSON ou multipart
  try {
    const parsedBody = JSON.parse(body)
    if (parsedBody.questionnaireData) {
      questionnaireData = parsedBody.questionnaireData
      console.log('✅ questionnaireData encontrado no body parseado')
    }
  } catch (e) {
    console.log('⚠️ Body não é JSON válido, pode ser multipart/form-data')
  }
}

// 4. Verificar binary (pode estar vazio se Raw Body estiver ativo)
let fotoFrente = null
let fotoCostas = null

if (firstItem.binary && firstItem.binary.fotoFrente) {
  fotoFrente = firstItem.binary.fotoFrente
  console.log('✅ fotoFrente em firstItem.binary')
} else {
  console.log('⚠️ fotoFrente não encontrada em binary')
  console.log('   Isso indica que Raw Body pode estar ativo no Webhook')
}

if (firstItem.binary && firstItem.binary.fotoCostas) {
  fotoCostas = firstItem.binary.fotoCostas
  console.log('✅ fotoCostas em firstItem.binary')
} else {
  console.log('⚠️ fotoCostas não encontrada em binary')
}

// 5. Preparar retorno (sem binary para evitar erro de TypeScript)
const outputJson = {
  debug: {
    hasQuestionnaireData: !!questionnaireData,
    hasFotoFrente: !!fotoFrente,
    hasFotoCostas: !!fotoCostas,
    allItemsCount: allItems.length,
    firstItemJsonKeys: Object.keys(firstItem.json || {}),
    firstItemBinaryKeys: Object.keys(firstItem.binary || {}),
    hasBody: !!body,
    bodyType: body ? typeof body : null,
    bodyLength: body ? String(body).length : 0
  }
}

if (questionnaireData) {
  outputJson.questionnaireData = questionnaireData
}

// 6. Retornar (sem binary para evitar erro de TypeScript)
// Se precisar dos binários, eles estarão em firstItem.binary
return [{
  json: outputJson
}]
```

## 🔧 Solução: Verificar Configuração do Webhook

O problema principal é que o **Raw Body** provavelmente está **ATIVO** no Webhook. Você precisa:

1. **Abra o nó Webhook**
2. **Vá em "Options" ou "Settings"**
3. **Procure por "Raw Body" ou "Raw Request Body"**
4. **DESMARQUE** (deixe como `false`)
5. **Salve o workflow**
6. **Execute novamente**

## ✅ Código Alternativo: Retornar Tudo (Para Debug)

Se ainda não funcionar, use este código para ver **TUDO**:

```javascript
// Retornar tudo que foi recebido
const allItems = $input.all()

console.log('=== DEBUG MÁXIMO ===')
if (allItems.length > 0) {
  const firstItem = allItems[0]
  console.log('firstItem.json completo:', JSON.stringify(firstItem.json, null, 2))
  console.log('firstItem.binary:', firstItem.binary)
  
  // Verificar body especificamente
  if (firstItem.json.body) {
    console.log('=== BODY ENCONTRADO ===')
    console.log('Body type:', typeof firstItem.json.body)
    console.log('Body length:', String(firstItem.json.body).length)
    console.log('Body (primeiros 1000 chars):', String(firstItem.json.body).substring(0, 1000))
  }
}

// Retornar tudo
return allItems
```

## 📋 Checklist

- [ ] **Raw Body no Webhook**: Deve estar **DESMARCADO** (false)
- [ ] **Verificar logs do console**: Veja onde os dados estão
- [ ] **Testar webhook**: Execute `node scripts/test-n8n-webhook.js`
- [ ] **Verificar versão do N8N**: Versões antigas podem ter problemas

## 💡 Dica

Se o `body` contém os dados mas não está sendo processado, o problema é definitivamente o **Raw Body** estar ativo. Desmarque e teste novamente.
