# Guia de Migração do Backend - Novo Questionário

## 📋 Resumo da Mudança

O questionário foi completamente reestruturado de **4 etapas** para **7 blocos**, com foco em dados mais relevantes para geração de dietas personalizadas.

---

## 🗄️ 1. MIGRAÇÃO DO BANCO DE DADOS

### Schema Antigo (A REMOVER)
```sql
-- Campos antigos do Questionnaire
nivelAtividade VARCHAR
refeicoesDia INT
restricoes JSON
outraRestricao VARCHAR
alimentosNaoGosta TEXT
preferenciaAlimentacao VARCHAR
costumaCozinhar VARCHAR
observacoes TEXT
```

### Novo Schema (A CRIAR)

```sql
-- Tabela: questionnaires (ou nome equivalente)
ALTER TABLE questionnaires DROP COLUMN IF EXISTS nivelAtividade;
ALTER TABLE questionnaires DROP COLUMN IF EXISTS refeicoesDia;
ALTER TABLE questionnaires DROP COLUMN IF EXISTS restricoes;
ALTER TABLE questionnaires DROP COLUMN IF EXISTS outraRestricao;
ALTER TABLE questionnaires DROP COLUMN IF EXISTS alimentosNaoGosta;
ALTER TABLE questionnaires DROP COLUMN IF EXISTS preferenciaAlimentacao;
ALTER TABLE questionnaires DROP COLUMN IF EXISTS costumaCozinhar;
ALTER TABLE questionnaires DROP COLUMN IF EXISTS observacoes;

-- Adicionar novos campos
ALTER TABLE questionnaires ADD COLUMN frequenciaAtividade VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN tipoAtividade VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN horarioTreino VARCHAR(50);
ALTER TABLE questionnaires ADD COLUMN rotinaDiaria VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN quantidadeRefeicoes VARCHAR(50);
ALTER TABLE questionnaires ADD COLUMN preferenciaRefeicoes VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN confortoPesar VARCHAR(50);
ALTER TABLE questionnaires ADD COLUMN tempoPreparacao VARCHAR(50);
ALTER TABLE questionnaires ADD COLUMN preferenciaVariacao VARCHAR(50);
ALTER TABLE questionnaires ADD COLUMN alimentosDoDiaADia JSON;
ALTER TABLE questionnaires ADD COLUMN restricaoAlimentar VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN outraRestricao VARCHAR(200);
ALTER TABLE questionnaires ADD COLUMN alimentosEvita TEXT;
ALTER TABLE questionnaires ADD COLUMN opcoesSubstituicao VARCHAR(100);
ALTER TABLE questionnaires ADD COLUMN refeicoesLivres VARCHAR(50);
```

### Script de Migração Completo

```sql
-- ATENÇÃO: Este script DELETA os dados antigos!
-- Execute apenas se tiver certeza que pode perder os dados atuais

-- Opção 1: Limpar tabela e recriar estrutura
TRUNCATE TABLE questionnaires;

-- Remover colunas antigas
ALTER TABLE questionnaires 
  DROP COLUMN IF EXISTS nivelAtividade,
  DROP COLUMN IF EXISTS refeicoesDia,
  DROP COLUMN IF EXISTS restricoes,
  DROP COLUMN IF EXISTS outraRestricao,
  DROP COLUMN IF EXISTS alimentosNaoGosta,
  DROP COLUMN IF EXISTS preferenciaAlimentacao,
  DROP COLUMN IF EXISTS costumaCozinhar,
  DROP COLUMN IF EXISTS observacoes;

-- Adicionar novas colunas
ALTER TABLE questionnaires 
  ADD COLUMN frequenciaAtividade VARCHAR(100) NOT NULL,
  ADD COLUMN tipoAtividade VARCHAR(100) NOT NULL,
  ADD COLUMN horarioTreino VARCHAR(50) NOT NULL,
  ADD COLUMN rotinaDiaria VARCHAR(100) NOT NULL,
  ADD COLUMN quantidadeRefeicoes VARCHAR(50) NOT NULL,
  ADD COLUMN preferenciaRefeicoes VARCHAR(100) NOT NULL,
  ADD COLUMN confortoPesar VARCHAR(50) NOT NULL,
  ADD COLUMN tempoPreparacao VARCHAR(50) NOT NULL,
  ADD COLUMN preferenciaVariacao VARCHAR(50) NOT NULL,
  ADD COLUMN alimentosDoDiaADia JSON,
  ADD COLUMN restricaoAlimentar VARCHAR(100) NOT NULL,
  ADD COLUMN outraRestricao VARCHAR(200),
  ADD COLUMN alimentosEvita TEXT,
  ADD COLUMN opcoesSubstituicao VARCHAR(100) NOT NULL,
  ADD COLUMN refeicoesLivres VARCHAR(50) NOT NULL;
```

