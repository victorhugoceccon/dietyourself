-- ================================================
-- Script para aplicar correção do questionário manualmente
-- Use quando o Prisma der erro P3005
-- ================================================

-- 1. REMOVER COLUNAS ANTIGAS (se existirem)
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "nivelAtividade";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "refeicoesDia";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "restricoes";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "alimentosNaoGosta";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "preferenciaAlimentacao";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "costumaCozinhar";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "observacoes";

-- 2. ADICIONAR NOVAS COLUNAS - Bloco 2: Rotina e Atividade (se não existirem)
DO $$ 
BEGIN
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
END $$;

-- 3. ADICIONAR NOVAS COLUNAS - Bloco 3: Estrutura da Dieta (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='quantidadeRefeicoes') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "quantidadeRefeicoes" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='preferenciaRefeicoes') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "preferenciaRefeicoes" TEXT;
    END IF;
END $$;

-- 4. ADICIONAR NOVAS COLUNAS - Bloco 4: Complexidade e Adesão (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='confortoPesar') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "confortoPesar" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='tempoPreparacao') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "tempoPreparacao" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='preferenciaVariacao') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "preferenciaVariacao" TEXT;
    END IF;
END $$;

-- 5. ADICIONAR NOVAS COLUNAS - Bloco 5: Alimentos do Dia a Dia (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='alimentosDoDiaADia') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "alimentosDoDiaADia" TEXT;
    END IF;
END $$;

-- 6. ADICIONAR NOVAS COLUNAS - Bloco 6: Restrições (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='restricaoAlimentar') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "restricaoAlimentar" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='outraRestricao') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "outraRestricao" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='alimentosEvita') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "alimentosEvita" TEXT;
    END IF;
END $$;

-- 7. ADICIONAR NOVAS COLUNAS - Bloco 7: Flexibilidade Real (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='opcoesSubstituicao') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "opcoesSubstituicao" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questionnaire_data' AND column_name='refeicoesLivres') THEN
        ALTER TABLE "questionnaire_data" ADD COLUMN "refeicoesLivres" TEXT;
    END IF;
END $$;

-- 8. Criar tabela _prisma_migrations se não existir
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

-- 9. Marcar esta migração como aplicada
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count")
VALUES (gen_random_uuid()::text, '', '20251222000000_fix_questionnaire_schema', now(), now(), 1)
ON CONFLICT DO NOTHING;

-- ✅ Migração aplicada com sucesso!
