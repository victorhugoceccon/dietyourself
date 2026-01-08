# 🥤 Suporte a Alimentos Customizados - Guia de Atualização do N8N

## 📋 Resumo

O sistema agora suporta alimentos customizados (como Whey Protein, suplementos, etc.) que não estão na tabela TACO. Esses alimentos podem ser:
- ✅ Criados pelo nutricionista através da interface
- ✅ Adicionados manualmente na dieta
- ✅ Considerados pela IA de troca de alimentos

⚠️ **IMPORTANTE**: A IA só pode sugerir alimentos customizados que **já foram criados** pelo nutricionista no banco de dados. Se o usuário pedir um alimento que não existe nem na TACO nem nos customizados criados, a IA pode:
- Sugerir alimentos similares da TACO
- Informar que o alimento não está disponível
- Sugerir criar um alimento customizado (veja seção "Sugestão de Criação" abaixo)

## 🔄 Mudanças Implementadas no Backend

### 1. Endpoint `/diet/swap-food` Atualizado

O endpoint agora inclui os alimentos customizados do nutricionista no payload enviado ao N8N:

```json
{
  "swapRequest": {
    "mealName": "Café da Manhã",
    "originalItem": {
      "alimento": "Arroz, integral, cozido",
      "peso_g": 100,
      "kcal": 124
    },
    "currentMealItems": [...],
    "userDesiredFood": "whey protein"
  },
  "userContext": {
    "questionnaire": {...}
  },
  "customFoods": [
    {
      "descricao": "Whey Protein Concentrado",
      "categoria": "Customizado",
      "energiaKcal": 400,  // por 100g
      "proteina": 80,      // por 100g
      "lipideos": 5,       // por 100g
      "carboidrato": 8     // por 100g
    }
  ]
}
```

## 🤖 Atualização Necessária no N8N

### Passo 1: Atualizar o Prompt do Agente

No workflow do N8N que processa a troca de alimentos (`swap-food`), você precisa atualizar o **System Message** do agente para considerar os alimentos customizados.

#### Adicione esta seção ao System Message:

```
ALIMENTOS CUSTOMIZADOS DISPONÍVEIS:
{{ $json.customFoods }}

IMPORTANTE: Além dos alimentos da tabela TACO, você também pode usar os alimentos customizados listados acima.
Estes alimentos foram criados pelo nutricionista e devem ser considerados nas sugestões de troca.

Quando o usuário solicitar um alimento que existe na lista de customFoods, priorize sugerir esse alimento customizado.
```

#### Exemplo de Prompt Completo Atualizado:

```
Você é um assistente nutricional que ajuda pacientes a trocar alimentos em suas dietas.

CONTEXTO DA TROCA:
- Refeição: {{ $json.swapRequest.mealName }}
- Alimento atual: {{ $json.swapRequest.originalItem.alimento }} ({{ $json.swapRequest.originalItem.peso_g }}g, {{ $json.swapRequest.originalItem.kcal }} kcal)
- Alimento desejado pelo usuário: {{ $json.swapRequest.userDesiredFood }}
- Outros alimentos na refeição: {{ $json.swapRequest.currentMealItems }}

ALIMENTOS CUSTOMIZADOS DISPONÍVEIS:
{{ JSON.stringify($json.customFoods, null, 2) }}

REGRAS:
1. Use alimentos da tabela TACO OU dos alimentos customizados listados acima
2. Quando o usuário solicitar um alimento que existe em customFoods, priorize sugerir esse alimento customizado
3. Mantenha valores nutricionais similares ao alimento original quando possível
4. Considere restrições e preferências do usuário: {{ $json.userContext.questionnaire }}

FORMATO DE RESPOSTA:
{
  "status": "ok",
  "bestMatch": {
    "alimento": "Nome do alimento",
    "porcaoEquivalente_g": 100,
    "kcalAproximada": 120,
    "observacao": "Observação opcional"
  },
  "suggestions": [
    {
      "alimento": "Outro alimento",
      "porcaoEquivalente_g": 100,
      "kcalAproximada": 120,
      "observacao": "Observação opcional"
    }
  ],
  "notes": "Notas adicionais sobre as sugestões"
}
```

### Passo 2: Processar `customFoods` no Workflow

No seu workflow do N8N, você pode acessar os alimentos customizados através de:

```javascript
// JavaScript Code Node
const customFoods = $json.customFoods || []

// Exemplo: Buscar whey protein nos alimentos customizados
const wheyProtein = customFoods.find(food => 
  food.descricao.toLowerCase().includes('whey')
)

if (wheyProtein) {
  // Usar whey protein customizado
  return {
    json: {
      ...$json,
      customFoodFound: wheyProtein
    }
  }
}
```

### Passo 3: Combinar TACO + Custom Foods

A IA deve considerar tanto alimentos da TACO quanto alimentos customizados. Exemplo de lógica:

