# Contrato de Dados do Questionário

Este documento descreve o contrato de dados do questionário, incluindo campos obrigatórios, opcionais, condicionais, derivados e legados.

## Visão Geral

Os dados do questionário são normalizados antes de serem enviados para os agentes n8n através da função `normalizeQuestionnaireData()` em `server/utils/questionnaireNormalizer.js`. Esta normalização garante:

- Strings vazias são convertidas para `null`
- Campos booleanos explícitos são derivados
- Duplicidade semântica entre campos novos e legados é resolvida
- Estrutura limpa (`clean`) contém apenas campos novos e preenchidos

## Estrutura de Dados Normalizados

### Campos Originais Normalizados

Todos os campos originais são mantidos, mas com normalizações aplicadas:

- Strings vazias (`""`, `" "`) → `null`
- Arrays vazios → mantidos como `[]`
- Objetos legados com arrays vazios → mantidos com flag `_legacy`

### Campos Derivados (`derived`)

Campos booleanos explícitos derivados dos dados:

- **`derived.treinaAtualmente`**: `boolean`
  - `true` se `frequenciaAtividade !== "Não pratico atualmente"` e `frequenciaAtividade !== "Não pratico"`
  - `false` caso contrário

- **`derived.temRestricaoClinica`**: `boolean`
  - `true` se `problemasSaude === "Sim"`
  - `false` caso contrário

- **`derived.temLimitacaoFisica`**: `boolean`
  - `true` se `limitacoesFisicas === "Sim"`
  - `false` caso contrário

- **`derived.temRestricaoMedicaExercicio`**: `boolean`
  - `true` se `restricoesMedicasExercicio === "Sim"`
  - `false` caso contrário

### Estrutura Clean (`clean`)

Contém apenas campos novos e preenchidos (sem campos legados duplicados, sem valores vazios).

### Metadados Legados (`_legacy`)

Informações sobre campos legados:

- **`_legacy.alimentosDoDiaADia`**: `true` - Sempre vem vazio, não usado no novo formulário
- **`_legacy.rotinaTreinoDetalhada`**: `"fallback"` - Usado apenas como fallback se `preferenciaDificuldadeTreino` estiver vazio
- **`_legacy.outraAtividade`**: `"fallback"` - Usado apenas como fallback se `tipoAtividade` estiver vazio

## Campos do Questionário

### Bloco 1: Dados Básicos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `idade` | `number` | Sim | Idade em anos (1-150) |
| `sexo` | `string \| null` | Sim* | "Masculino", "Feminino" ou `null` (se "Prefiro não informar") |
| `altura` | `number` | Sim | Altura em centímetros (50-250) |
| `pesoAtual` | `number` | Sim | Peso em quilos (20-300) |
| `objetivo` | `string` | Sim | "Emagrecer", "Manter o peso", "Ganhar massa muscular", "Ganhar peso de forma geral" |

### Sentimentos e Expectativas

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `sentimentosCorpo` | `string \| null` | Não | Como se sente em relação ao corpo |
| `expectativaSucesso` | `string \| null` | Não | O que faria o plano valer a pena em 30 dias |

### Rotina e Sono

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `rotinaDiaria` | `string` | Sim | Descrição da rotina diária (texto livre) |
| `sono` | `string` | Sim | "Durmo bem", "Durmo mal e acordo cansado", "Varia muito" |

### Bloco 2: Atividade Física

| Campo | Tipo | Obrigatório | Condicional | Descrição |
|-------|------|-------------|-------------|-----------|
| `frequenciaAtividade` | `string` | Sim | - | "Não pratico atualmente", "1–2x por semana", "3–4x por semana", "5x ou mais por semana" |
| `barreirasTreino` | `string \| null` | Não | Se `frequenciaAtividade === "Não pratico atualmente"` | O que impede de treinar |
| `tipoAtividade` | `string \| null` | Não | Se `frequenciaAtividade !== "Não pratico atualmente"` | Tipo de atividade praticada |
| `relacaoEmocionalTreino` | `string \| null` | Não | Se pratica atividade | "Gosto de treinar e me sinto bem", "Treino mais por obrigação", "Treino, mas sempre acabo parando" |
| `preferenciaDificuldadeTreino` | `string \| null` | Não | Se pratica atividade | Preferência ou dificuldade no treino (texto livre) |
| `horarioTreino` | `string` | Sim | - | "Manhã", "Tarde", "Noite", "Varia muito" |

**Regras Condicionais:**
- Se `frequenciaAtividade === "Não pratico atualmente"`:
  - `barreirasTreino` é preenchido
  - `tipoAtividade`, `relacaoEmocionalTreino`, `preferenciaDificuldadeTreino` ficam vazios (`null`)
- Se `frequenciaAtividade !== "Não pratico atualmente"`:
  - `barreirasTreino` fica vazio (`null`)
  - `tipoAtividade`, `relacaoEmocionalTreino`, `preferenciaDificuldadeTreino` são preenchidos