---

## 🔧 2. AJUSTES NO BACKEND (Node.js/Express)

### A) Atualizar Model/Schema

**Arquivo**: `models/Questionnaire.js` (ou equivalente)

```javascript
// Novo schema do questionário
const questionnaireSchema = {
  userId: { type: Number, required: true },
  
  // Bloco 1: Dados Básicos
  idade: { type: Number, required: true, min: 1, max: 150 },
  sexo: { type: String, required: true, enum: ['Feminino', 'Masculino'] },
  altura: { type: Number, required: true, min: 50, max: 250 },
  pesoAtual: { type: Number, required: true, min: 20, max: 300 },
  objetivo: { 
    type: String, 
    required: true,
    enum: ['Emagrecer', 'Manter o peso', 'Ganhar massa muscular', 'Ganhar peso de forma geral']
  },
  
  // Bloco 2: Rotina e Atividade
  frequenciaAtividade: {
    type: String,
    required: true,
    enum: [
      'Não pratico',
      'Sim, 1–2x por semana',
      'Sim, 3–4x por semana',
      'Sim, 5x ou mais por semana'
    ]
  },
  tipoAtividade: {
    type: String,
    required: true,
    enum: ['Musculação', 'Cardio (caminhada, corrida, bike)', 'Ambos', 'Outro']
  },
  horarioTreino: {
    type: String,
    required: true,
    enum: ['Manhã', 'Tarde', 'Noite', 'Varia muito']
  },
  rotinaDiaria: {
    type: String,
    required: true,
    enum: [
      'Sedentária (trabalho sentado, pouco movimento)',
      'Moderada (anda bastante, se movimenta no dia)',
      'Ativa (trabalho físico ou muito movimento)'
    ]
  },
  
  // Bloco 3: Estrutura da Dieta
  quantidadeRefeicoes: {
    type: String,
    required: true,
    enum: ['3 refeições', '4 refeições', '5 refeições', 'Mais de 5']
  },
  preferenciaRefeicoes: {
    type: String,
    required: true,
    enum: [
      'Mais simples, com poucos alimentos',
      'Um equilíbrio entre simples e variadas',
      'Mais completas e variadas'
    ]
  },
  
  // Bloco 4: Complexidade e Adesão
  confortoPesar: {
    type: String,
    required: true,
    enum: ['Sim, sem problemas', 'Às vezes', 'Prefiro medidas caseiras']
  },
  tempoPreparacao: {
    type: String,
    required: true,
    enum: [
      'Muito pouco (até 10 min)',
      'Médio (10–30 min)',
      'Tenho tempo e gosto de cozinhar'
    ]
  },
  preferenciaVariacao: {
    type: String,
    required: true,
    enum: ['Prefiro repetir', 'Um pouco de repetição é ok', 'Prefiro variedade']
  },
  
  // Bloco 5: Alimentos do Dia a Dia (opcional)
  alimentosDoDiaADia: {
    type: Object,
    default: {
      carboidratos: [],
      proteinas: [],
      gorduras: [],
      frutas: []
    }
  },
  
  // Bloco 6: Restrições
  restricaoAlimentar: {
    type: String,
    required: true,
    enum: ['Nenhuma', 'Intolerância à lactose', 'Glúten', 'Outra']
  },
  outraRestricao: {
    type: String,
    default: ''
  },
  alimentosEvita: {
    type: String,
    default: ''
  },
  
  // Bloco 7: Flexibilidade Real
  opcoesSubstituicao: {
    type: String,
    required: true,
    enum: [
      'Sim, gosto de ter opções',
      'Algumas opções já são suficientes',
      'Prefiro algo mais fixo'
    ]
  },
  refeicoesLivres: {
    type: String,
    required: true,
    enum: ['Sim', 'Talvez', 'Não']
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### B) Atualizar Controller/Route

**Arquivo**: `controllers/questionnaireController.js` (ou equivalente)

```javascript
// POST /api/questionnaire
async function createQuestionnaire(req, res) {
  try {
    const userId = req.user.id // do middleware de autenticação
    
    // Validação
    const {
      // Bloco 1
      idade, sexo, altura, pesoAtual, objetivo,
      // Bloco 2
      frequenciaAtividade, tipoAtividade, horarioTreino, rotinaDiaria,
      // Bloco 3
      quantidadeRefeicoes, preferenciaRefeicoes,
      // Bloco 4
      confortoPesar, tempoPreparacao, preferenciaVariacao,
      // Bloco 5
      alimentosDoDiaADia,
      // Bloco 6
      restricaoAlimentar, outraRestricao, alimentosEvita,
      // Bloco 7
      opcoesSubstituicao, refeicoesLivres
    } = req.body

    // Validar campos obrigatórios
    if (!idade || !sexo || !altura || !pesoAtual || !objetivo) {
      return res.status(400).json({ error: 'Dados básicos incompletos' })
    }

    if (!frequenciaAtividade || !tipoAtividade || !horarioTreino || !rotinaDiaria) {
      return res.status(400).json({ error: 'Dados de rotina incompletos' })
    }

    if (!quantidadeRefeicoes || !preferenciaRefeicoes) {
      return res.status(400).json({ error: 'Dados de estrutura da dieta incompletos' })
    }

    if (!confortoPesar || !tempoPreparacao || !preferenciaVariacao) {
      return res.status(400).json({ error: 'Dados de complexidade incompletos' })
    }

    if (!restricaoAlimentar) {
      return res.status(400).json({ error: 'Dados de restrições incompletos' })
    }

    if (restricaoAlimentar === 'Outra' && !outraRestricao?.trim()) {
      return res.status(400).json({ error: 'Por favor, especifique a restrição alimentar' })
    }

    if (!opcoesSubstituicao || !refeicoesLivres) {
      return res.status(400).json({ error: 'Dados de flexibilidade incompletos' })
    }

    // Deletar questionário antigo se existir
    await Questionnaire.deleteMany({ userId })

    // Criar novo questionário
    const questionnaire = await Questionnaire.create({
      userId,
      idade: parseInt(idade),
      sexo,
      altura: parseFloat(altura),
      pesoAtual: parseFloat(pesoAtual),
      objetivo,
      frequenciaAtividade,
      tipoAtividade,
      horarioTreino,
      rotinaDiaria,
      quantidadeRefeicoes,
      preferenciaRefeicoes,
      confortoPesar,
      tempoPreparacao,
      preferenciaVariacao,
      alimentosDoDiaADia: alimentosDoDiaADia || {
        carboidratos: [],
        proteinas: [],
        gorduras: [],
        frutas: []
      },
      restricaoAlimentar,
      outraRestricao: restricaoAlimentar === 'Outra' ? outraRestricao : '',
      alimentosEvita: alimentosEvita || '',
      opcoesSubstituicao,
      refeicoesLivres
    })

    res.status(201).json({
      message: 'Questionário salvo com sucesso',
      questionnaire
    })

  } catch (error) {
    console.error('Erro ao salvar questionário:', error)
    res.status(500).json({ error: 'Erro ao salvar questionário' })
  }
}
```

---

## 🎯 3. IMPACTO NA GERAÇÃO DE DIETAS

### Mapeamento dos Dados para Lógica de Dieta

```javascript
// Exemplo de como usar os novos dados para gerar dietas

