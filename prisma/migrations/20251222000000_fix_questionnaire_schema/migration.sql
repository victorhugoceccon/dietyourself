-- ================================================
-- MIGRATION: Corrigir Schema do Questionário
-- ================================================
-- Esta migration atualiza o schema do questionário para os novos campos
-- de forma segura, verificando se as colunas existem antes de modificar

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
