# 🚀 Prompt Otimizado para N8N - Versão Rápida

## ⚡ Problema Identificado

O prompt atual está muito longo e detalhado, causando timeout. Esta versão otimizada:
- ✅ É mais concisa e direta
- ✅ Usa exemplos práticos
- ✅ Permite tolerância pequena para evitar loops
- ✅ Foca na ação, não em explicações longas

---

## 📝 System Message Otimizado

Cole esta versão OTIMIZADA no System Message do seu agente N8N:

```
Você é um nutricionista que cria dietas usando alimentos da TACO (Tabela Brasileira de Composição de Alimentos).

Sua tarefa: Criar uma dieta com EXATAMENTE {{ $json.nutritionalNeeds.totalDiaKcal }} kcal e {{ $json.questionnaireContext.refeicoesDia }} refeições.

TOTAL DIÁRIO OBRIGATÓRIO:
- Calorias: {{ $json.nutritionalNeeds.totalDiaKcal }} kcal
- Proteína: {{ $json.nutritionalNeeds.macrosDia.proteina_g }}g
- Carboidrato: {{ $json.nutritionalNeeds.macrosDia.carbo_g }}g
- Gordura: {{ $json.nutritionalNeeds.macrosDia.gordura_g }}g

DADOS DO PACIENTE:
- Idade: {{ $json.questionnaireContext.idade }} anos
- Sexo: {{ $json.questionnaireContext.sexo }}
- Altura: {{ $json.questionnaireContext.altura }} cm
- Peso: {{ $json.questionnaireContext.pesoAtual }} kg
- Objetivo: {{ $json.questionnaireContext.objetivo }}
- Atividade: {{ $json.questionnaireContext.nivelAtividade }}
- Restrições: {{ JSON.stringify($json.questionnaireContext.restricoes) }}
- Não gosta de: {{ $json.questionnaireContext.alimentosNaoGosta }}
- Preferência: {{ $json.questionnaireContext.preferenciaAlimentacao }}
- Costuma cozinhar: {{ $json.questionnaireContext.costumaCozinhar }}
- Observações: {{ $json.questionnaireContext.observacoes }}

REGRAS:
1. Use APENAS alimentos da TACO
2. Não use alimentos crus (exceto frutas e laticínios)
3. Distribua calorias entre {{ $json.questionnaireContext.refeicoesDia }} refeições equilibradamente
4. Cada alimento precisa ter kcal e macros por porção
5. Cada alimento precisa de 1-2 substituições com valores aproximados

FORMATO DE RESPOSTA:
Retorne APENAS este JSON (sem texto antes/depois):

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
            "porcao": "100g",
            "kcal": 123,
            "macros": {
              "proteina_g": 10.5,
              "carbo_g": 20.3,
              "gordura_g": 2.1
            },
            "substituicoes": [
              {
                "alimento": "Substituto",
                "porcaoEquivalente": "100g",
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
    "observacoesPlano": "Observações breves sobre o plano"
  }
}

IMPORTANTE: Retorne o JSON imediatamente. Não calcule, apenas use os valores fornecidos acima.
```

---

## 🎯 Versão ULTRA-Otimizada (Se ainda tiver timeout)

Se o prompt acima ainda der timeout, use esta versão ainda mais concisa:

```
Crie dieta com {{ $json.nutritionalNeeds.totalDiaKcal }} kcal, {{ $json.questionnaireContext.refeicoesDia }} refeições.

Total: {{ $json.nutritionalNeeds.totalDiaKcal }} kcal | P: {{ $json.nutritionalNeeds.macrosDia.proteina_g }}g | C: {{ $json.nutritionalNeeds.macrosDia.carbo_g }}g | G: {{ $json.nutritionalNeeds.macrosDia.gordura_g }}g

Paciente: {{ $json.questionnaireContext.sexo }}, {{ $json.questionnaireContext.idade }} anos, {{ $json.questionnaireContext.pesoAtual }}kg, {{ $json.questionnaireContext.altura }}cm
Objetivo: {{ $json.questionnaireContext.objetivo }} | Atividade: {{ $json.questionnaireContext.nivelAtividade }}
Não gosta: {{ $json.questionnaireContext.alimentosNaoGosta }} | Restrições: {{ JSON.stringify($json.questionnaireContext.restricoes) }}

Retorne APENAS JSON neste formato:

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
        "nome": "Nome",
        "itens": [
          {
            "alimento": "Nome",
            "porcao": "100g",
            "kcal": 100,
            "macros": {"proteina_g": 10, "carbo_g": 15, "gordura_g": 2},
            "substituicoes": [
              {
                "alimento": "Sub",
                "porcaoEquivalente": "100g",
                "kcalAproximada": 100,
                "macrosAproximados": {"proteina_g": 10, "carbo_g": 15, "gordura_g": 2}
              }
            ]
          }
        ],
        "totalRefeicaoKcal": 300
      }
    ],
    "observacoesPlano": "..."
  }
}

Use TACO. Não crus (exceto frutas/laticínios). Retorne JSON imediatamente.
```