function calcularMacros(questionnaire) {
  const { idade, sexo, altura, pesoAtual, objetivo, frequenciaAtividade, rotinaDiaria } = questionnaire
  
  // 1. Calcular TMB (Taxa Metabólica Basal)
  let tmb
  if (sexo === 'Masculino') {
    tmb = 10 * pesoAtual + 6.25 * altura - 5 * idade + 5
  } else {
    tmb = 10 * pesoAtual + 6.25 * altura - 5 * idade - 161
  }
  
  // 2. Ajustar por nível de atividade
  let fatorAtividade = 1.2 // Sedentário
  if (frequenciaAtividade.includes('5x ou mais')) fatorAtividade = 1.725
  else if (frequenciaAtividade.includes('3–4x')) fatorAtividade = 1.55
  else if (frequenciaAtividade.includes('1–2x')) fatorAtividade = 1.375
  
  if (rotinaDiaria.includes('Ativa')) fatorAtividade += 0.1
  else if (rotinaDiaria.includes('Moderada')) fatorAtividade += 0.05
  
  const tdee = tmb * fatorAtividade
  
  // 3. Ajustar por objetivo
  let calorias = tdee
  if (objetivo === 'Emagrecer') calorias = tdee * 0.80
  else if (objetivo === 'Ganhar massa muscular') calorias = tdee * 1.10
  else if (objetivo === 'Ganhar peso de forma geral') calorias = tdee * 1.15
  
  return { calorias, tmb, tdee }
}

