-- ================================================
-- Script para marcar migrações como aplicadas
-- Execute como usuário postgres ou root
-- ================================================

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

-- Marcar todas as migrações antigas como aplicadas
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

-- ✅ Todas as migrações marcadas como aplicadas!
