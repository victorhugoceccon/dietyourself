# 🔧 Mudanças Necessárias no Agente N8N - Geração de Dieta

## 📋 Resumo das Mudanças

O backend agora **calcula e envia as necessidades nutricionais** para o agente, então o agente deve:
1. ✅ **Usar os valores calculados** ao invés de calcular
2. ✅ **Respeitar exatamente** os valores de calorias e macronutrientes
3. ✅ **Retornar no formato correto** para evitar erros

---

## 📤 O que o Backend Está Enviando Agora

O payload agora inclui `nutritionalNeeds` com valores **PRÉ-CALCULADOS**:

```json
{
  "questionnaireContext": {
    "idade": 28,
    "sexo": "Masculino",
    "altura": 175,
    "pesoAtual": 80,
    "objetivo": "Emagrecer",
    "nivelAtividade": "Moderadamente ativo (3–4x por semana)",
    "refeicoesDia": 5,
    "restricoes": ["Lactose"],
    "alimentosNaoGosta": "Brócolis",
    "preferenciaAlimentacao": "Caseira tradicional",
    "costumaCozinhar": "Sim quase sempre",
    "observacoes": "Almoço fora"
  },
  "nutritionalNeeds": {
    "totalDiaKcal": 2823,
    "macrosDia": {
      "proteina_g": 141,
      "carbo_g": 353,
      "gordura_g": 94
    },
    "tmb": 1923,
    "fatorAtividade": 1.55,
    "instrucao": "IMPORTANTE: Você DEVE criar uma dieta que resulte em EXATAMENTE 2823 kcal por dia, com 141g de proteína, 353g de carboidrato e 94g de gordura. O totalDiaKcal e macrosDia no JSON de resposta DEVEM corresponder a estes valores. Crie 5 refeições por dia conforme solicitado."
  }
}
```

---

## 🎯 Mudanças Necessárias no Agente N8N

### 1. **Acessar `nutritionalNeeds` no Workflow**

No N8N, os dados chegam em `$json`, então você pode acessar:

```javascript
// Calorias totais diárias OBRIGATÓRIAS
{{ $json.nutritionalNeeds.totalDiaKcal }}

// Macros OBRIGATÓRIOS
{{ $json.nutritionalNeeds.macrosDia.proteina_g }}  // Proteína em gramas
{{ $json.nutritionalNeeds.macrosDia.carbo_g }}     // Carboidrato em gramas
{{ $json.nutritionalNeeds.macrosDia.gordura_g }}   // Gordura em gramas

// Número de refeições
{{ $json.questionnaireContext.refeicoesDia }}

// Instrução explícita
{{ $json.nutritionalNeeds.instrucao }}
```

### 2. **Atualizar System Message do Agente**

**IMPORTANTE**: Adicione as necessidades nutricionais calculadas na instrução do agente:

```
Você é um assistente nutricional especializado em criar dietas personalizadas para o DietYourself.

DADOS DO PACIENTE:
- Idade: {{ $json.questionnaireContext.idade }} anos
- Sexo: {{ $json.questionnaireContext.sexo }}
- Altura: {{ $json.questionnaireContext.altura }} cm
- Peso: {{ $json.questionnaireContext.pesoAtual }} kg
- Objetivo: {{ $json.questionnaireContext.objetivo }}
- Nível de atividade: {{ $json.questionnaireContext.nivelAtividade }}
- Refeições por dia: {{ $json.questionnaireContext.refeicoesDia }}
- Restrições alimentares: {{ JSON.stringify($json.questionnaireContext.restricoes) }}
- Alimentos que não gosta: {{ $json.questionnaireContext.alimentosNaoGosta }}
- Preferência alimentar: {{ $json.questionnaireContext.preferenciaAlimentacao }}
- Costuma cozinhar: {{ $json.questionnaireContext.costumaCozinhar }}
- Observações: {{ $json.questionnaireContext.observacoes }}

NECESSIDADES NUTRICIONAIS CALCULADAS (USAR ESTES VALORES EXATOS):
- Calorias totais diárias: {{ $json.nutritionalNeeds.totalDiaKcal }} kcal
- Proteína: {{ $json.nutritionalNeeds.macrosDia.proteina_g }}g
- Carboidrato: {{ $json.nutritionalNeeds.macrosDia.carbo_g }}g
- Gordura: {{ $json.nutritionalNeeds.macrosDia.gordura_g }}g

{{ $json.nutritionalNeeds.instrucao }}

INSTRUÇÕES CRÍTICAS:
1. NÃO calcule as necessidades nutricionais - use os valores acima que já foram calculados
2. Crie EXATAMENTE {{ $json.questionnaireContext.refeicoesDia }} refeições por dia
3. O total de calorias de TODAS as refeições deve resultar em EXATAMENTE {{ $json.nutritionalNeeds.totalDiaKcal }} kcal
4. A soma dos macronutrientes de TODAS as refeições deve resultar em:
   - Proteína: {{ $json.nutritionalNeeds.macrosDia.proteina_g }}g
   - Carboidrato: {{ $json.nutritionalNeeds.macrosDia.carbo_g }}g
   - Gordura: {{ $json.nutritionalNeeds.macrosDia.gordura_g }}g
5. Para cada alimento, inclua as informações nutricionais (kcal e macros) por porção
6. Para cada alimento, forneça pelo menos 2 opções de substituição com valores nutricionais aproximados

FORMATO DE RESPOSTA OBRIGATÓRIO:
Você DEVE retornar APENAS um JSON válido no seguinte formato:

{
  "dieta": {
    "totalDiaKcal": {{ $json.nutritionalNeeds.totalDiaKcal }},
    "macrosDia": {
      "proteina_g": {{ $json.nutritionalNeeds.macrosDia.proteina_g }},
      "carbo_g": {{ $json.nutritionalNeeds.macrosDia.carbo_g }},
      "gordura_g": {{ $json.nutritionalNeeds.macrosDia.gordura_g }}
    },
    "refeicoes": [
      {
        "nome": "Nome da Refeição",
        "itens": [
          {
            "alimento": "Nome do Alimento",
            "porcao": "Quantidade (ex: 100g, 200ml)",
            "kcal": 123,
            "macros": {
              "proteina_g": 10.5,
              "carbo_g": 20.3,
              "gordura_g": 2.1
            },
            "substituicoes": [
              {
                "alimento": "Alimento substituto",
                "porcaoEquivalente": "Quantidade equivalente",
                "kcalAproximada": 120,
                "macrosAproximados": {
                  "proteina_g": 10.0,
                  "carbo_g": 19.5,
                  "gordura_g": 2.0
                }
              }
            ]
          }
        ],
        "totalRefeicaoKcal": 456
      }
    ],
    "observacoesPlano": "Observações sobre o plano alimentar"
  }
}

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional antes ou depois
- O totalDiaKcal e macrosDia DEVEM corresponder EXATAMENTE aos valores fornecidos
- Use apenas alimentos da TACO (Tabela Brasileira de Composição de Alimentos)
- Não use alimentos crus exceto frutas e laticínios
- Distribua as calorias e macros entre as refeições de forma equilibrada
```