### Bloco 3: Estrutura da Dieta

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `quantidadeRefeicoes` | `string` | Sim | "3", "4", "5", "Mais de 5" |
| `preferenciaRefeicoes` | `string` | Sim | "Mais simples", "Um equilíbrio", "Mais completas e variadas" |

### Bloco 4: Alimentação

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `alimentosGosta` | `string \| null` | Não | Alimentos favoritos (texto livre) |
| `alimentosEvita` | `string \| null` | Não | Alimentos que evita (texto livre) |
| `tempoPreparacao` | `string` | Sim | "Até 10 minutos", "10–30 minutos", "Tenho tempo e gosto de cozinhar" |
| `confortoPesar` | `string` | Sim | "Sim", "Às vezes", "Prefiro medidas caseiras" |
| `preferenciaVariacao` | `string` | Sim | "Prefiro repetir", "Um pouco de repetição é ok", "Prefiro muita variedade" |
| `alimentacaoFimSemana` | `string \| null` | Não | "Parecida com a semana", "Um pouco mais solta", "Sai totalmente do controle" |

### Bloco 5: Alimentos do Dia a Dia (Legado)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `alimentosDoDiaADia` | `object` | Não | Sempre vem com arrays vazios: `{ carboidratos: [], proteinas: [], gorduras: [], frutas: [] }` |

**Nota:** Este campo é legado e não é usado no novo formulário. Sempre vem vazio.

### Bloco 6: Restrições

| Campo | Tipo | Obrigatório | Condicional | Descrição |
|-------|------|-------------|-------------|-----------|
| `restricaoAlimentar` | `string` | Sim | - | "Nenhuma", "Intolerância à lactose", "Intolerância ao glúten", "Outra" |
| `outraRestricao` | `string \| null` | Não | Se `restricaoAlimentar === "Outra"` | Detalhes da restrição (texto livre) |

### Bloco 7: Flexibilidade Real

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `opcoesSubstituicao` | `string` | Sim | "Sim, gosto de opções", "Algumas opções já são suficientes", "Prefiro algo mais fixo" |
| `refeicoesLivres` | `string` | Sim | "Sim", "Talvez", "Prefiro seguir o plano à risca" |

### Bloco 8: Saúde e Limitações

| Campo | Tipo | Obrigatório | Condicional | Descrição |
|-------|------|-------------|-------------|-----------|
| `problemasSaude` | `string` | Sim | - | "Não", "Sim" |
| `quaisProblemasSaude` | `string \| null` | Não | Se `problemasSaude === "Sim"` | Detalhes dos problemas de saúde (texto livre) |
| `usoMedicacao` | `string` | Sim | - | "Não", "Sim" |
| `quaisMedicamentos` | `string \| null` | Não | Se `usoMedicacao === "Sim"` | Detalhes dos medicamentos (texto livre) |
| `limitacoesFisicas` | `string` | Sim | - | "Não", "Sim" |
| `detalhesLimitacao` | `string \| null` | Não | Se `limitacoesFisicas === "Sim"` | Detalhes da limitação física (texto livre) |
| `restricoesMedicasExercicio` | `string` | Sim | - | "Não", "Sim" |
| `movimentosEvitar` | `string \| null` | Não | Se `restricoesMedicasExercicio === "Sim"` | Movimentos a evitar (texto livre) |
| `receiosSaude` | `string \| null` | Não | - | Receios relacionados à saúde (texto livre) |

## Resolução de Duplicidade Semântica

Alguns campos têm versões novas e legadas. A normalização resolve essa duplicidade:

### Regra Geral

**Prioridade:** Campos novos > Campos legados

- Se campo novo preenchido → usar campo novo
- Se campo novo vazio e legado preenchido → usar legado como fallback

### Campos Específicos

1. **Atividade:**
   - `tipoAtividade` (novo) > `outraAtividade` (legado)
   - Se `tipoAtividade` estiver vazio e `outraAtividade` preenchido, `tipoAtividade` recebe o valor de `outraAtividade`

2. **Rotina de Treino:**
   - `preferenciaDificuldadeTreino` (novo) > `rotinaTreinoDetalhada` (legado)
   - Se `preferenciaDificuldadeTreino` estiver vazio e `rotinaTreinoDetalhada` preenchido, `preferenciaDificuldadeTreino` recebe o valor de `rotinaTreinoDetalhada`

## Normalizações Aplicadas

### Strings Vazias

- `""` → `null`
- `" "` (apenas espaços) → `null`
- Strings com conteúdo são mantidas (após trim)

### Arrays e Objetos

- Arrays vazios → mantidos como `[]`
- Objetos legados com arrays vazios → mantidos com flag `_legacy`

### Campos Opcionais

- Campos opcionais não preenchidos → `null` (não `""`)

## Estrutura do Payload Enviado para N8N

### Para Geração de Dieta (`/api/diet/generate`)

```javascript
{
  questionnaireContext: {
    // Estrutura clean (campos novos e preenchidos)
    ...normalized.clean,
    // Campos derivados (booleanos explícitos)
    derived: normalized.derived,
    // Compatibilidade
    refeicoesDia: number
  },
  nutritionalNeeds: {
    totalDiaKcal: number,
    macrosDia: {
      proteina_g: number,
      carbo_g: number,
      gordura_g: number
    },
    // ...
  }
}
```

