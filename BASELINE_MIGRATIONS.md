# 🔧 Baseline de Migrações - Resolver P3005

## 📋 Problema
O erro `P3005` indica que o banco de dados já tem estrutura, mas o Prisma não sabe quais migrações já foram aplicadas.

## ✅ Solução: Fazer Baseline

### Opção 1: Marcar todas as migrações como aplicadas (Recomendado)

```bash
# Na VPS
cd /caminho/do/projeto/dietyourself-login

# Parar servidor
pm2 stop all

# Marcar todas as migrações existentes como aplicadas
npx prisma migrate resolve --applied 20251216161601_add_treinos_executados_feedback_solicitacoes
npx prisma migrate resolve --applied 20251217165715_add_branding_settings
npx prisma migrate resolve --applied 20251218132926_add_password_reset_token
npx prisma migrate resolve --applied 20251219_add_new_features
npx prisma migrate resolve --applied 20251219115849_renovar_questionario_7_blocos
npx prisma migrate resolve --applied 20251219201943_add_new_features

# Agora aplicar a nova migração
npx prisma migrate deploy

# Regenerar Prisma Client
npx prisma generate

# Reiniciar servidor
pm2 restart all
```

### Opção 2: Usar migrate resolve --rolled-back (se algumas já foram aplicadas)

```bash
# Verificar quais migrações já estão no banco
psql -U seu_usuario -d dietyourself_db -c "SELECT migration_name FROM _prisma_migrations;"

# Marcar apenas as que NÃO estão no banco como aplicadas
# (ajuste conforme necessário)
```

### Opção 3: Criar tabela _prisma_migrations manualmente

```bash
# Conectar no PostgreSQL
psql -U seu_usuario -d dietyourself_db

# Criar tabela de controle de migrações (se não existir)
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

# Inserir registros das migrações já aplicadas
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count")
VALUES 
  ('1', 'checksum1', '20251216161601_add_treinos_executados_feedback_solicitacoes', now(), now(), 1),
  ('2', 'checksum2', '20251217165715_add_branding_settings', now(), now(), 1),
  ('3', 'checksum3', '20251218132926_add_password_reset_token', now(), now(), 1),
  ('4', 'checksum4', '20251219_add_new_features', now(), now(), 1),
  ('5', 'checksum5', '20251219115849_renovar_questionario_7_blocos', now(), now(), 1),
  ('6', 'checksum6', '20251219201943_add_new_features', now(), now(), 1)
ON CONFLICT DO NOTHING;

# Sair
\q

# Agora aplicar a nova migração
npx prisma migrate deploy
```

## 🚀 Solução Rápida (Recomendada)

```bash
# Na VPS
cd /caminho/do/projeto/dietyourself-login
pm2 stop all

# Aplicar migração manualmente (pula o controle do Prisma)
psql -U seu_usuario -d dietyourself_db -f prisma/migrations/20251222000000_fix_questionnaire_schema/migration.sql

# Regenerar Prisma Client
npx prisma generate

# Marcar a migração como aplicada manualmente
psql -U seu_usuario -d dietyourself_db << EOF
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count")
VALUES (gen_random_uuid()::text, '', '20251222000000_fix_questionnaire_schema', now(), now(), 1)
ON CONFLICT DO NOTHING;
EOF

# Reiniciar servidor
pm2 restart all
```

## 🔍 Verificar Status

```bash
# Ver migrações aplicadas
psql -U seu_usuario -d dietyourself_db -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

# Verificar estrutura da tabela questionnaire_data
psql -U seu_usuario -d dietyourself_db -c "\d questionnaire_data"
```

## ⚠️ Importante

- A **Opção 3** (aplicar manualmente) é a mais segura se você não tem certeza de quais migrações foram aplicadas
- Depois de aplicar manualmente, marque a migração como aplicada na tabela `_prisma_migrations`
- Isso permite que o Prisma continue rastreando migrações futuras

---

**✨ Escolha a opção que melhor se adequa à sua situação!**
