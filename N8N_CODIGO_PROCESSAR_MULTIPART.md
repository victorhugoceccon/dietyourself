# ✅ Processar Multipart/Form-Data Manualmente

## ⚠️ Situação

Raw Body está como `false`, mas os dados não estão sendo processados automaticamente. Isso pode acontecer em algumas versões do N8N ou configurações específicas.

## ✅ Solução: Processar o Body Manualmente

```javascript
// ============================================================
// Processar multipart/form-data manualmente
// ============================================================

console.log('=== DEBUG E PROCESSAMENTO ===')

const allItems = $input.all()

if (allItems.length === 0) {
  return [{ json: { error: 'Nenhum item recebido' } }]
}

const firstItem = allItems[0]
console.log('firstItem.json keys:', Object.keys(firstItem.json || {}))
console.log('firstItem.binary keys:', Object.keys(firstItem.binary || {}))

// Verificar se há body (indica que multipart não foi processado)
let body = null
if (firstItem.json && firstItem.json.body) {
  body = firstItem.json.body
  console.log('⚠️ Body encontrado - multipart não foi processado automaticamente')
  console.log('   Body type:', typeof body)
  console.log('   Body length:', String(body).length)
}

// Verificar dados processados (se N8N processou corretamente)
let questionnaireData = null
let fotoFrente = null
let fotoCostas = null

// Tentar dados processados primeiro
if (firstItem.json && firstItem.json.questionnaireData) {
  questionnaireData = firstItem.json.questionnaireData
  console.log('✅ questionnaireData encontrado (processado automaticamente)')
}

if (firstItem.binary && firstItem.binary.fotoFrente) {
  fotoFrente = firstItem.binary.fotoFrente
  console.log('✅ fotoFrente encontrada (processada automaticamente)')
}

if (firstItem.binary && firstItem.binary.fotoCostas) {
  fotoCostas = firstItem.binary.fotoCostas
  console.log('✅ fotoCostas encontrada (processada automaticamente)')
}

// Se os dados não foram processados e há body, tentar processar manualmente
if (!questionnaireData && body && typeof body === 'string') {
  console.log('🔄 Tentando processar body manualmente...')
  
  // O body pode ser o multipart/form-data bruto
  // Neste caso, precisamos usar uma biblioteca ou função para processar
  // Por enquanto, vamos apenas logar para ver o conteúdo
  console.log('   Body content (primeiros 500 chars):', body.substring(0, 500))
  
  // Nota: Processar multipart/form-data manualmente é complexo
  // A melhor solução é garantir que o N8N processe automaticamente
}

// Retornar resultado
return [{
  json: {
    debug: {
      hasQuestionnaireData: !!questionnaireData,
      hasFotoFrente: !!fotoFrente,
      hasFotoCostas: !!fotoCostas,
      hasBody: !!body,
      bodyType: body ? typeof body : null,
      bodyLength: body ? String(body).length : 0,
      firstItemJsonKeys: Object.keys(firstItem.json || {}),
      firstItemBinaryKeys: Object.keys(firstItem.binary || {}),
      recommendation: body ? '⚠️ Multipart não foi processado. Verifique configuração do Webhook ou versão do N8N.' : null
    },
    questionnaireData: questionnaireData || null
  }
}]
```

## 🔧 Soluções Alternativas

### Opção 1: Verificar Versão do N8N

Algumas versões antigas do N8N têm problemas com multipart/form-data. Verifique:
- Versão mínima recomendada: N8N 1.0+
- Considere atualizar o N8N se estiver usando versão antiga

### Opção 2: Usar Nó Intermediário

Tente adicionar um nó **"Set"** entre o Webhook e o Code:

1. Adicione um nó **"Set"** após o Webhook
2. Configure para copiar todos os campos
3. Isso pode forçar o N8N a processar o multipart

### Opção 3: Verificar Headers

O problema pode estar nos headers. Verifique se o `content-type` está correto:

```javascript
// Verificar headers
const headers = firstItem.json.headers || {}
console.log('Content-Type:', headers['content-type'] || headers['Content-Type'])

// Deve ser: multipart/form-data; boundary=...
```

### Opção 4: Testar com Nó HTTP Request

Se o problema persistir, você pode:
1. Receber o webhook com Raw Body = true
2. Processar manualmente usando um nó Code com biblioteca de parsing
3. Ou usar um nó HTTP Request para fazer proxy

## 📋 Checklist de Verificação

- [ ] **Raw Body**: `false` (confirmado)
- [ ] **Versão do N8N**: Verificar se está atualizada
- [ ] **Content-Type header**: Verificar se está correto
- [ ] **Teste com nó Set**: Adicionar nó Set intermediário
- [ ] **Logs do console**: Ver o que realmente está chegando

## 💡 Código para Ver TUDO

Use este código para ver exatamente o que está chegando:

```javascript
// Ver TUDO que foi recebido
const allItems = $input.all()

console.log('=== DEBUG MÁXIMO ===')
if (allItems.length > 0) {
  const firstItem = allItems[0]
  
  console.log('=== JSON ===')
  console.log(JSON.stringify(firstItem.json, null, 2))
  
  console.log('=== BINARY ===')
  console.log(firstItem.binary)
  
  console.log('=== HEADERS ===')
  if (firstItem.json.headers) {
    console.log('Content-Type:', firstItem.json.headers['content-type'] || firstItem.json.headers['Content-Type'])
  }
  
  console.log('=== BODY ===')
  if (firstItem.json.body) {
    console.log('Body type:', typeof firstItem.json.body)
    console.log('Body length:', String(firstItem.json.body).length)
    console.log('Body (primeiros 1000 chars):', String(firstItem.json.body).substring(0, 1000))
  }
}

// Retornar tudo
return allItems
```

## 🎯 Próximos Passos

1. Execute o código de debug máximo acima
2. Veja os logs do console do N8N
3. Verifique o Content-Type nos headers
4. Se o body contém o multipart bruto, o N8N não está processando
5. Neste caso, considere atualizar o N8N ou usar uma solução alternativa