### Para Geração de Treino (`/api/workout/generate`)

```javascript
{
  userId: string,
  userName: string,
  // Dados básicos
  idade: number,
  sexo: string | null,
  altura: number,
  pesoAtual: number,
  objetivo: string,
  // Atividade física
  frequenciaAtividade: string,
  tipoAtividade: string | null,
  horarioTreino: string,
  rotinaDiaria: string,
  // Campos derivados
  derived: {
    treinaAtualmente: boolean,
    temLimitacaoFisica: boolean,
    temRestricaoMedicaExercicio: boolean
  },
  // Limitações e restrições
  limitacoesFisicas: string,
  detalhesLimitacao: string | null,
  restricoesMedicasExercicio: string,
  movimentosEvitar: string | null,
  // Preferências
  relacaoEmocionalTreino: string | null,
  preferenciaDificuldadeTreino: string | null,
  barreirasTreino: string | null
}
```

### Para Chat (`/api/chat/message`)

```javascript
{
  message: {
    chat: { id: string },
    text: string
  },
  userContext: {
    questionnaire: {
      // Dados básicos
      idade: number,
      sexo: string | null,
      altura: number,
      pesoAtual: number,
      objetivo: string,
      // Rotina e atividade
      rotinaDiaria: string,
      frequenciaAtividade: string,
      tipoAtividade: string | null,
      horarioTreino: string,
      // Alimentação
      quantidadeRefeicoes: string,
      preferenciaRefeicoes: string,
      alimentosGosta: string | null,
      alimentosEvita: string | null,
      restricaoAlimentar: string,
      outraRestricao: string | null,
      // Campos derivados
      derived: {
        treinaAtualmente: boolean,
        temRestricaoClinica: boolean,
        temLimitacaoFisica: boolean,
        temRestricaoMedicaExercicio: boolean
      }
    },
    diet: object | null
  }
}
```

## Instruções para Agentes N8N

### Tratamento de Campos Vazios

- **Trate `null` como "não informado"** - não tente inferir valores
- **Não trate `""` (string vazia) como informado** - após normalização, strings vazias são `null`
- **Se campo essencial estiver `null`**, faça suposições conservadoras ou solicite confirmação (se estiver no modo chat)

### Priorização de Campos

- **Priorize campos não-legados** - use campos novos em vez de legados
- **Use campos derivados** - `derived.treinaAtualmente` é mais confiável que inferir de `frequenciaAtividade`

### Campos Condicionais

- **Respeite as regras condicionais** - se `frequenciaAtividade === "Não pratico atualmente"`, não espere dados de `tipoAtividade`
- **Use campos derivados** - `derived.treinaAtualmente` indica claramente se o usuário treina

## Exemplo de Dados Normalizados

```javascript
{
  // Campos originais normalizados
  idade: 32,
  sexo: "Feminino",
  altura: 165.0,
  pesoAtual: 68.5,
  objetivo: "Emagrecer",
  sentimentosCorpo: "Me sinto desconfortável...",
  expectativaSucesso: "Ver uma redução de 5kg...",
  rotinaDiaria: "Trabalho sentado o dia todo...",
  sono: "Durmo bem",
  frequenciaAtividade: "3–4x por semana",
  barreirasTreino: null, // Vazio porque pratica atividade
  tipoAtividade: "Musculação + cardio",
  relacaoEmocionalTreino: "Gosto de treinar e me sinto bem",
  preferenciaDificuldadeTreino: "Gosto muito de exercícios de perna...",
  horarioTreino: "Noite",
  // ... outros campos ...
  
  // Campos derivados
  derived: {
    treinaAtualmente: true,
    temRestricaoClinica: true,
    temLimitacaoFisica: true,
    temRestricaoMedicaExercicio: true
  },
  
  // Estrutura clean (apenas campos novos e preenchidos)
  clean: {
    idade: 32,
    sexo: "Feminino",
    altura: 165.0,
    pesoAtual: 68.5,
    objetivo: "Emagrecer",
    sentimentosCorpo: "Me sinto desconfortável...",
    expectativaSucesso: "Ver uma redução de 5kg...",
    rotinaDiaria: "Trabalho sentado o dia todo...",
    sono: "Durmo bem",
    frequenciaAtividade: "3–4x por semana",
    tipoAtividade: "Musculação + cardio",
    relacaoEmocionalTreino: "Gosto de treinar e me sinto bem",
    preferenciaDificuldadeTreino: "Gosto muito de exercícios de perna...",
    horarioTreino: "Noite",
    // ... outros campos preenchidos ...
  },
  
  // Metadados legados
  _legacy: {
    alimentosDoDiaADia: true,
    rotinaTreinoDetalhada: "fallback",
    outraAtividade: "fallback"
  }
}
```

## Changelog

### Versão 1.0 (2024-01-XX)
- Implementação inicial da normalização
- Campos derivados booleanos explícitos
- Resolução de duplicidade semântica
- Documentação do contrato de dados
