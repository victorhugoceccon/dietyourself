# 🔧 Código de Debug Corrigido - Retorna Array

## ⚠️ Erro: "Code doesn't return items properly"

Este erro ocorre porque o N8N **sempre espera um array de objetos** como retorno, mesmo que seja apenas um item.

## ✅ Solução: Retornar Array

### Código Completo para Nó Code

```javascript
// ============================================================
// DEBUG: Verificar todos os dados recebidos
// IMPORTANTE: Retornar como ARRAY!
// ============================================================

// 1. Ver todos os dados JSON recebidos
console.log('📋 Dados JSON ($json):', JSON.stringify($json, null, 2))

// 2. Ver todos os dados binários
console.log('📦 Dados binários ($binary):', Object.keys($binary || {}))

// 3. Ver estrutura do input (dados podem estar aqui!)
console.log('🔍 Input item:', Object.keys($input.item || {}))
console.log('🔍 Input item.json:', Object.keys($input.item?.json || {}))
console.log('🔍 Input item.binary:', Object.keys($input.item?.binary || {}))

// 4. Verificar questionnaireData (múltiplos locais)
let questionnaireData = null
if ($json.questionnaireData) {
  questionnaireData = $json.questionnaireData
  console.log('✅ questionnaireData em $json')
} else if ($input.item?.json?.questionnaireData) {
  questionnaireData = $input.item.json.questionnaireData
  console.log('✅ questionnaireData em $input.item.json')
} else {
  console.log('⚠️ questionnaireData não encontrado')
}

// 5. Verificar imagens (múltiplos locais)
const fotoFrente = $binary?.fotoFrente || $input.item?.binary?.fotoFrente
const fotoCostas = $binary?.fotoCostas || $input.item?.binary?.fotoCostas

console.log('Foto Frente:', fotoFrente ? 'OK' : 'MISSING')
console.log('Foto Costas:', fotoCostas ? 'OK' : 'MISSING')

// 6. RETORNAR COMO ARRAY (obrigatório!)
return [{
  json: {
    debug: {
      hasQuestionnaireData: !!questionnaireData,
      hasFotoFrente: !!fotoFrente,
      hasFotoCostas: !!fotoCostas,
      allJsonKeys: Object.keys($json || {}),
      allBinaryKeys: Object.keys($binary || {}),
      allInputItemKeys: Object.keys($input.item || {})
    },
    questionnaireData: questionnaireData
  },
  binary: {
    ...($binary || {}),
    ...($input.item?.binary || {}),
    ...(fotoFrente && { fotoFrente }),
    ...(fotoCostas && { fotoCostas })
  }
}]
```

## 🔑 Diferença Principal

### ❌ ERRADO (causa o erro)
```javascript
return {
  json: { ... },
  binary: { ... }
}
```

### ✅ CORRETO (retorna array)
```javascript
return [{
  json: { ... },
  binary: { ... }
}]
```

## 📝 Como Usar

1. Cole o código acima no nó **Code** do N8N
2. Execute o workflow
3. Verifique os logs no console do N8N
4. O OUTPUT agora deve mostrar os dados corretamente

## 💡 Dica

Se ainda houver problemas, verifique:
- **Raw Body** no Webhook está como `false`?
- Os dados podem estar em `$input.item.json` ao invés de `$json`
- Os binários podem estar em `$input.item.binary` ao invés de `$binary`
