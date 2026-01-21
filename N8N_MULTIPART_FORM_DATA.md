# N8N - Recebendo Imagens via Multipart/Form-Data

## 📋 Mudança Implementada

As imagens agora são enviadas como **arquivos anexados** via `multipart/form-data` ao invés de base64 no JSON. Isso reduz drasticamente o tamanho do payload e o consumo de tokens de contexto.

## 🔄 Formato Anterior vs Novo

### ❌ Formato Anterior (Base64 no JSON)
```json
{
  "userId": "...",
  "questionnaireData": { ... },
  "fotos": {
    "frente": {
      "data": "iVBORw0KGgoAAAANSUhEUgAA...", // base64 muito longo
      "mimeType": "image/jpeg",
      "filename": "frente.jpg"
    },
    "costas": {
      "data": "iVBORw0KGgoAAAANSUhEUgAA...", // base64 muito longo
      "mimeType": "image/jpeg",
      "filename": "costas.jpg"
    }
  }
}
```

### ✅ Formato Novo (Multipart/Form-Data)
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="questionnaireData"

{"userId":"...","idade":25,"sexo":"Masculino",...}
------WebKitFormBoundary...
Content-Disposition: form-data; name="fotoFrente"; filename="frente.jpg"
Content-Type: image/jpeg

[binary data da imagem]
------WebKitFormBoundary...
Content-Disposition: form-data; name="fotoCostas"; filename="costas.jpg"
Content-Type: image/jpeg

[binary data da imagem]
------WebKitFormBoundary...--
```

## 🔧 Configuração no N8N

### 1. Webhook Trigger

No nó **Webhook** do N8N:

1. **HTTP Method**: `POST`
2. **Path**: `/webhook/getExercises` (ou o path que você configurou)
3. **Respond**: `Using 'Respond to Webhook' Node` (ou `When Last Node Finishes`)
4. **Options** → **Raw Body**:
   - ✅ **Deixe como `false`** (padrão) - isso permite que o N8N processe automaticamente o `multipart/form-data`
   - ⚠️ **Importante**: Com `Raw Body = false`, o N8N processa automaticamente os campos do form-data e separa os arquivos binários
   - ❌ **NÃO** coloque como `true`, pois isso enviaria o body bruto e você teria que processar manualmente

### 2. Acessando os Dados no N8N

Quando o N8N recebe `multipart/form-data` com `Raw Body = false`, ele processa automaticamente os campos:

#### Dados do Questionário (JSON String)
```javascript
// No nó Code ou Function
// O campo "questionnaireData" vem como string JSON
const questionnaireData = JSON.parse($json.questionnaireData)

// Agora você pode acessar:
questionnaireData.userId
questionnaireData.idade
questionnaireData.sexo
questionnaireData.altura
questionnaireData.pesoAtual
questionnaireData.objetivo
questionnaireData.frequenciaAtividade
// ... etc
```

#### Imagens (Arquivos Binários)
```javascript
// Foto Frente - acessar via $binary
const fotoFrente = $binary.fotoFrente

// Foto Costas - acessar via $binary
const fotoCostas = $binary.fotoCostas

// Acessar dados binários
const fotoFrenteData = fotoFrente.data  // Buffer/ArrayBuffer
const fotoFrenteMimeType = fotoFrente.mimeType  // "image/jpeg"
const fotoFrenteFileName = fotoFrente.fileName  // "frente.jpg"

// Para fotoCostas:
const fotoCostasData = fotoCostas.data
const fotoCostasMimeType = fotoCostas.mimeType
const fotoCostasFileName = fotoCostas.fileName
```

**Nota**: Se `$binary.fotoFrente` não estiver disponível, tente:
- `$input.item.binary.fotoFrente` (formato alternativo do N8N)
- `$input.item.binary.fotoCostas`
- Verifique os dados de entrada com um nó "Set" ou "Code" para debug (veja seção Debugging abaixo)

### 3. Exemplo Completo no N8N (Code Node)

```javascript
// Parse dos dados do questionário
const questionnaireData = JSON.parse($json.questionnaireData)

// Acessar imagens (tente ambos os formatos para compatibilidade)
const fotoFrente = $binary?.fotoFrente || $input.item.binary?.fotoFrente
const fotoCostas = $binary?.fotoCostas || $input.item.binary?.fotoCostas

// Validar se as imagens foram recebidas
if (!fotoFrente || !fotoCostas) {
  throw new Error('Imagens não foram recebidas corretamente')
}

// Converter imagens para base64 se necessário para OpenAI Vision API
const fotoFrenteBase64 = Buffer.from(fotoFrente.data).toString('base64')
const fotoCostasBase64 = Buffer.from(fotoCostas.data).toString('base64')

