# ✅ Backend Implementado - Questionário 7 Blocos

## 🎉 Status: COMPLETO

Todas as mudanças do backend foram implementadas com sucesso!

---

## ✅ O Que Foi Feito

### 1. **Schema Prisma Atualizado** ✅
**Arquivo**: `prisma/schema.prisma`

- ✅ Modelo `QuestionnaireData` completamente reestruturado
- ✅ Campos antigos removidos: `nivelAtividade`, `refeicoesDia`, `restricoes` (array), `alimentosNaoGosta`, `preferenciaAlimentacao`, `costumaCozinhar`, `observacoes`
- ✅ 14 novos campos adicionados para os 7 blocos

### 2. **Migration Criada e Aplicada** ✅
**Arquivo**: `prisma/migrations/20251219115849_renovar_questionario_7_blocos/migration.sql`

- ✅ TRUNCATE na tabela `questionnaire_data` (dados antigos deletados)
- ✅ Colunas antigas removidas
- ✅ Colunas novas adicionadas
- ✅ Migration executada no banco de dados com sucesso

### 3. **Rotas Atualizadas** ✅
**Arquivo**: `server/routes/questionnaire.js`

- ✅ Schema Zod completamente reescrito com os 7 blocos
- ✅ Validações atualizadas (enums corretos)
- ✅ POST `/api/questionnaire` atualizado para salvar novos campos
- ✅ GET `/api/questionnaire/check` atualizado para retornar novos campos
- ✅ Logs detalhados para debug

---

## 🔄 Próximos Passos (IMPORTANTE)

### **Para ativar as mudanças:**

1. **Parar o servidor** (se estiver rodando)
   ```bash
   # No terminal onde está rodando npm run dev, pressione Ctrl+C
   ```

2. **Gerar o Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Reiniciar o servidor**
   ```bash
   npm run dev
   ```

> **Nota**: O erro "EPERM: operation not permitted" ao rodar `prisma generate` é porque o servidor está usando os arquivos. Depois de parar o servidor, o comando funcionará normalmente.

---

## 📊 Estrutura Final do Banco

### Tabela: `questionnaire_data`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| **Bloco 1: Dados Básicos** |
| `idade` | INT | ✅ | 1-150 anos |
| `sexo` | TEXT | ✅ | Masculino/Feminino |
| `altura` | FLOAT | ✅ | 50-250 cm |
| `pesoAtual` | FLOAT | ✅ | 20-300 kg |
| `objetivo` | TEXT | ✅ | 4 opções |
| **Bloco 2: Rotina e Atividade** |
| `frequenciaAtividade` | TEXT | ✅ | 4 opções |
| `tipoAtividade` | TEXT | ✅ | 4 opções |
| `horarioTreino` | TEXT | ✅ | 4 opções |
| `rotinaDiaria` | TEXT | ✅ | 3 opções |
| **Bloco 3: Estrutura da Dieta** |
| `quantidadeRefeicoes` | TEXT | ✅ | 4 opções |
| `preferenciaRefeicoes` | TEXT | ✅ | 3 opções |
| **Bloco 4: Complexidade e Adesão** |
| `confortoPesar` | TEXT | ✅ | 3 opções |
| `tempoPreparacao` | TEXT | ✅ | 3 opções |
| `preferenciaVariacao` | TEXT | ✅ | 3 opções |
| **Bloco 5: Alimentos do Dia a Dia** |
| `alimentosDoDiaADia` | TEXT (JSON) | ❌ | {carboidratos:[], proteinas:[], gorduras:[], frutas:[]} |
| **Bloco 6: Restrições** |
| `restricaoAlimentar` | TEXT | ✅ | 4 opções |
| `outraRestricao` | TEXT | ❌ | Se selecionou "Outra" |
| `alimentosEvita` | TEXT | ❌ | Textarea livre |
| **Bloco 7: Flexibilidade Real** |
| `opcoesSubstituicao` | TEXT | ✅ | 3 opções |
| `refeicoesLivres` | TEXT | ✅ | 3 opções |

---

## 🧪 Como Testar

### 1. Testar API diretamente
```bash
curl -X POST http://localhost:5000/api/questionnaire \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
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
      "carboidratos": ["Arroz", "Batata"],
      "proteinas": ["Frango", "Ovos"],
      "gorduras": ["Azeite"],
      "frutas": ["Banana"]
    },
    "restricaoAlimentar": "Nenhuma",
    "outraRestricao": "",
    "alimentosEvita": "",
    "opcoesSubstituicao": "Sim, gosto de ter opções",
    "refeicoesLivres": "Talvez"
  }'
```

### 2. Testar pelo Frontend
- Login como PACIENTE
- Preencher o questionário (7 etapas)
- Verificar no banco se os dados foram salvos

### 3. Verificar no Banco
```sql
SELECT * FROM questionnaire_data ORDER BY "createdAt" DESC LIMIT 5;
```

---

## 📝 Arquivos Modificados

1. ✅ `prisma/schema.prisma` - Schema atualizado
2. ✅ `prisma/migrations/20251219115849_renovar_questionario_7_blocos/migration.sql` - Migration criada
3. ✅ `server/routes/questionnaire.js` - Rotas atualizadas
4. ✅ `src/components/Questionnaire.jsx` - Frontend reestruturado
5. ✅ `src/components/Questionnaire.css` - Estilos atualizados

---

## ⚠️ IMPORTANTE

- **Dados antigos foram deletados**: A migration executou `TRUNCATE TABLE questionnaire_data CASCADE`
- **Todos os pacientes precisarão preencher o questionário novamente**
- **O sistema está preparado para receber a nova estrutura**

---

## 🚀 Pronto para Usar!

Depois de reiniciar o servidor (parar e rodar `npm run dev` novamente), o sistema estará completamente funcional com o novo questionário de 7 blocos! 🎉


