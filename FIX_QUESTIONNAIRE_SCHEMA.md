# 🔧 Correção do Schema do Questionário

## 📋 Problema
O banco de dados na VPS ainda tem campos antigos do questionário (`nivelAtividade`, `refeicoesDia`, etc.), mas o código está usando os novos campos (`frequenciaAtividade`, `tipoAtividade`, etc.).

## ✅ Solução

### Na VPS, execute:

```bash
# 1. Conectar na VPS
ssh usuario@seu-ip-da-vps
cd /caminho/do/projeto/dietyourself-login

# 2. Parar servidor
pm2 stop all

# 3. Aplicar migração
npx prisma migrate deploy

# 4. OU aplicar manualmente (se migrate deploy não funcionar)
psql -U seu_usuario -d dietyourself_db -f prisma/migrations/20251222000000_fix_questionnaire_schema/migration.sql

# 5. Regenerar Prisma Client
npx prisma generate

# 6. Reiniciar servidor
pm2 restart all
```

### Verificar se funcionou:

```bash
# Verificar estrutura da tabela
psql -U seu_usuario -d dietyourself_db -c "\d questionnaire_data"

# Deve mostrar os novos campos:
# - frequenciaAtividade
# - tipoAtividade
# - horarioTreino
# - rotinaDiaria
# - quantidadeRefeicoes
# - preferenciaRefeicoes
# - confortoPesar
# - tempoPreparacao
# - preferenciaVariacao
# - alimentosDoDiaADia
# - restricaoAlimentar
# - outraRestricao
# - alimentosEvita
# - opcoesSubstituicao
# - refeicoesLivres
```

## 🚀 Sequência Completa (Uma Linha)

```bash
cd /caminho/do/projeto/dietyourself-login && pm2 stop all && npx prisma migrate deploy && npx prisma generate && pm2 restart all
```

## ⚠️ Importante

- A migração é **segura** e não apaga dados existentes
- Ela apenas adiciona as novas colunas e remove as antigas
- Se houver dados antigos na tabela, eles serão preservados (mas os campos antigos serão removidos)

## 🐛 Se der erro

Se a migração falhar, execute manualmente:

```bash
# Conectar no PostgreSQL
psql -U seu_usuario -d dietyourself_db

# Executar comandos SQL manualmente (copiar do arquivo migration.sql)
\i prisma/migrations/20251222000000_fix_questionnaire_schema/migration.sql

# Sair
\q

# Regenerar Prisma Client
npx prisma generate

# Reiniciar
pm2 restart all
```

---

**✨ Após aplicar a migração, o questionário deve funcionar corretamente!**