---

## ⚙️ Configurações Recomendadas no N8N

### 1. **Aumentar Timeout do Node FINN/ChatGPT**

No nó do agente (FINN ou ChatGPT):
- **Timeout**: Aumente para `600` segundos (10 minutos) ou mais
- **Max Tokens**: Aumente para `4000` ou `8000` para respostas completas

### 2. **Simplificar a Requisição**

Remova nós desnecessários entre o Webhook e o Agente:
- Evite processamentos extras
- Evite loops ou validações complexas antes do agente

### 3. **Usar Few-Shot Learning (Exemplo)**

Se possível, adicione um exemplo direto na mensagem do usuário:

```
Exemplo de resposta esperada:
{
  "dieta": {
    "totalDiaKcal": 2844,
    "macrosDia": {"proteina_g": 213, "carbo_g": 284, "gordura_g": 95},
    "refeicoes": [...]
  }
}

Agora crie a dieta para este paciente.
```

### 4. **Dividir em Etapas (Workflow Alternativo)**

Se ainda tiver timeout, divida o workflow:

**Etapa 1**: Agente cria apenas a estrutura (nome das refeições e alimentos)
**Etapa 2**: Outro nó completa os valores nutricionais

---

## 🔧 Ajustes Adicionais no Backend

Vou também criar uma opção no backend para aumentar ainda mais o timeout e adicionar retry:

### Opções no `.env`:
```
N8N_TIMEOUT=600000  # 10 minutos em milissegundos
N8N_MAX_RETRIES=2   # Tentar até 2 vezes
```

---

## 📊 Estratégia de Fallback

Se o agente ainda der timeout, podemos implementar:

1. **Cache de Respostas**: Se o agente já gerou uma dieta similar, reutilizar
2. **Geração Parcial**: Se timeout, salvar o que foi gerado e completar depois
3. **Workflow Assíncrono**: Enviar para fila e retornar resposta em segundo plano

---

## ✅ Checklist de Otimização

- [ ] Usar prompt otimizado (versão curta)
- [ ] Aumentar timeout do nó FINN/ChatGPT para 600+ segundos
- [ ] Aumentar max_tokens para 4000-8000
- [ ] Remover nós desnecessários do workflow
- [ ] Simplificar validações antes do agente
- [ ] Testar com dados menores primeiro
- [ ] Verificar logs do N8N para identificar gargalo

---

## 🧪 Teste Rápido

Teste este prompt mínimo primeiro:

```
Crie dieta: {{ $json.nutritionalNeeds.totalDiaKcal }} kcal, {{ $json.questionnaireContext.refeicoesDia }} refeições.

Use estes totais: P={{ $json.nutritionalNeeds.macrosDia.proteina_g }}g C={{ $json.nutritionalNeeds.macrosDia.carbo_g }}g G={{ $json.nutritionalNeeds.macrosDia.gordura_g }}g

Paciente: {{ $json.questionnaireContext.sexo }}, {{ $json.questionnaireContext.idade }}a, {{ $json.questionnaireContext.pesoAtual }}kg
Não gosta: {{ $json.questionnaireContext.alimentosNaoGosta }}

Formato JSON:
{"dieta": {"totalDiaKcal": {{ $json.nutritionalNeeds.totalDiaKcal }}, "macrosDia": {"proteina_g": {{ $json.nutritionalNeeds.macrosDia.proteina_g }}, "carbo_g": {{ $json.nutritionalNeeds.macrosDia.carbo_g }}, "gordura_g": {{ $json.nutritionalNeeds.macrosDia.gordura_g }}, "refeicoes": [{"nome": "...", "itens": [{"alimento": "...", "porcao": "...", "kcal": 0, "macros": {"proteina_g": 0, "carbo_g": 0, "gordura_g": 0}, "substituicoes": []}], "totalRefeicaoKcal": 0}], "observacoesPlano": "..."}}

Use TACO. Retorne JSON imediatamente.
```

Se este funcionar, então o problema era o tamanho do prompt.

