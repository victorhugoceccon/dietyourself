# 🔧 Solução Alternativa: N8N Não Processa Multipart

## ⚠️ Problema Identificado

O N8N está recebendo a requisição (header `content-type: multipart/form-data` está presente), mas:
- `body` está vazio
- `content-length: 17` (muito pequeno, indica que o body não está sendo recebido)
- Os dados não estão sendo processados automaticamente

Isso pode indicar:
1. Problema na versão do N8N
2. Configuração específica necessária
3. Bug conhecido do N8N com multipart/form-data

## ✅ Solução 1: Verificar Configuração do Webhook

No nó **Webhook**, verifique TODAS as opções:

1. **Options** → **Raw Body**: `false` (já confirmado)
2. **Options** → **Response Mode**: Pode afetar o processamento
3. **Options** → **Response Data**: Verifique se há alguma opção relacionada
4. **Settings** → Procure por "Parse Body" ou "Process Multipart"

## ✅ Solução 2: Usar Nó HTTP Request (Workaround)

Se o Webhook não processar, use um nó **HTTP Request** como intermediário:

1. **Webhook** → Recebe a requisição (Raw Body = true)
2. **Code Node** → Processa o multipart manualmente
3. **HTTP Request** → Envia para outro endpoint processado

## ✅ Solução 3: Enviar como JSON com Base64 (Temporário)

Como workaround temporário, podemos modificar o backend para enviar como JSON com base64:

### Modificar `server/routes/workout.js`

```javascript
// Em vez de FormData, enviar como JSON
const payload = {
  questionnaireData: questionnairePayload,
  fotoFrente: {
    data: fotoFrente.buffer.toString('base64'),
    mimeType: fotoFrente.mimetype,
    filename: fotoFrente.originalname
  },
  fotoCostas: {
    data: fotoCostas.buffer.toString('base64'),
    mimeType: fotoCostas.mimetype,
    filename: fotoCostas.originalname
  }
}

const response = await fetch(N8N_GET_EXERCISES_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(N8N_API_KEY && !N8N_API_KEY.startsWith('http') && { 'X-N8N-API-KEY': N8N_API_KEY })
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(timeoutMs)
})
```

**No N8N**, o webhook receberá JSON normal e você pode acessar:
```javascript
const questionnaireData = JSON.parse($json.questionnaireData)
const fotoFrenteBase64 = $json.fotoFrente.data
const fotoCostasBase64 = $json.fotoCostas.data
```

## ✅ Solução 4: Verificar Versão do N8N

Algumas versões do N8N têm problemas conhecidos com multipart/form-data:

- **Versão mínima recomendada**: N8N 1.0+
- **Versões problemáticas**: N8N < 0.200.0
- **Verificar**: `n8n --version` ou na interface do N8N

## ✅ Solução 5: Usar Nó Set Intermediário

Tente adicionar um nó **"Set"** logo após o Webhook:

1. Adicione nó **"Set"**
2. Configure para copiar:
   - `{{ $json }}` → `data`
   - `{{ $binary }}` → `files`
3. Isso pode forçar o processamento

## 🔍 Diagnóstico: Verificar o que Está Sendo Enviado

Execute este código no backend para verificar o que está sendo enviado:

```javascript
// Adicionar antes do fetch no server/routes/workout.js
console.log('📤 Headers sendo enviados:', headers)
console.log('📤 FormData size:', formData.getLengthSync ? formData.getLengthSync() : 'unknown')
console.log('📤 Content-Type:', headers['content-type'])
```

## 📋 Checklist de Verificação

- [ ] **Raw Body**: `false` (confirmado)
- [ ] **Versão do N8N**: Verificar se está atualizada
- [ ] **Content-Length**: Verificar se está correto (deve ser > 17)
- [ ] **Teste direto**: Executar `node scripts/test-n8n-webhook.js`
- [ ] **Logs do backend**: Verificar se os dados estão sendo enviados
- [ ] **Configurações adicionais**: Verificar todas as opções do Webhook

## 💡 Recomendação Imediata

Como workaround rápido, recomendo a **Solução 3** (enviar como JSON com base64). Isso vai funcionar imediatamente enquanto investigamos o problema do multipart.

Quer que eu implemente a Solução 3?
