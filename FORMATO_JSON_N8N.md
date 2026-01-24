# Formato JSON Esperado do N8N

## ✅ Formato Atual Recomendado

O app aceita o seguinte formato JSON do N8N:

```json
{
  "dieta": {
    "totalDiaKcal": 2844,
    "macrosDia": {
      "proteina_g": 213,
      "carbo_g": 284,
      "gordura_g": 95
    },
    "observacoesPlano": [
      "Texto da observação 1",
      "Texto da observação 2",
      "Texto da observação 3"
    ],
    "refeicoes": [
      {
        "nomeRefeicao": "Café da Manhã",
        "nome": "Café da Manhã",  // ACEITO (fallback)
        "totalRefeicaoKcal": 569,
        "macrosRefeicao": {
          "proteina_g": 43,
          "carbo_g": 57,
          "gordura_g": 19
        },
        "itens": [
          {
            "nome": "Pão Francês na Chapa",
            "quantidade_g": "80g",  // PODE SER STRING COM OU SEM 'g'
            "quantidade_g": 80,     // OU NÚMERO (será adicionado 'g')
            "kcal": 216,
            "proteina_g": 7,
            "carbo_g": 43,
            "gordura_g": 2,
            "substituicoes": [
              {
                "tipo": "Nostálgica",       // Categoria da substituição
                "opcao": "Nostálgica",      // ACEITO (fallback)
                "item": "Tapioca (2 unidades médias) com Manteiga",  // PREFERIDO
                "descricao": "Tapioca...",  // ACEITO (fallback)
                "alimento": "Tapioca...",   // ACEITO (fallback)
                "nome": "Tapioca...",       // ACEITO (fallback)
                "quantidade_g": "140g",     // OPCIONAL (porção)
                "kcal": 210,
                "proteina_g": 2,
                "carbo_g": 50,
                "gordura_g": 2
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## 📋 Campos Aceitos (Ordem de Prioridade)

### **Refeições**
- `nomeRefeicao` ✅ PREFERIDO
- `nome` (fallback)

### **Itens de Alimentos**
- **Nome do alimento:**
  - `nome` ✅ PREFERIDO
  - `alimento` (fallback)
  - `item` (fallback)
  - `food` (fallback)

- **Porção/Quantidade:**
  - `quantidade_g` ✅ PREFERIDO (ex: "80g" ou 80)
  - `porcao` (fallback)
  - `quantidade` (fallback)
  - `peso_g` + `unidade` (fallback, será combinado)

### **Substituições**
- **Categoria:**
  - `tipo` ✅ PREFERIDO (ex: "Nostálgica", "Clássica", "Prática")
  - `opcao` (fallback)

- **Nome da substituição:**
  - `item` ✅ PREFERIDO (texto completo da substituição)
  - `descricao` (fallback)
  - `alimento` (fallback)
  - `nome` (fallback)

- **Porção da substituição:**
  - `quantidade_g` ✅ PREFERIDO (ex: "140g" ou 140)
  - `porcaoEquivalente` (fallback)
  - `porcao` (fallback)
  - `peso_g` + `unidade` (fallback)

### **Observações do Plano**
- **Array de strings** ✅ PREFERIDO:
  ```json
  "observacoesPlano": [
    "Texto 1",
    "Texto 2"
  ]
  ```

- **Objeto** (será convertido):
  ```json
  "observacoesPlano": {
    "refeicaoLivre": "Texto...",
    "hidratacao": "Texto...",
    "saidaDaDieta": "Texto..."
  }
  ```

## 🔄 Conversões Automáticas

O backend faz as seguintes conversões:

1. **Porções sem unidade**: `"50"` → `"50g"`
2. **Observações em objeto**: Convertido para texto formatado
3. **Nomes de campos diferentes**: Normalizado para formato padrão
4. **Macros soltos**: Agrupados em objeto `macros`

## ⚠️ Campos Obrigatórios

- `dieta.totalDiaKcal`
- `dieta.macrosDia.proteina_g`
- `dieta.macrosDia.carbo_g`
- `dieta.macrosDia.gordura_g`
- `dieta.refeicoes[]` (array)
- `refeicao.nomeRefeicao` ou `refeicao.nome`
- `refeicao.totalRefeicaoKcal`
- `refeicao.itens[]` (array)
- `item.nome`
- `item.quantidade_g` ou `item.porcao`
- `item.kcal`

## 📌 Exemplo Mínimo Válido

```json
{
  "dieta": {
    "totalDiaKcal": 2000,
    "macrosDia": {
      "proteina_g": 150,
      "carbo_g": 200,
      "gordura_g": 67
    },
    "observacoesPlano": ["Beba 2L de água por dia"],
    "refeicoes": [
      {
        "nomeRefeicao": "Café da Manhã",
        "totalRefeicaoKcal": 500,
        "itens": [
          {
            "nome": "Pão Integral",
            "quantidade_g": "50g",
            "kcal": 150,
            "proteina_g": 6,
            "carbo_g": 25,
            "gordura_g": 2,
            "substituicoes": []
          }
        ]
      }
    ]
  }
}
```

## 🎯 Recomendação

Para garantir compatibilidade total, use os campos **PREFERIDOS** marcados com ✅. O app tem fallbacks para formatos antigos, mas os campos preferidos garantem melhor compatibilidade futura.
