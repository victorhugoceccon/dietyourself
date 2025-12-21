# 📋 Formato JSON de Saída da IA - Geração de Dietas

## 🎯 Formato OBRIGATÓRIO (Recomendado)

A IA **DEVE** retornar o seguinte formato JSON:

```json
{
  "dieta": {
    "totalDiaKcal": 2500,
    "macrosDia": {
      "proteina_g": 150,
      "carbo_g": 300,
      "gordura_g": 70
    },
    "refeicoes": [
      {
        "nome": "Café da Manhã",
        "horario": "07:00",
        "totalRefeicaoKcal": 600,
        "itens": [
          {
            "alimento": "Arroz branco cozido",
            "porcao": "150g",
            "kcal": 200,
            "macros": {
              "proteina_g": 4.5,
              "carbo_g": 45,
              "gordura_g": 0.5
            },
            "substituicoes": [
              {
                "alimento": "Arroz integral cozido",
                "porcao": "150g",
                "kcal": 180,
                "macros": {
                  "proteina_g": 4.8,
                  "carbo_g": 42,
                  "gordura_g": 1.2
                }
              }
            ]
          },
          {
            "alimento": "Peito de frango grelhado",
            "porcao": "150g",
            "kcal": 250,
            "macros": {
              "proteina_g": 46.5,
              "carbo_g": 0,
              "gordura_g": 5.2
            },
            "substituicoes": []
          },
          {
            "alimento": "Salada de alface e tomate",
            "porcao": "100g",
            "kcal": 20,
            "macros": {
              "proteina_g": 1,
              "carbo_g": 4,
              "gordura_g": 0.2
            },
            "substituicoes": []
          },
          {
            "alimento": "Banana",
            "porcao": "1 unidade média (100g)",
            "kcal": 90,
            "macros": {
              "proteina_g": 1.1,
              "carbo_g": 23,
              "gordura_g": 0.3
            },
            "substituicoes": []
          }
        ]
      },
      {
        "nome": "Almoço",
        "horario": "12:30",
        "totalRefeicaoKcal": 800,
        "itens": [
          {
            "alimento": "Batata doce cozida",
            "porcao": "200g",
            "kcal": 180,
            "macros": {
              "proteina_g": 2,
              "carbo_g": 42,
              "gordura_g": 0.2
            },
            "substituicoes": []
          },
          {
            "alimento": "Carne bovina magra grelhada",
            "porcao": "150g",
            "kcal": 300,
            "macros": {
              "proteina_g": 45,
              "carbo_g": 0,
              "gordura_g": 12
            },
            "substituicoes": []
          },
          {
            "alimento": "Brócolis cozido",
            "porcao": "150g",
            "kcal": 50,
            "macros": {
              "proteina_g": 3,
              "carbo_g": 8,
              "gordura_g": 0.5
            },
            "substituicoes": []
          },
          {
            "alimento": "Azeite de oliva",
            "porcao": "10ml",
            "kcal": 90,
            "macros": {
              "proteina_g": 0,
              "carbo_g": 0,
              "gordura_g": 10
            },
            "substituicoes": []
          },
          {
            "alimento": "Maçã",
            "porcao": "1 unidade média (150g)",
            "kcal": 80,
            "macros": {
              "proteina_g": 0.3,
              "carbo_g": 20,
              "gordura_g": 0.2
            },
            "substituicoes": []
          }
        ]
      },
      {
        "nome": "Lanche da Tarde",
        "horario": "16:00",
        "totalRefeicaoKcal": 300,
        "itens": [
          {
            "alimento": "Whey protein",
            "porcao": "30g",
            "kcal": 120,
            "macros": {
              "proteina_g": 24,
              "carbo_g": 3,
              "gordura_g": 1
            },
            "substituicoes": []
          },
          {
            "alimento": "Aveia em flocos",
            "porcao": "40g",
            "kcal": 150,
            "macros": {
              "proteina_g": 5.2,
              "carbo_g": 27,
              "gordura_g": 3
            },
            "substituicoes": []
          },
          {
            "alimento": "Mamão",
            "porcao": "150g",
            "kcal": 60,
            "macros": {
              "proteina_g": 0.6,
              "carbo_g": 15,
              "gordura_g": 0.1
            },
            "substituicoes": []
          }
        ]
      },
      {
        "nome": "Jantar",
        "horario": "19:30",
        "totalRefeicaoKcal": 600,
        "itens": [
          {
            "alimento": "Arroz branco cozido",
            "porcao": "120g",
            "kcal": 160,
            "macros": {
              "proteina_g": 3.6,
              "carbo_g": 36,
              "gordura_g": 0.4
            },
            "substituicoes": []
          },
          {
            "alimento": "Salmão grelhado",
            "porcao": "150g",
            "kcal": 280,
            "macros": {
              "proteina_g": 40,
              "carbo_g": 0,
              "gordura_g": 12
            },
            "substituicoes": []
          },
          {
            "alimento": "Salada de rúcula e tomate",
            "porcao": "100g",
            "kcal": 25,
            "macros": {
              "proteina_g": 1.2,
              "carbo_g": 4.5,
              "gordura_g": 0.3
            },
            "substituicoes": []
          },
          {
            "alimento": "Azeite de oliva",
            "porcao": "10ml",
            "kcal": 90,
            "macros": {
              "proteina_g": 0,
              "carbo_g": 0,
              "gordura_g": 10
            },
            "substituicoes": []
          },
          {
            "alimento": "Morango",
            "porcao": "100g",
            "kcal": 35,
            "macros": {
              "proteina_g": 0.7,
              "carbo_g": 8,
              "gordura_g": 0.3
            },
            "substituicoes": []
          }
        ]
      },
      {
        "nome": "Ceia",
        "horario": "22:00",
        "totalRefeicaoKcal": 200,
        "itens": [
          {
            "alimento": "Iogurte natural desnatado",
            "porcao": "200ml",
            "kcal": 120,
            "macros": {
              "proteina_g": 8,
              "carbo_g": 12,
              "gordura_g": 0.2
            },
            "substituicoes": []
          },
          {
            "alimento": "Castanha-do-pará",
            "porcao": "20g",
            "kcal": 130,
            "macros": {
              "proteina_g": 3,
              "carbo_g": 2.5,
              "gordura_g": 13
            },
            "substituicoes": []
          }
        ]
      }
    ]
  }
}
```

