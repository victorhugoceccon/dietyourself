# 📝 Template para FINN no N8N

## ✅ Caminho Correto dos Dados

No N8N, quando você recebe dados do webhook, eles vêm diretamente em `$json`, **NÃO** em `$json.body`.

### ❌ ERRADO:
```
{{ $json.body.userContext.questionnaire.idade }}
{{ $json.body.userContext.diet }}
```

### ✅ CORRETO:
```
{{ $json.userContext.questionnaire.idade }}
{{ $json.userContext.diet }}
```

## 🎯 Template Completo para System Message

Cole este template no System Message do FINN:

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
Sempre considere as restrições alimentares e preferências ao sugerir mudanças na dieta.
Quando o paciente perguntar sobre sua dieta, consulte os dados da DIETA ATUAL acima.
```

## 📋 Campos Disponíveis

### Questionnaire:
- `{{ $json.userContext.questionnaire.idade }}` - Idade
- `{{ $json.userContext.questionnaire.sexo }}` - Sexo
- `{{ $json.userContext.questionnaire.altura }}` - Altura (cm)
- `{{ $json.userContext.questionnaire.pesoAtual }}` - Peso (kg)
- `{{ $json.userContext.questionnaire.objetivo }}` - Objetivo
- `{{ $json.userContext.questionnaire.nivelAtividade }}` - Nível de atividade
- `{{ $json.userContext.questionnaire.refeicoesDia }}` - Refeições por dia
- `{{ $json.userContext.questionnaire.restricoes }}` - Array de restrições
- `{{ $json.userContext.questionnaire.alimentosNaoGosta }}` - Alimentos que não gosta
- `{{ $json.userContext.questionnaire.preferenciaAlimentacao }}` - Preferência alimentar
- `{{ $json.userContext.questionnaire.costumaCozinhar }}` - Costuma cozinhar
- `{{ $json.userContext.questionnaire.observacoes }}` - Observações

### Diet:
- `{{ $json.userContext.diet }}` - Objeto completo da dieta
- `{{ JSON.stringify($json.userContext.diet, null, 2) }}` - Dieta formatada em JSON

## 🔍 Verificar Dados Recebidos

Para verificar se os dados estão chegando corretamente:

1. No nó Webhook, clique em "Execute step"
2. Veja o OUTPUT no painel direito
3. Verifique se `userContext` está presente
4. Verifique a estrutura: `$json.userContext.questionnaire` e `$json.userContext.diet`

## ⚠️ Tratamento de Valores Nulos

Se algum campo não existir, o N8N pode mostrar "undefined". Para evitar isso:

```
{{ $json.userContext.questionnaire?.idade || 'Não informado' }} anos
```

Ou verificar antes de usar:
```
{{ $json.userContext.questionnaire ? $json.userContext.questionnaire.idade + ' anos' : 'Dados não disponíveis' }}
```

## 📝 Exemplo de Uso Condicional

```
{{ $json.userContext.diet ? 'O paciente tem uma dieta cadastrada com ' + $json.userContext.diet.refeicoes.length + ' refeições.' : 'O paciente ainda não tem dieta cadastrada.' }}
```