// Retornar dados processados
return {
  json: {
    userId: questionnaireData.userId,
    idade: questionnaireData.idade,
    sexo: questionnaireData.sexo,
    altura: questionnaireData.altura,
    pesoAtual: questionnaireData.pesoAtual,
    objetivo: questionnaireData.objetivo,
    // ... outros campos
    fotoFrenteBase64: fotoFrenteBase64,
    fotoCostasBase64: fotoCostasBase64,
    fotoFrenteMimeType: fotoFrente.mimeType,
    fotoCostasMimeType: fotoCostas.mimeType
  }
}
```

### 4. Usando com OpenAI Vision API

Se você precisa enviar as imagens para OpenAI Vision API:

```javascript
// Acessar imagens (compatível com ambos os formatos)
const fotoFrente = $binary?.fotoFrente || $input.item.binary?.fotoFrente
const fotoCostas = $binary?.fotoCostas || $input.item.binary?.fotoCostas

// Converter para base64 apenas quando necessário
// Nota: No N8N, os dados binários podem vir como Buffer ou ArrayBuffer
const fotoFrenteBase64 = Buffer.from(fotoFrente.data).toString('base64')
const fotoCostasBase64 = Buffer.from(fotoCostas.data).toString('base64')

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
            url: `data:${fotoFrente.mimeType};base64,${fotoFrenteBase64}`
          }
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${fotoCostas.mimeType};base64,${fotoCostasBase64}`
          }
        }
      ]
    }
  ]
}
```

## 📊 Benefícios

1. **Redução de Tamanho**: Arquivos binários são ~33% menores que base64
2. **Menos Tokens**: Reduz drasticamente o consumo de tokens de contexto
3. **Melhor Performance**: Transmissão mais eficiente
4. **Padrão Web**: Usa o formato padrão para upload de arquivos

## ⚠️ Importante

- O N8N precisa processar `multipart/form-data` automaticamente
- Os dados do questionário vêm como **string JSON** no campo `questionnaireData`
- As imagens vêm como **arquivos binários** nos campos `fotoFrente` e `fotoCostas`
- Se precisar de base64, converta apenas quando necessário (ex: para OpenAI Vision API)

## 🔍 Debugging

Se houver problemas, verifique:

1. **Webhook está recebendo multipart?**
   - Adicione um nó **"Set"** logo após o Webhook para ver todos os dados recebidos
   - Ou use um nó **"Code"** para fazer log:
   ```javascript
   // Ver todos os dados recebidos
   console.log('JSON data:', JSON.stringify($json, null, 2))
   console.log('Binary data keys:', Object.keys($binary || {}))
   console.log('Input item keys:', Object.keys($input.item || {}))
   console.log('Input item.json keys:', Object.keys($input.item?.json || {}))
   console.log('Input item.binary keys:', Object.keys($input.item?.binary || {}))
   
   // IMPORTANTE: Retornar como ARRAY (requisito do N8N)
   return [{
     json: {
       hasQuestionnaireData: !!($json.questionnaireData || $input.item?.json?.questionnaireData),
       hasFotoFrente: !!($binary?.fotoFrente || $input.item?.binary?.fotoFrente),
       hasFotoCostas: !!($binary?.fotoCostas || $input.item?.binary?.fotoCostas),
       allJsonKeys: Object.keys($json || {}),
       allBinaryKeys: Object.keys($binary || {}),
       allInputItemKeys: Object.keys($input.item || {}),
       questionnaireData: $json.questionnaireData || $input.item?.json?.questionnaireData || null
     },
     binary: {
       ...($binary || {}),
       ...($input.item?.binary || {})
     }
   }]
   ```

2. **Dados do questionário não estão parseando?**
   ```javascript
   // Adicione validação
   try {
     const data = JSON.parse($json.questionnaireData)
     console.log('Questionnaire data parsed:', data)
   } catch (error) {
     console.error('Error parsing questionnaire data:', error)
     console.error('Raw questionnaireData:', $json.questionnaireData)
   }
   ```

3. **Imagens não estão chegando?**
   ```javascript
   // Verifique se os binários existem
   console.log('Foto Frente:', $binary?.fotoFrente ? 'OK' : 'MISSING')
   console.log('Foto Costas:', $binary?.fotoCostas ? 'OK' : 'MISSING')
   
   // Se não estiverem em $binary, verifique em $json
   console.log('All $json keys:', Object.keys($json))
   console.log('All $binary keys:', Object.keys($binary || {}))
   ```

4. **Se as imagens não aparecerem em $binary:**
   - Verifique se `Raw Body` está como `false` (não `true`) na configuração do Webhook
   - O N8N pode processar os arquivos de forma diferente dependendo da versão
   - Tente acessar via `$input.item.binary.fotoFrente` ou `$input.item.binary.fotoCostas`
   - Adicione um nó **"Set"** logo após o Webhook para ver todos os dados recebidos e entender a estrutura