function definirQuantidadeAlimentos(questionnaire) {
  const { quantidadeRefeicoes, preferenciaRefeicoes } = questionnaire
  
  // Número de refeições
  let numRefeicoes = 3
  if (quantidadeRefeicoes.includes('4')) numRefeicoes = 4
  else if (quantidadeRefeicoes.includes('5')) numRefeicoes = 5
  else if (quantidadeRefeicoes.includes('Mais')) numRefeicoes = 6
  
  // Quantidade de alimentos por refeição
  let alimentosPorRefeicao = 3
  if (preferenciaRefeicoes.includes('equilíbrio')) alimentosPorRefeicao = 4
  else if (preferenciaRefeicoes.includes('completas')) alimentosPorRefeicao = 5
  
  return { numRefeicoes, alimentosPorRefeicao }
}

function filtrarAlimentos(questionnaire, todosAlimentos) {
  const { alimentosDoDiaADia } = questionnaire
  
  // Se marcou alimentos específicos, priorizar esses
  if (alimentosDoDiaADia) {
    const preferidos = [
      ...alimentosDoDiaADia.carboidratos,
      ...alimentosDoDiaADia.proteinas,
      ...alimentosDoDiaADia.gorduras,
      ...alimentosDoDiaADia.frutas
    ]
    
    if (preferidos.length > 0) {
      return todosAlimentos.filter(alimento => 
        preferidos.some(pref => 
          alimento.descricao.toLowerCase().includes(pref.toLowerCase())
        )
      )
    }
  }
  
  return todosAlimentos
}
```

---

## ✅ 4. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] **Backup do banco de dados atual**
- [ ] Executar script de migração SQL
- [ ] Atualizar model/schema do Questionnaire
- [ ] Atualizar controller/routes
- [ ] Atualizar validações (Joi, Zod, etc)
- [ ] Atualizar lógica de geração de dietas
- [ ] Testar criação de questionário via API
- [ ] Testar geração de dieta com novos dados
- [ ] Atualizar documentação da API
- [ ] Deploy

---

## 🔄 5. EXEMPLO DE PAYLOAD (Frontend → Backend)

```json
{
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
  "restricaoAlimentar": "Intolerância à lactose",
  "outraRestricao": "",
  "alimentosEvita": "cebola crua, pimentão",
  "opcoesSubstituicao": "Sim, gosto de ter opções",
  "refeicoesLivres": "Talvez"
}
```

---

## 📞 Suporte

Se houver dúvidas durante a implementação, consulte este guia ou entre em contato com o time de frontend.

**Última atualização**: $(date)