### 3. **Validação no N8N (Opcional mas Recomendado)**

Adicione um nó **Code** ou **Function** antes de retornar para validar:

```javascript
// Validar que os valores estão corretos
const response = JSON.parse($json.output || $json.text);

// Verificar se totalDiaKcal corresponde
const expectedKcal = $json.nutritionalNeeds.totalDiaKcal;
const actualKcal = response.dieta.totalDiaKcal;

if (Math.abs(actualKcal - expectedKcal) > (expectedKcal * 0.05)) {
  return {
    error: `Total de calorias (${actualKcal}) não corresponde ao esperado (${expectedKcal})`
  };
}

// Verificar macros
const expectedMacros = $json.nutritionalNeeds.macrosDia;
const actualMacros = response.dieta.macrosDia;

if (Math.abs(actualMacros.proteina_g - expectedMacros.proteina_g) > (expectedMacros.proteina_g * 0.1)) {
  return {
    error: `Proteína (${actualMacros.proteina_g}g) não corresponde ao esperado (${expectedMacros.proteina_g}g)`
  };
}

return response;
```

### 4. **Atualizar Formato de Resposta**

Certifique-se de que o agente retorna no formato exato:

```json
{
  "dieta": {
    "totalDiaKcal": 2823,
    "macrosDia": {
      "proteina_g": 141,
      "carbo_g": 353,
      "gordura_g": 94
    },
    "refeicoes": [...],
    "observacoesPlano": "..."
  }
}
```

**❌ NÃO retorne assim:**
- `{ "nutritionalNeeds": {...}, "dieta": {...} }` (o backend já tem nutritionalNeeds)
- `{ "calorias": ..., "macros": {...} }` (use o formato acima)

---

## ⚡ Benefícios das Mudanças

1. ✅ **Mais Rápido**: Agente não precisa calcular necessidades nutricionais
2. ✅ **Mais Preciso**: Valores calculados são garantidos pelo backend
3. ✅ **Sem Timeout**: Processamento mais rápido = menos chance de timeout
4. ✅ **Valores Respeitados**: Backend valida e corrige se necessário

---

## 🧪 Como Testar

1. **Execute o workflow manualmente** com dados de teste
2. **Verifique os logs** no console do backend:
   - Deve mostrar: `📊 Calculando necessidades nutricionais...`
   - Deve mostrar os valores calculados
   - Deve mostrar: `📤 Payload preparado para N8N com necessidades nutricionais calculadas`
3. **Verifique a resposta** do agente:
   - `totalDiaKcal` deve corresponder ao valor enviado
   - `macrosDia` deve corresponder aos valores enviados
4. **Se houver diferença > 5%**, o backend corrigirá automaticamente, mas é melhor que o agente respeite desde o início

---

## 📝 Checklist de Implementação

- [ ] Acessar `$json.nutritionalNeeds` no workflow
- [ ] Atualizar System Message para usar valores de `nutritionalNeeds`
- [ ] Remover qualquer cálculo de necessidades nutricionais do agente
- [ ] Garantir que o formato de resposta está correto
- [ ] Testar com dados reais
- [ ] Verificar logs do backend para confirmar que valores estão sendo enviados

---

## ⚠️ Importante

- **NÃO** calcule as necessidades nutricionais no agente - use os valores enviados
- **SEMPRE** retorne `totalDiaKcal` e `macrosDia` no formato exato mostrado acima
- **RESPEITE** exatamente os valores enviados em `nutritionalNeeds`
- O backend corrigirá automaticamente se houver diferença, mas isso indica que o agente não está seguindo as instruções corretamente

