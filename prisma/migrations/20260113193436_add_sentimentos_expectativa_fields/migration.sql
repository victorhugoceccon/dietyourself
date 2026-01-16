/*
  Warnings:

  - Added the required column `limitacoesFisicas` to the `questionnaire_data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problemasSaude` to the `questionnaire_data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restricoesMedicasExercicio` to the `questionnaire_data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sono` to the `questionnaire_data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usoMedicacao` to the `questionnaire_data` table without a default value. This is not possible if the table is not empty.

*/
-- Adicionar colunas opcionais primeiro
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "alimentacaoFimSemana" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "alimentosGosta" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "barreirasTreino" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "detalhesLimitacao" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "expectativaSucesso" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "movimentosEvitar" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "preferenciaDificuldadeTreino" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "quaisMedicamentos" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "quaisProblemasSaude" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "receiosSaude" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "relacaoEmocionalTreino" TEXT;
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "sentimentosCorpo" TEXT;

-- Adicionar colunas obrigatórias com valores padrão temporários
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "limitacoesFisicas" TEXT DEFAULT 'Não';
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "problemasSaude" TEXT DEFAULT 'Não';
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "restricoesMedicasExercicio" TEXT DEFAULT 'Não';
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "sono" TEXT DEFAULT 'Durmo bem';
ALTER TABLE "questionnaire_data" ADD COLUMN IF NOT EXISTS "usoMedicacao" TEXT DEFAULT 'Não';

-- Atualizar registros existentes com valores padrão (caso ainda tenham NULL)
UPDATE "questionnaire_data" SET "limitacoesFisicas" = 'Não' WHERE "limitacoesFisicas" IS NULL;
UPDATE "questionnaire_data" SET "problemasSaude" = 'Não' WHERE "problemasSaude" IS NULL;
UPDATE "questionnaire_data" SET "restricoesMedicasExercicio" = 'Não' WHERE "restricoesMedicasExercicio" IS NULL;
UPDATE "questionnaire_data" SET "sono" = 'Durmo bem' WHERE "sono" IS NULL;
UPDATE "questionnaire_data" SET "usoMedicacao" = 'Não' WHERE "usoMedicacao" IS NULL;

-- Tornar as colunas obrigatórias (remover DEFAULT depois de preencher)
ALTER TABLE "questionnaire_data" ALTER COLUMN "limitacoesFisicas" SET NOT NULL;
ALTER TABLE "questionnaire_data" ALTER COLUMN "problemasSaude" SET NOT NULL;
ALTER TABLE "questionnaire_data" ALTER COLUMN "restricoesMedicasExercicio" SET NOT NULL;
ALTER TABLE "questionnaire_data" ALTER COLUMN "sono" SET NOT NULL;
ALTER TABLE "questionnaire_data" ALTER COLUMN "usoMedicacao" SET NOT NULL;

-- Remover os defaults temporários
ALTER TABLE "questionnaire_data" ALTER COLUMN "limitacoesFisicas" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "problemasSaude" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "restricoesMedicasExercicio" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "sono" DROP DEFAULT;
ALTER TABLE "questionnaire_data" ALTER COLUMN "usoMedicacao" DROP DEFAULT;

-- Alterar colunas existentes para permitir NULL
ALTER TABLE "questionnaire_data" ALTER COLUMN "sexo" DROP NOT NULL;
ALTER TABLE "questionnaire_data" ALTER COLUMN "tipoAtividade" DROP NOT NULL;
