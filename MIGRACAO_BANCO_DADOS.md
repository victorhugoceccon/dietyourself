# 🔄 Guia de Migração do Banco de Dados

## 📋 Problema
O banco de dados na VPS tem tabelas/colunas que não estão no schema do Prisma, ou vice-versa.

---

## 🔍 **OPÇÃO 1: Sincronizar Schema com Banco Existente (Recomendado)**

### Passo 1: Conectar na VPS
```bash
ssh usuario@seu-ip-da-vps
cd /caminho/do/projeto/dietyourself-login
```

### Passo 2: Puxar estrutura do banco para o schema
```bash
# Isso vai atualizar o schema.prisma com a estrutura REAL do banco
npx prisma db pull
```

**⚠️ ATENÇÃO:** Isso vai sobrescrever o `schema.prisma` com a estrutura atual do banco!

### Passo 3: Revisar mudanças
```bash
# Ver o que mudou no schema
git diff prisma/schema.prisma
```

### Passo 4: Regenerar Prisma Client
```bash
npx prisma generate
```

### Passo 5: Fazer commit das mudanças
```bash
git add prisma/schema.prisma
git commit -m "sync: sincronizar schema com banco de dados"
git push origin main
```

---

## 🆕 **OPÇÃO 2: Criar Nova Migração (Se o Schema está Correto)**

### Passo 1: Verificar diferenças
```bash
# Na VPS
cd /caminho/do/projeto/dietyourself-login

# Ver o que está diferente
npx prisma migrate status
```

### Passo 2: Criar migração baseada no schema atual
```bash
# Criar nova migração
npx prisma migrate dev --name sync_database_schema

# OU criar migração sem aplicar (apenas gerar SQL)
npx prisma migrate dev --create-only --name sync_database_schema
```

### Passo 3: Revisar o SQL gerado
```bash
# Ver o arquivo SQL gerado
cat prisma/migrations/[timestamp]_sync_database_schema/migration.sql
```

### Passo 4: Aplicar migração
```bash
# Se criou com --create-only, aplicar agora:
npx prisma migrate deploy
```

---

## 🔧 **OPÇÃO 3: Reset Completo (CUIDADO - Apaga TUDO!)**

### ⚠️ **ATENÇÃO: Isso vai DELETAR TODOS OS DADOS!**

```bash
# Na VPS
cd /caminho/do/projeto/dietyourself-login

# Parar servidor
pm2 stop all

# Reset completo
npx prisma migrate reset --force

# Aplicar todas as migrations do zero
npx prisma migrate deploy

# Criar usuários de teste
npx prisma db seed

# Reiniciar servidor
pm2 restart all
```

---

## 🔍 **OPÇÃO 4: Verificar Estrutura do Banco Manualmente**

### Passo 1: Conectar no PostgreSQL
```bash
# Na VPS
psql -U seu_usuario -d dietyourself_db
```

### Passo 2: Listar todas as tabelas
```sql
\dt
```

### Passo 3: Ver estrutura de uma tabela específica
```sql
\d nome_da_tabela
-- Exemplo:
\d users
\d alimentos
\d treinos_executados
```

### Passo 4: Comparar com schema.prisma
Compare as colunas retornadas com o que está no `schema.prisma`.

### Passo 5: Sair do psql
```sql
\q
```

---

## 📝 **OPÇÃO 5: Criar Migração Manual (Para Colunas Específicas)**

Se você sabe exatamente quais colunas estão faltando:

### Passo 1: Criar arquivo de migração manual
```bash
# Na VPS
cd /caminho/do/projeto/dietyourself-login
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_missing_columns
```

### Passo 2: Criar arquivo SQL
```bash
nano prisma/migrations/[timestamp]_add_missing_columns/migration.sql
```

### Passo 3: Adicionar comandos SQL
```sql
-- Exemplo: Adicionar coluna que está faltando
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nova_coluna" TEXT;

-- Ou criar tabela que está faltando
CREATE TABLE IF NOT EXISTS "nova_tabela" (
  "id" TEXT NOT NULL,
  "campo" TEXT,
  CONSTRAINT "nova_tabela_pkey" PRIMARY KEY ("id")
);
```

### Passo 4: Marcar migração como aplicada
```bash
# Aplicar a migração manual
npx prisma migrate resolve --applied [timestamp]_add_missing_columns

# OU aplicar diretamente
npx prisma migrate deploy
```

---

## ✅ **Recomendação: Sequência Completa**

```bash
# 1. Conectar na VPS
ssh usuario@seu-ip-da-vps
cd /caminho/do/projeto/dietyourself-login

# 2. Parar servidor
pm2 stop all

# 3. Verificar status das migrations
npx prisma migrate status

# 4. Puxar estrutura do banco (OPÇÃO 1)
npx prisma db pull

# 5. OU criar nova migração (OPÇÃO 2)
npx prisma migrate dev --name sync_database

# 6. Regenerar Prisma Client
npx prisma generate

# 7. Reiniciar servidor
pm2 restart all

# 8. Verificar logs
pm2 logs --lines 50
```

---

## 🐛 **Troubleshooting**

### Erro: "Migration engine failed"
```bash
# Limpar cache do Prisma
rm -rf node_modules/.prisma
npx prisma generate
```

### Erro: "Table already exists"
```bash
# Usar IF NOT EXISTS nos comandos SQL
# Ou marcar migração como aplicada:
npx prisma migrate resolve --applied nome_da_migracao
```

### Erro: "Column already exists"
```bash
# Usar ADD COLUMN IF NOT EXISTS no SQL
# Ou verificar se a coluna já existe antes de adicionar
```

### Ver histórico de migrations
```bash
npx prisma migrate status
```

### Ver migrations aplicadas no banco
```sql
-- No psql
SELECT * FROM "_prisma_migrations";
```

---

## 📞 **Se precisar de ajuda**

Execute e compartilhe a saída:

```bash
# Status das migrations
npx prisma migrate status

# Estrutura do banco
psql -U seu_usuario -d dietyourself_db -c "\dt"

# Schema atual
cat prisma/schema.prisma
```

---

**✨ Escolha a opção que melhor se adequa à sua situação!**
