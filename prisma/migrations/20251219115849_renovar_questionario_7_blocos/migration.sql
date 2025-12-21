-- ================================================
-- MIGRATION: Renovar Questionário para 7 Blocos
-- ================================================
-- ATENÇÃO: Esta migration DELETA todos os dados antigos da tabela questionnaire_data
-- Execute apenas se tiver certeza que pode perder os dados atuais

-- 1. LIMPAR DADOS ANTIGOS
TRUNCATE TABLE "questionnaire_data" CASCADE;

-- 2. REMOVER COLUNAS ANTIGAS
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "nivelAtividade";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "refeicoesDia";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "restricoes";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "alimentosNaoGosta";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "preferenciaAlimentacao";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "costumaCozinhar";
ALTER TABLE "questionnaire_data" DROP COLUMN IF EXISTS "observacoes";

-- 3. MODIFICAR COLUNAS EXISTENTES (tornar NOT NULL)
ALTER TABLE "questionnaire_data" ALTER COLUMN "idade" SET NOT NULL;
ALTER TABLE "questionnaire_data" ALTER COLUMN "sexo" SET NOT NULL;
ALTER TABLE "questionnaire_data" ALTER COLUMN "altura" SET NOT NULL;
ALTER TABLE "questionnaire_data" ALTER COLUMN "pesoAtual" SET NOT NULL;
ALTER TABLE "questionnaire_data" ALTER COLUMN "objetivo" SET NOT NULL;

-- 4. ADICIONAR NOVAS COLUNAS - Bloco 2: Rotina e Atividade
ALTER TABLE "questionnaire_data" ADD COLUMN "frequenciaAtividade" TEXT NOT NULL DEFAULT 'Não pratico';
ALTER TABLE "questionnaire_data" ADD COLUMN "tipoAtividade" TEXT NOT NULL DEFAULT 'Outro';
ALTER TABLE "questionnaire_data" ADD COLUMN "horarioTreino" TEXT NOT NULL DEFAULT 'Varia muito';
ALTER TABLE "questionnaire_data" ADD COLUMN "rotinaDiaria" TEXT NOT NULL DEFAULT 'Sedentária (trabalho sentado, pouco movimento)';

-- 5. ADICIONAR NOVAS COLUNAS - Bloco 3: Estrutura da Dieta
ALTER TABLE "questionnaire_data" ADD COLUMN "quantidadeRefeicoes" TEXT NOT NULL DEFAULT '3 refeições';
ALTER TABLE "questionnaire_data" ADD COLUMN "preferenciaRefeicoes" TEXT NOT NULL DEFAULT 'Um equilíbrio entre simples e variadas';

-- 6. ADICIONAR NOVAS COLUNAS - Bloco 4: Complexidade e Adesão
ALTER TABLE "questionnaire_data" ADD COLUMN "confortoPesar" TEXT NOT NULL DEFAULT 'Às vezes';
ALTER TABLE "questionnaire_data" ADD COLUMN "tempoPreparacao" TEXT NOT NULL DEFAULT 'Médio (10–30 min)';
ALTER TABLE "questionnaire_data" ADD COLUMN "preferenciaVariacao" TEXT NOT NULL DEFAULT 'Um pouco de repetição é ok';

-- 7. ADICIONAR NOVAS COLUNAS - Bloco 5: Alimentos do Dia a Dia
ALTER TABLE "questionnaire_data" ADD COLUMN "alimentosDoDiaADia" TEXT;

-- 8. ADICIONAR NOVAS COLUNAS - Bloco 6: Restrições
ALTER TABLE "questionnaire_data" ADD COLUMN "restricaoAlimentar" TEXT NOT NULL DEFAULT 'Nenhuma';
ALTER TABLE "questionnaire_data" ADD COLUMN "outraRestricao" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN "alimentosEvita" TEXT;

-- 9. ADICIONAR NOVAS COLUNAS - Bloco 7: Flexibilidade Real
ALTER TABLE "questionnaire_data" ADD COLUMN "opcoesSubstituicao" TEXT NOT NULL DEFAULT 'Algumas opções já são suficientes';
ALTER TABLE "questionnaire_data" ADD COLUMN "refeicoesLivres" TEXT NOT NULL DEFAULT 'Talvez';

-- 10. REMOVER DEFAULTS (agora que a tabela está vazia)
ALTER TABLE "questionnaire_data" ALTER COLUMN "frequenciaAtividade" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "tipoAtividade" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "horarioTreino" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "rotinaDiaria" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "quantidadeRefeicoes" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "preferenciaRefeicoes" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "confortoPesar" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "tempoPreparacao" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "preferenciaVariacao" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "restricaoAlimentar" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "opcoesSubstituicao" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "refeicoesLivres" DROP DEFAULT;


