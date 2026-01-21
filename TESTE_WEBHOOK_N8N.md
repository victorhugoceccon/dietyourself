# ✅ Teste do Webhook N8N - Multipart/Form-Data

## 🧪 Teste Realizado

Foi executado um teste enviando uma requisição `multipart/form-data` para o webhook do N8N:

- **URL**: `http://69.6.215.140:8080/webhook/getExercises`
- **Método**: `POST`
- **Content-Type**: `multipart/form-data` (com boundary automático)
- **Status da Resposta**: `200 OK` ✅

## 📦 Dados Enviados

1. **questionnaireData** (campo de texto JSON):
   - Dados do questionário em formato JSON string
   - Contém: userId, idade, sexo, altura, pesoAtual, objetivo, etc.

2. **fotoFrente** (arquivo binário):
   - Imagem PNG de teste
   - Content-Type: `image/png`
   - Filename: `frente.png`

3. **fotoCostas** (arquivo binário):
   - Imagem PNG de teste
   - Content-Type: `image/png`
   - Filename: `costas.png`

## 🔍 Como Verificar o que o N8N Está Recebendo

### Opção 1: Usar o Código de Debug

Adicione um nó **"Code"** logo após o **Webhook** no seu workflow N8N e cole este código:

```javascript
// Ver todos os dados recebidos
console.log('📋 Dados JSON:', JSON.stringify($json, null, 2))
console.log('📦 Dados Binários Keys:', Object.keys($binary || {}))

// Verificar questionnaireData
if ($json.questionnaireData) {
  const data = JSON.parse($json.questionnaireData)
  console.log('✅ Questionnaire Data:', data.userId, data.idade, data.objetivo)
} else {
  console.log('⚠️  questionnaireData não encontrado')
}

// Verificar imagens
console.log('Foto Frente:', $binary?.fotoFrente ? 'OK' : 'MISSING')
console.log('Foto Costas:', $binary?.fotoCostas ? 'OK' : 'MISSING')

// Retornar dados para visualização
return {
  json: {
    hasQuestionnaireData: !!$json.questionnaireData,
    hasFotoFrente: !!$binary?.fotoFrente,
    hasFotoCostas: !!$binary?.fotoCostas,
    allJsonKeys: Object.keys($json),
    allBinaryKeys: Object.keys($binary || {})
  }
}
```

### Opção 2: Usar Nó "Set" para Visualizar

1. Adicione um nó **"Set"** após o Webhook
2. Configure para mostrar:
   - `questionnaireData` → `{{ $json.questionnaireData }}`
   - `fotoFrente` → `{{ $binary.fotoFrente }}`
   - `fotoCostas` → `{{ $binary.fotoCostas }}`

### Opção 3: Ver Logs do N8N

1. Execute o workflow no N8N
2. Vá em **"Executions"** no menu lateral
3. Clique na execução mais recente
4. Veja os logs de cada nó para verificar o que foi recebido

## 📝 Estrutura Esperada no N8N

Com `Raw Body = false`, o N8N deve processar automaticamente:

### Dados JSON (`$json`)
```javascript
{
  questionnaireData: "{\"userId\":\"...\",\"idade\":30,...}"  // String JSON
}
```

### Dados Binários (`$binary`)
```javascript
{
  fotoFrente: {
    data: Buffer,           // Dados binários da imagem
    mimeType: "image/png", // Tipo MIME
    fileName: "frente.png"  // Nome do arquivo
  },
  fotoCostas: {
    data: Buffer,
    mimeType: "image/png",
    fileName: "costas.png"
  }
}
```

## 🎯 Próximos Passos

1. **Adicione o código de debug** no N8N para ver o que está sendo recebido
2. **Execute o workflow** e verifique os logs
3. **Ajuste o código** do workflow conforme a estrutura real dos dados recebidos
4. **Parse o questionnaireData**: `JSON.parse($json.questionnaireData)`
5. **Use as imagens**: Acesse via `$binary.fotoFrente` e `$binary.fotoCostas`

## ✅ Confirmação

O teste confirmou que:
- ✅ O webhook está acessível
- ✅ A requisição multipart/form-data está sendo aceita
- ✅ O N8N está processando e respondendo corretamente
- ✅ A resposta contém dados estruturados (treino gerado)

Agora você só precisa verificar no N8N como os dados estão sendo estruturados para ajustar seu workflow!
