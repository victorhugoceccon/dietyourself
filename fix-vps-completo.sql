-- ================================================
-- Script COMPLETO para corrigir VPS
-- Execute como usuário postgres
-- ================================================

-- 1. Dar permissões completas ao usuário do aplicativo
GRANT ALL PRIVILEGES ON DATABASE dietyourself_db TO dietyourself_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO dietyourself_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dietyourself_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dietyourself_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dietyourself_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dietyourself_user;

-- 2. Alterar owner de todas as tabelas para o usuário do aplicativo
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO dietyourself_user';
    END LOOP;
END $$;

-- 3. Alterar owner de todas as sequences
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequencename) || ' OWNER TO dietyourself_user';
    END LOOP;
END $$;

-- 4. Alterar owner do schema
ALTER SCHEMA public OWNER TO dietyourself_user;

-- 5. Garantir que a tabela _prisma_migrations existe
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

-- 6. Dar permissões na tabela _prisma_migrations
GRANT ALL PRIVILEGES ON TABLE "_prisma_migrations" TO dietyourself_user;
ALTER TABLE "_prisma_migrations" OWNER TO dietyourself_user;

-- 7. Remover registros de migrações falhadas
DELETE FROM "_prisma_migrations" 
WHERE "finished_at" IS NULL;

-- 8. Marcar todas as migrações como aplicadas
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count")
VALUES 
  (gen_random_uuid()::text, '', '20251216161601_add_treinos_executados_feedback_solicitacoes', now() - interval '7 days', now() - interval '7 days', 1),
  (gen_random_uuid()::text, '', '20251217165715_add_branding_settings', now() - interval '6 days', now() - interval '6 days', 1),
  (gen_random_uuid()::text, '', '20251218132926_add_password_reset_token', now() - interval '5 days', now() - interval '5 days', 1),
  (gen_random_uuid()::text, '', '20251219_add_new_features', now() - interval '4 days', now() - interval '4 days', 1),
  (gen_random_uuid()::text, '', '20251219115849_renovar_questionario_7_blocos', now() - interval '3 days', now() - interval '3 days', 1),
  (gen_random_uuid()::text, '', '20251219201943_add_new_features', now() - interval '2 days', now() - interval '2 days', 1),
  (gen_random_uuid()::text, '', '20251221154055_add_duracao_minutos_treino_executado', now() - interval '1 day', now() - interval '1 day', 1),
  (gen_random_uuid()::text, '', '20251222000000_fix_questionnaire_schema', now(), now(), 1)
ON CONFLICT DO NOTHING;

-- 9. Garantir que todas as colunas do questionário existem
DO $$ 
BEGIN
    -- Remover colunas antigas
    ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "nivelAtividade";
    ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "refeicoesDia";
    ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "restricoes";
    ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "alimentosNaoGosta";
    ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "preferenciaAlimentacao";
    ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "costumaCozinhar";
    ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "observacoes";
    
    -- Adicionar novas colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='frequenciaAtividade') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "frequenciaAtividade" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='tipoAtividade') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "tipoAtividade" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='horarioTreino') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "horarioTreino" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='rotinaDiaria') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "rotinaDiaria" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='quantidadeRefeicoes') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "quantidadeRefeicoes" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='preferenciaRefeicoes') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "preferenciaRefeicoes" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='confortoPesar') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "confortoPesar" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='tempoPreparacao') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "tempoPreparacao" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='preferenciaVariacao') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "preferenciaVariacao" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='alimentosDoDiaADia') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "alimentosDoDiaADia" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='restricaoAlimentar') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "restricaoAlimentar" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='outraRestricao') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "outraRestricao" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='alimentosEvita') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "alimentosEvita" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='opcoesSubstituicao') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "opcoesSubstituicao" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='refeicoesLivres') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "refeicoesLivres" TEXT;
    END IF;
END $$;

-- 10. Garantir que duracaoMinutos existe em treinos_executados
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='treinos_executados' AND column_name='duracaoMinutos'
    ) THEN
        ALTER TABLE "treinos_executados" ADD COLUMN "duracaoMinutos" INTEGER;
    END IF;
END $$;

-- ✅ Tudo configurado e corrigido!
