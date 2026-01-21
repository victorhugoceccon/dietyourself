# ✅ Código Simples e Seguro para N8N

## ⚠️ Configuração Obrigatória

### Nó Code - Configuração:
- **Mode**: `Run Once for All Items` ⚠️ **MUDE ISSO!**
- **Language**: `JavaScript`

### Webhook - Configuração:
- **Raw Body**: `false` (deve estar desmarcado)

## ✅ Código Simplificado (Sem Erros de Sintaxe)

```javascript
// Debug completo - versão segura
console.log('=== INÍCIO DEBUG ===')

// Verificar estrutura completa
console.log('$json:', JSON.stringify($json, null, 2))
console.log('$binary keys:', Object.keys($binary || {}))
console.log('$input.item keys:', Object.keys($input.item || {}))

// Verificar questionnaireData
let questionnaireData = null
if ($json && $json.questionnaireData) {
  questionnaireData = $json.questionnaireData
  console.log('✅ questionnaireData em $json')
} else if ($input.item && $input.item.json && $input.item.json.questionnaireData) {
  questionnaireData = $input.item.json.questionnaireData
  console.log('✅ questionnaireData em $input.item.json')
} else {
  console.log('⚠️ questionnaireData não encontrado')
}

// Verificar fotos
let fotoFrente = null
let fotoCostas = null

if ($binary && $binary.fotoFrente) {
  fotoFrente = $binary.fotoFrente
  console.log('✅ fotoFrente em $binary')
} else if ($input.item && $input.item.binary && $input.item.binary.fotoFrente) {
  fotoFrente = $input.item.binary.fotoFrente
  console.log('✅ fotoFrente em $input.item.binary')
} else {
  console.log('⚠️ fotoFrente não encontrada')
}

if ($binary && $binary.fotoCostas) {
  fotoCostas = $binary.fotoCostas
  console.log('✅ fotoCostas em $binary')
} else if ($input.item && $input.item.binary && $input.item.binary.fotoCostas) {
  fotoCostas = $input.item.binary.fotoCostas
  console.log('✅ fotoCostas em $input.item.binary')
} else {
  console.log('⚠️ fotoCostas não encontrada')
}

// Criar objeto de retorno (sem spread operator)
const outputJson = {
  debug: {
    hasQuestionnaireData: questionnaireData ? true : false,
    hasFotoFrente: fotoFrente ? true : false,
    hasFotoCostas: fotoCostas ? true : false
  }
}

if (questionnaireData) {
  outputJson.questionnaireData = questionnaireData
}

// Criar objeto binary (sem spread operator)
const outputBinary = {}

if ($binary) {
  if ($binary.fotoFrente) {
    outputBinary.fotoFrente = $binary.fotoFrente
  }
  if ($binary.fotoCostas) {
    outputBinary.fotoCostas = $binary.fotoCostas
  }
}

if ($input.item && $input.item.binary) {
  if ($input.item.binary.fotoFrente) {
    outputBinary.fotoFrente = $input.item.binary.fotoFrente
  }
  if ($input.item.binary.fotoCostas) {
    outputBinary.fotoCostas = $input.item.binary.fotoCostas
  }
}

// Retornar como array
return [{
  json: outputJson,
  binary: outputBinary
}]
```

## 🔄 Versão Ainda Mais Simples (Para Teste)

Se o código acima ainda der erro, use esta versão mínima:

```javascript
// Versão mínima para teste
console.log('$json:', $json)
console.log('$binary:', $binary)
console.log('$input.item:', $input.item)

// Retornar tudo que foi recebido
const item = {
  json: $json || {},
  binary: $binary || {}
}

return [item]
```

## 📋 Checklist de Verificação

1. ✅ **Modo do Code Node**: `Run Once for All Items`
2. ✅ **Raw Body no Webhook**: `false` (desmarcado)
3. ✅ **Código sem spread operators** (`...`)
4. ✅ **Retorno como array**: `return [{ ... }]`
5. ✅ **Verificação de existência**: Sempre verificar se variável existe antes de acessar

## 🐛 Se Ainda Não Funcionar

Execute este código de debug primeiro para ver exatamente o que está chegando:

```javascript
// Debug máximo - ver tudo
console.log('=== DEBUG MÁXIMO ===')
console.log('$json:', JSON.stringify($json, null, 2))
console.log('$binary:', $binary)
console.log('$input:', JSON.stringify($input, null, 2))
console.log('$input.item:', JSON.stringify($input.item, null, 2))
console.log('$input.item.json:', JSON.stringify($input.item?.json, null, 2))
console.log('$input.item.binary:', $input.item?.binary)

// Retornar dados originais sem processamento
return $input.all()
```

Isso vai mostrar exatamente onde os dados estão sendo recebidos.
