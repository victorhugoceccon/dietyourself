# 📋 Contexto do Usuário no N8N

## ✅ O que foi implementado

Agora o chat envia automaticamente os dados do usuário para o N8N, permitindo que o agente tenha contexto completo para sugerir mudanças na dieta.

## 📤 Dados Enviados

O payload agora inclui:

```json
{
  "message": {
    "chat": {
      "id": "userId"
    },
    "text": "mensagem do usuário"
  },
  "userContext": {
    "questionnaire": {
      "idade": 28,
      "sexo": "Masculino",
      "altura": 175,
      "pesoAtual": 80,
      "objetivo": "Emagrecer",
      "nivelAtividade": "Moderadamente ativo",
      "refeicoesDia": 5,
      "restricoes": ["Lactose"],
      "alimentosNaoGosta": "Brócolis",
      "preferenciaAlimentacao": "Caseira tradicional",
      "costumaCozinhar": "Sim quase sempre",
      "observacoes": "Almoço fora"
    },
    "diet": {
      // Dados completos da dieta gerada (JSON)
      "refeicoes": [...],
      "resumo": {...}
    }
  }
}
```

## 🎯 Como Usar no N8N

### No Nó FINN ou ChatGPT:

Você pode usar o contexto nas mensagens do sistema ou nas instruções:

**System Message:**
```
Você é um assistente nutricional do DietYourself.

DADOS DO PACIENTE:
- Idade: {{ $json.userContext.questionnaire.idade }} anos
- Sexo: {{ $json.userContext.questionnaire.sexo }}
- Altura: {{ $json.userContext.questionnaire.altura }} cm
- Peso: {{ $json.userContext.questionnaire.pesoAtual }} kg
- Objetivo: {{ $json.userContext.questionnaire.objetivo }}
- Nível de atividade: {{ $json.userContext.questionnaire.nivelAtividade }}
- Refeições por dia: {{ $json.userContext.questionnaire.refeicoesDia }}
- Restrições alimentares: {{ $json.userContext.questionnaire.restricoes }}
- Alimentos que não gosta: {{ $json.userContext.questionnaire.alimentosNaoGosta }}
- Preferência alimentar: {{ $json.userContext.questionnaire.preferenciaAlimentacao }}
- Costuma cozinhar: {{ $json.userContext.questionnaire.costumaCozinhar }}
- Observações: {{ $json.userContext.questionnaire.observacoes }}

DIETA ATUAL:
{{ JSON.stringify($json.userContext.diet, null, 2) }}

Use essas informações para dar sugestões personalizadas e relevantes ao paciente.
Sempre considere as restrições alimentares e preferências ao sugerir mudanças.
```

**IMPORTANTE:** 
- Use `{{ $json.userContext.questionnaire.idade }}` (não `$json.body.userContext`)
- Use `{{ $json.userContext.diet }}` (não `$json.body.userContext.diet`)
- Os dados vêm diretamente em `$json`, não em `$json.body`

### Exemplo de Uso Condicional:

```javascript
// Verificar se tem dieta
{{ $json.userContext.diet ? "O paciente tem uma dieta cadastrada." : "O paciente ainda não tem dieta cadastrada." }}

// Verificar restrições
{{ $json.userContext.questionnaire.restricoes.length > 0 ? "Paciente tem restrições: " + $json.userContext.questionnaire.restricoes.join(", ") : "Paciente não tem restrições alimentares" }}
```

## 📝 Campos Disponíveis

### Questionnaire:
- `idade` - Idade do paciente
- `sexo` - Masculino/Feminino
- `altura` - Altura em cm
- `pesoAtual` - Peso em kg
- `objetivo` - Emagrecer/Manter peso/Ganhar massa muscular
- `nivelAtividade` - Sedentário/Levemente ativo/Moderadamente ativo/Muito ativo
- `refeicoesDia` - Número de refeições (3-6)
- `restricoes` - Array de restrições (ex: ["Lactose", "Glúten"])
- `alimentosNaoGosta` - Texto livre
- `preferenciaAlimentacao` - Simples e rápida/Caseira tradicional/Mais fitness/Tanto faz
- `costumaCozinhar` - Sim quase sempre/Às vezes/Quase nunca
- `observacoes` - Texto livre

### Diet:
- Objeto JSON completo da dieta gerada
- Pode incluir: refeições, macronutrientes, resumo diário, etc.

## ⚠️ Observações

- Se o usuário não preencheu o questionário, `userContext.questionnaire` será `null`
- Se o usuário não tem dieta gerada, `userContext.diet` será `null`
- Sempre verifique se os dados existem antes de usar no N8N

## 🔍 Exemplo de Verificação no N8N:

```javascript
// Verificar se tem questionário
{{ $json.userContext.questionnaire ? "Tem dados do questionário" : "Sem dados do questionário" }}

// Verificar se tem dieta
{{ $json.userContext.diet ? "Tem dieta cadastrada" : "Sem dieta cadastrada" }}
```

