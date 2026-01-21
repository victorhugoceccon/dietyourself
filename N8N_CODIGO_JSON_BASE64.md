# ✅ Código N8N para Receber JSON com Base64

## 📋 Mudança Implementada

O backend agora envia os dados como **JSON com base64** ao invés de multipart/form-data, pois o N8N não estava processando o multipart corretamente.

## ✅ Código para N8N (Nó Code)

```javascript
// ============================================================
// Processar dados recebidos como JSON com base64
// ============================================================

console.log('=== PROCESSANDO DADOS ===')

// Acessar dados (modo "Run Once for All Items")
const allItems = $input.all()

if (allItems.length === 0) {
  return [{ json: { error: 'Nenhum item recebido' } }]
}

const firstItem = allItems[0]

// 1. Acessar questionnaireData
let questionnaireData = null
if (firstItem.json && firstItem.json.questionnaireData) {
  questionnaireData = firstItem.json.questionnaireData
  console.log('✅ questionnaireData encontrado')
  console.log('   UserId:', questionnaireData.userId)
  console.log('   Idade:', questionnaireData.idade)
  console.log('   Objetivo:', questionnaireData.objetivo)
} else {
  console.log('⚠️ questionnaireData não encontrado')
  console.log('   firstItem.json keys:', Object.keys(firstItem.json || {}))
}

// 2. Acessar fotos (base64)
let fotoFrente = null
let fotoCostas = null

if (firstItem.json && firstItem.json.fotoFrente) {
  fotoFrente = firstItem.json.fotoFrente
  console.log('✅ fotoFrente encontrada')
  console.log('   MimeType:', fotoFrente.mimeType)
  console.log('   Filename:', fotoFrente.filename)
  console.log('   Data length:', fotoFrente.data ? fotoFrente.data.length : 0)
} else {
  console.log('⚠️ fotoFrente não encontrada')
}

if (firstItem.json && firstItem.json.fotoCostas) {
  fotoCostas = firstItem.json.fotoCostas
  console.log('✅ fotoCostas encontrada')
  console.log('   MimeType:', fotoCostas.mimeType)
  console.log('   Filename:', fotoCostas.filename)
  console.log('   Data length:', fotoCostas.data ? fotoCostas.data.length : 0)
} else {
  console.log('⚠️ fotoCostas não encontrada')
}

// 3. Converter base64 para Buffer se necessário para OpenAI Vision API
let fotoFrenteBuffer = null
let fotoCostasBuffer = null

if (fotoFrente && fotoFrente.data) {
  fotoFrenteBuffer = Buffer.from(fotoFrente.data, 'base64')
  console.log('✅ fotoFrente convertida para Buffer')
}

if (fotoCostas && fotoCostas.data) {
  fotoCostasBuffer = Buffer.from(fotoCostas.data, 'base64')
  console.log('✅ fotoCostas convertida para Buffer')
}

// 4. Retornar dados processados
return [{
  json: {
    questionnaireData: questionnaireData,
    fotoFrente: fotoFrente ? {
      data: fotoFrente.data,
      mimeType: fotoFrente.mimeType,
      filename: fotoFrente.filename
    } : null,
    fotoCostas: fotoCostas ? {
      data: fotoCostas.data,
      mimeType: fotoCostas.mimeType,
      filename: fotoCostas.filename
    } : null,
    debug: {
      hasQuestionnaireData: !!questionnaireData,
      hasFotoFrente: !!fotoFrente,
      hasFotoCostas: !!fotoCostas
    }
  }
}]
```

## 🔄 Usar com OpenAI Vision API

Se você precisa usar as imagens com OpenAI Vision API:

```javascript
// Converter base64 para data URL
const fotoFrenteDataUrl = `data:${fotoFrente.mimeType};base64,${fotoFrente.data}`
const fotoCostasDataUrl = `data:${fotoCostas.mimeType};base64,${fotoCostas.data}`

// Usar no payload da OpenAI
const openaiPayload = {
  model: "gpt-4-vision-preview",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analise estas fotos e gere um treino personalizado..."
        },
        {
          type: "image_url",
          image_url: {
            url: fotoFrenteDataUrl
          }
        },
        {
          type: "image_url",
          image_url: {
            url: fotoCostasDataUrl
          }
        }
      ]
    }
  ]
}
```

## 📋 Estrutura dos Dados Recebidos

```json
{
  "questionnaireData": {
    "userId": "...",
    "idade": 30,
    "sexo": "Masculino",
    "altura": 175,
    "pesoAtual": 80,
    "objetivo": "Ganhar massa muscular",
    ...
  },
  "fotoFrente": {
    "data": "iVBORw0KGgoAAAANSUhEUgAA...", // base64
    "mimeType": "image/jpeg",
    "filename": "frente.jpg"
  },
  "fotoCostas": {
    "data": "iVBORw0KGgoAAAANSUhEUgAA...", // base64
    "mimeType": "image/jpeg",
    "filename": "costas.jpg"
  }
}
```

## ✅ Vantagens desta Solução

1. ✅ **Funciona imediatamente** - Não depende do processamento de multipart do N8N
2. ✅ **Mais simples** - Dados em formato JSON padrão
3. ✅ **Compatível** - Funciona com qualquer versão do N8N
4. ✅ **Fácil de debugar** - Dados visíveis diretamente no JSON

## ⚠️ Desvantagem

- **Tamanho maior**: Base64 aumenta o tamanho em ~33%, mas ainda é aceitável para imagens de tamanho moderado

## 🔄 Voltar para Multipart (Futuro)

Quando o problema do multipart for resolvido (atualização do N8N ou configuração), podemos voltar para multipart/form-data para reduzir o tamanho do payload.