---

## ⚠️ IMPORTANTE: Valores OBRIGATÓRIOS

### **1. `totalDiaKcal` (OBRIGATÓRIO)**
- **Tipo**: `number`
- **Descrição**: Total de calorias do dia
- **DEVE corresponder EXATAMENTE** ao valor enviado em `nutritionalNeeds.totalDiaKcal`
- **Exemplo**: `2500`

### **2. `macrosDia` (OBRIGATÓRIO)**
- **Tipo**: `object`
- **Campos obrigatórios**:
  - `proteina_g`: `number` - Total de proteína em gramas
  - `carbo_g`: `number` - Total de carboidrato em gramas
  - `gordura_g`: `number` - Total de gordura em gramas
- **DEVE corresponder EXATAMENTE** aos valores enviados em `nutritionalNeeds.macrosDia`
- **Exemplo**:
  ```json
  {
    "proteina_g": 150,
    "carbo_g": 300,
    "gordura_g": 70
  }
  ```

### **3. `refeicoes` (OBRIGATÓRIO)**
- **Tipo**: `array`
- **Descrição**: Array de refeições do dia
- **Quantidade**: Deve corresponder ao número de refeições solicitado no questionário
- **Estrutura de cada refeição**:
  ```json
  {
    "nome": "string",           // Nome da refeição (ex: "Café da Manhã")
    "horario": "string",        // Horário sugerido (ex: "07:00")
    "totalRefeicaoKcal": number, // Total de calorias desta refeição
    "itens": [...]              // Array de itens da refeição
  }
  ```

### **4. Estrutura de cada `item` (OBRIGATÓRIO)**
```json
{
  "alimento": "string",         // Nome do alimento (OBRIGATÓRIO)
  "porcao": "string",           // Porção descritiva (ex: "150g", "1 unidade média")
  "kcal": number,               // Calorias deste item (OBRIGATÓRIO)
  "macros": {                   // Macros deste item (OBRIGATÓRIO)
    "proteina_g": number,
    "carbo_g": number,
    "gordura_g": number
  },
  "substituicoes": [...]        // Array de opções de substituição (opcional)
}
```

---

## 📥 Dados Recebidos pela IA

A IA recebe o seguinte payload:

