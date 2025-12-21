# 🔧 Corrigir Permissões e Marcar Migrações

## 📋 Problema
O script foi aplicado parcialmente, mas não conseguiu inserir na tabela `_prisma_migrations` por falta de permissão.

## ✅ Solução

### Passo 1: Marcar migrações como aplicadas (como postgres)

```bash
# Na VPS, execute como usuário postgres (que tem todas as permissões)
sudo -u postgres psql -d dietyourself_db -f mark-migrations-applied.sql
```

**OU se não tiver acesso postgres:**

```bash
# Conectar como postgres
sudo su - postgres
psql -d dietyourself_db

# Executar comandos SQL manualmente:
```

```sql
-- Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP,
    "started_at" TIMESTAMP NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Marcar todas as migrações como aplicadas
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count")
VALUES 
  (gen_random_uuid()::text, '', '20251216161601_add_treinos_executados_feedback_solicitacoes', now() - interval '7 days', now() - interval '7 days', 1),
  (gen_random_uuid()::text, '', '20251217165715_add_branding_settings', now() - interval '6 days', now() - interval '6 days', 1),
  (gen_random_uuid()::text, '', '20251218132926_add_password_reset_token', now() - interval '5 days', now() - interval '5 days', 1),
  (gen_random_uuid()::text, '', '20251219_add_new_features', now() - interval '4 days', now() - interval '4 days', 1),
  (gen_random_uuid()::text, '', '20251219115849_renovar_questionario_7_blocos', now() - interval '3 days', now() - interval '3 days', 1),
  (gen_random_uuid()::text, '', '20251219201943_add_new_features', now() - interval '2 days', now() - interval '2 days', 1),
  (gen_random_uuid()::text, '', '20251222000000_fix_questionnaire_schema', now(), now(), 1)
ON CONFLICT DO NOTHING;

-- Sair
\q
exit
```

### Passo 2: Dar permissões ao usuário do aplicativo

```bash
# Conectar como postgres
sudo -u postgres psql -d dietyourself_db

# Dar permissões ao usuário do aplicativo
GRANT ALL PRIVILEGES ON TABLE "_prisma_migrations" TO dietyourself_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dietyourself_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dietyourself_user;

# Sair
\q
```

### Passo 3: Verificar e regenerar Prisma Client

```bash
cd /caminho/do/projeto/dietyourself-login

# Verificar status das migrações
npx prisma migrate status

# Deve mostrar que todas estão aplicadas

# Regenerar Prisma Client
npx prisma generate

# Reiniciar servidor
pm2 restart all
```

## 🚀 Sequência Completa

```bash
# 1. Marcar migrações como aplicadas
sudo -u postgres psql -d dietyourself_db -f mark-migrations-applied.sql

# 2. Dar permissões
sudo -u postgres psql -d dietyourself_db -c "GRANT ALL PRIVILEGES ON TABLE \"_prisma_migrations\" TO dietyourself_user;"

# 3. Regenerar e reiniciar
cd /caminho/do/projeto/dietyourself-login
npx prisma generate
pm2 restart all
```

## 🔍 Verificar se funcionou

```bash
# Ver migrações aplicadas
psql -U dietyourself_user -d dietyourself_db -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

# Verificar estrutura da tabela questionnaire_data
psql -U dietyourself_user -d dietyourself_db -c "\d questionnaire_data"

# Verificar status do Prisma
npx prisma migrate status
```

---

**✨ Após executar esses comandos, tudo deve funcionar!**