```
1. Se o usuário pedir "whey protein":
   - Primeiro verificar se existe em customFoods
   - Se existir, sugerir o alimento customizado
   - Se não existir, buscar na TACO ou sugerir criar um customizado

2. Se o usuário pedir um alimento comum (ex: "maçã"):
   - Buscar na TACO primeiro
   - Se não encontrar adequado, verificar customFoods como alternativa
```

## 📝 Exemplo Prático

### Cenário: Usuário quer trocar "Arroz" por "Whey Protein"

**Payload recebido:**
```json
{
  "swapRequest": {
    "originalItem": {
      "alimento": "Arroz, integral, cozido",
      "peso_g": 100,
      "kcal": 124
    },
    "userDesiredFood": "whey protein"
  },
  "customFoods": [
    {
      "descricao": "Whey Protein Concentrado",
      "energiaKcal": 400,
      "proteina": 80,
      "lipideos": 5,
      "carboidrato": 8
    }
  ]
}
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "bestMatch": {
    "alimento": "Whey Protein Concentrado",
    "porcaoEquivalente_g": 31,
    "kcalAproximada": 124,
    "observacao": "Alimento customizado. Para manter as mesmas calorias, use aproximadamente 31g de whey protein."
  },
  "suggestions": [
    {
      "alimento": "Whey Protein Isolado",
      "porcaoEquivalente_g": 30,
      "kcalAproximada": 120,
      "observacao": "Alternativa com menos carboidratos"
    }
  ],
  "notes": "Whey protein é uma excelente fonte de proteína. O alimento customizado foi encontrado e sugerido."
}
```

## ✅ Checklist de Implementação

- [ ] Atualizar System Message do agente N8N para incluir `customFoods`
- [ ] Adicionar lógica para buscar alimentos customizados antes de buscar na TACO
- [ ] Testar troca de alimento comum (deve funcionar como antes)
- [ ] Testar troca para alimento customizado (ex: whey protein)
- [ ] Verificar se os cálculos de porção equivalente estão corretos
- [ ] Garantir que alimentos customizados aparecem nas sugestões

## 🔍 Validação

Para validar se está funcionando:

1. Crie um alimento customizado (ex: "Whey Protein") na interface do nutricionista
2. Adicione um alimento na dieta do paciente
3. Clique em "Trocar por IA" e solicite "whey protein"
4. Verifique se o alimento customizado aparece nas sugestões
5. Selecione o alimento customizado e verifique se os valores nutricionais são calculados corretamente

## 📌 Notas Importantes

- Os alimentos customizados têm valores nutricionais **por 100g** (padronizado)
- A IA deve calcular a porção equivalente baseada nas calorias do alimento original
- Alimentos customizados devem ser claramente identificados nas observações
- ⚠️ **A IA só pode sugerir alimentos customizados que já foram criados pelo nutricionista**
- Se um alimento customizado não existir, a IA pode sugerir criar um novo (veja seção abaixo)

## 💡 Sugestão de Criação de Alimento Customizado

Quando a IA não encontrar um alimento nem na TACO nem nos customizados existentes, ela pode sugerir criar um novo alimento customizado. Para isso, adicione ao prompt do N8N:

### Formato de Resposta com Sugestão de Criação:

```json
{
  "status": "ok",
  "bestMatch": null,
  "suggestions": [
    {
      "alimento": "Whey Protein Isolado",
      "porcaoEquivalente_g": 30,
      "kcalAproximada": 120,
      "observacao": "Alimento não encontrado na TACO"
    }
  ],
  "suggestCreateCustom": {
    "descricao": "Whey Protein Isolado",
    "categoria": "Suplementos",
    "energiaKcal": 400,
    "proteina": 90,
    "lipideos": 1,
    "carboidrato": 2,
    "observacao": "Valores nutricionais típicos para whey protein isolado por 100g. Você pode criar este alimento customizado na interface."
  },
  "notes": "O alimento solicitado não foi encontrado na TACO nem nos alimentos customizados. Sugerimos criar um alimento customizado com os valores nutricionais acima."
}
```

### Instrução para o Prompt:

```
Se o alimento solicitado pelo usuário não existir na TACO nem em customFoods, você pode sugerir criar um alimento customizado. 
Neste caso, inclua no campo "suggestCreateCustom" os valores nutricionais estimados para o alimento (por 100g).
O nutricionista poderá então criar este alimento através da interface.
```

## 🐛 Troubleshooting

**Problema:** Alimentos customizados não aparecem nas sugestões
- **Solução:** Verifique se o campo `customFoods` está sendo acessado corretamente no N8N (`$json.customFoods`)

**Problema:** Cálculos incorretos para alimentos customizados
- **Solução:** Lembre-se que os valores são por 100g. Calcule: `(calorias_desejadas / kcal_por_100g) * 100`

**Problema:** IA não prioriza alimentos customizados
- **Solução:** Adicione instrução explícita no prompt: "Quando o usuário solicitar um alimento que existe em customFoods, SEMPRE priorize sugerir esse alimento customizado"