```json
{
  "questionnaireContext": {
    "idade": 28,
    "sexo": "Masculino",
    "altura": 175,
    "pesoAtual": 80,
    "objetivo": "Ganhar massa muscular",
    "frequenciaAtividade": "Sim, 3–4x por semana",
    "tipoAtividade": "Musculação",
    "horarioTreino": "Tarde",
    "rotinaDiaria": "Moderada (anda bastante, se movimenta no dia)",
    "quantidadeRefeicoes": "5 refeições",
    "preferenciaRefeicoes": "Um equilíbrio entre simples e variadas",
    "confortoPesar": "Sim, sem problemas",
    "tempoPreparacao": "Médio (10–30 min)",
    "preferenciaVariacao": "Um pouco de repetição é ok",
    "alimentosDoDiaADia": {
      "carboidratos": ["Arroz", "Batata", "Aveia"],
      "proteinas": ["Frango", "Ovos", "Whey protein"],
      "gorduras": ["Azeite", "Castanhas"],
      "frutas": ["Banana", "Maçã"]
    },
    "restricaoAlimentar": "Nenhuma",
    "outraRestricao": null,
    "alimentosEvita": "",
    "opcoesSubstituicao": "Sim, gosto de ter opções",
    "refeicoesLivres": "Talvez"
  },
  "nutritionalNeeds": {
    "totalDiaKcal": 2500,
    "macrosDia": {
      "proteina_g": 150,
      "carbo_g": 300,
      "gordura_g": 70
    },
    "tmb": 1800,
    "fatorAtividade": 1.55,
    "instrucao": "IMPORTANTE: Você DEVE criar uma dieta que resulte em EXATAMENTE 2500 kcal por dia, com 150g de proteína, 300g de carboidrato e 70g de gordura. O totalDiaKcal e macrosDia no JSON de resposta DEVEM corresponder a estes valores. Crie 5 refeições por dia conforme solicitado."
  }
}
```

---

## ✅ Validações que o Sistema Faz

1. ✅ **`totalDiaKcal`** deve existir e ser um número
2. ✅ **`macrosDia`** deve existir e ter `proteina_g`, `carbo_g`, `gordura_g`
3. ✅ **`refeicoes`** deve existir e ser um array
4. ✅ Cada refeição deve ter `nome`, `horario`, `totalRefeicaoKcal`, `itens`
5. ✅ Cada item deve ter `alimento`, `porcao`, `kcal`, `macros`
6. ✅ Os valores de `totalDiaKcal` e `macrosDia` devem corresponder aos enviados (com tolerância de 5%)

---

## 🔧 Ajustes Automáticos

O sistema faz ajustes automáticos se necessário:
- ✅ Corrige `totalDiaKcal` se estiver mais de 5% diferente do calculado
- ✅ Corrige macros se estiverem mais de 10% diferentes
- ✅ Ajusta distribuição de macros entre refeições
- ✅ Garante pelo menos 2 frutas no dia
- ✅ Garante vegetais/saladas em todas as refeições

---

## 📝 Exemplo Mínimo Válido

```json
{
  "dieta": {
    "totalDiaKcal": 2000,
    "macrosDia": {
      "proteina_g": 120,
      "carbo_g": 250,
      "gordura_g": 60
    },
    "refeicoes": [
      {
        "nome": "Café da Manhã",
        "horario": "07:00",
        "totalRefeicaoKcal": 500,
        "itens": [
          {
            "alimento": "Arroz branco cozido",
            "porcao": "100g",
            "kcal": 130,
            "macros": {
              "proteina_g": 3,
              "carbo_g": 30,
              "gordura_g": 0.3
            },
            "substituicoes": []
          }
        ]
      }
    ]
  }
}
```

---

## 🚨 Erros Comuns a Evitar

1. ❌ **Não retornar `totalDiaKcal`** - O sistema não conseguirá validar
2. ❌ **Não retornar `macrosDia`** - O sistema não conseguirá validar
3. ❌ **Valores diferentes dos enviados** - O sistema corrigirá automaticamente, mas é melhor retornar corretamente
4. ❌ **Faltar `macros` em algum item** - O sistema pode calcular, mas é melhor incluir
5. ❌ **Retornar estrutura aninhada incorreta** - Deve ser `{ dieta: {...} }` no nível raiz

---

## 📚 Referências

- **Arquivo de rota**: `server/routes/diet.js`
- **Validação**: Linhas 417-762
- **Ajustes automáticos**: Linhas 836-868
- **Salvamento**: Linhas 870-895

---

**Última atualização**: 19 de Dezembro de 2025


