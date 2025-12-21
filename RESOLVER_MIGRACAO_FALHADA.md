# 🔧 Resolver Migração Falhada

## 📋 Problema
A migração `20251216161601_add_treinos_executados_feedback_solicitacoes` está marcada como "failed" no banco, impedindo novas migrações.

## ✅ Solução Rápida

### Execute como postgres:

```bash
# Na VPS
sudo -u postgres psql -d dietyourself_db -f resolve-failed-migration.sql
```

**OU execute manualmente:**

```bash
# Conectar como postgres
sudo -u postgres psql -d dietyourself_db
```

Depois execute:

```sql
-- 1. Remover registro de migração falhada
DELETE FROM "_prisma_migrations" 
WHERE "migration_name" = '20251216161601_add_treinos_executados_feedback_solicitacoes'
AND "finished_at" IS NULL;

-- 2. Marcar todas as migrações como aplicadas
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count")
VALUES 
  (gen_random_uuid()::text, '', '20251216161601_add_treinos_executados_feedback_solicitacoes', now() - interval '7 days', now() - interval '7 days', 1),
  (gen_random_uuid()::text, '', '20251217165715_add_branding_settings', now() - interval '6 days', now() - interval '6 days', 1),
  (gen_random_uuid()::text, '', '20251218132926_add_password_reset_token', now() - interval '5 days', now() - interval '5 days', 1),
  (gen_random_uuid()::text, '', '20251219_add_new_features', now() - interval '4 days', now() - interval '4 days', 1),
  (gen_random_uuid()::text, '', '20251219115849_renovar_questionario_7_blocos', now() - interval '3 days', now() - interval '3 days', 1),
  (gen_random_uuid()::text, '', '20251219201943_add_new_features', now() - interval '2 days', now() - interval '2 days', 1),
  (gen_random_uuid()::text, '', '20251222000000_fix_questionnaire_schema', now() - interval '1 day', now() - interval '1 day', 1)
ON CONFLICT DO NOTHING;

-- 3. Aplicar migração pendente (adicionar duracaoMinutos)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='treinos_executados' AND column_name='duracaoMinutos'
    ) THEN
        ALTER TABLE "treinos_executados" ADD COLUMN "duracaoMinutos" INTEGER;
    END IF;
END $$;

-- 4. Marcar migração pendente como aplicada
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count")
SELECT gen_random_uuid()::text, '', '20251221154055_add_duracao_minutos_treino_executado', now(), now(), 1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" 
    WHERE "migration_name" = '20251221154055_add_duracao_minutos_treino_executado'
);

-- Sair
\q
```

### Depois:

```bash
cd /caminho/do/projeto/dietyourself-login

# Verificar status
npx prisma migrate status

# Deve mostrar: "Database schema is up to date!"

# Regenerar Prisma Client
npx prisma generate

# Reiniciar servidor
pm2 restart all
```

## 🚀 Tudo em uma linha

```bash
sudo -u postgres psql -d dietyourself_db -f resolve-failed-migration.sql && cd /caminho/do/projeto/dietyourself-login && npx prisma generate && pm2 restart all
```

## 🔍 Verificar se funcionou

```bash
# Ver status das migrações
npx prisma migrate status

# Deve mostrar: "Database schema is up to date!"

# Ver migrações aplicadas
psql -U dietyourself_user -d dietyourself_db -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"
```

---

**✨ Após executar, todas as migrações estarão aplicadas!**
