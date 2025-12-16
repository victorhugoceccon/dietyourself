-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PACIENTE',
    "roles" TEXT,
    "profilePhoto" TEXT,
    "motivationalMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nutricionistaId" TEXT,
    "personalId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idade" INTEGER,
    "sexo" TEXT,
    "altura" DOUBLE PRECISION,
    "pesoAtual" DOUBLE PRECISION,
    "objetivo" TEXT,
    "nivelAtividade" TEXT,
    "refeicoesDia" INTEGER,
    "restricoes" TEXT,
    "alimentosNaoGosta" TEXT,
    "preferenciaAlimentacao" TEXT,
    "costumaCozinhar" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dietas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietaData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dietas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alimentos" (
    "id" TEXT NOT NULL,
    "numero" INTEGER,
    "categoria" TEXT,
    "descricao" TEXT NOT NULL,
    "umidade" DOUBLE PRECISION,
    "energiaKcal" DOUBLE PRECISION NOT NULL,
    "energiaKj" DOUBLE PRECISION,
    "proteina" DOUBLE PRECISION NOT NULL,
    "lipideos" DOUBLE PRECISION NOT NULL,
    "colesterol" DOUBLE PRECISION,
    "carboidrato" DOUBLE PRECISION NOT NULL,
    "fibraAlimentar" DOUBLE PRECISION,
    "cinzas" DOUBLE PRECISION,
    "nutricionistaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_check_ins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adherence" TEXT NOT NULL,
    "pesoAtual" DOUBLE PRECISION,
    "observacao" TEXT,
    "checkInDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refeicoesConsumidas" TEXT,

    CONSTRAINT "daily_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumed_meals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealIndex" INTEGER NOT NULL,
    "mealName" TEXT NOT NULL,
    "consumedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumed_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercicios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "videoUrl" TEXT,
    "observacoes" TEXT,
    "personalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisoes_treino" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "diasSemana" TEXT,
    "personalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisoes_treino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisoes_treino_itens" (
    "id" TEXT NOT NULL,
    "divisaoTreinoId" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticoes" TEXT,
    "carga" TEXT,
    "descanso" TEXT,
    "observacoes" TEXT,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisoes_treino_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescricoes_treino" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "personalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "observacoes" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_treino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescricoes_treino_divisoes" (
    "id" TEXT NOT NULL,
    "prescricaoId" TEXT NOT NULL,
    "divisaoTreinoId" TEXT,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_treino_divisoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescricoes_treino_itens" (
    "id" TEXT NOT NULL,
    "divisaoId" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticoes" TEXT,
    "carga" TEXT,
    "descanso" TEXT,
    "observacoes" TEXT,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_treino_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treinos_executados" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "prescricaoId" TEXT NOT NULL,
    "divisaoId" TEXT NOT NULL,
    "dataExecucao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diaSemana" TEXT NOT NULL,
    "finalizado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treinos_executados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_treinos" (
    "id" TEXT NOT NULL,
    "treinoExecutadoId" TEXT NOT NULL,
    "observacao" TEXT,
    "intensidade" INTEGER,
    "dificuldade" INTEGER,
    "satisfacao" INTEGER,
    "completouTreino" BOOLEAN NOT NULL DEFAULT true,
    "motivoIncompleto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_treinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_mudanca" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "personalId" TEXT NOT NULL,
    "prescricaoId" TEXT,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "resposta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_mudanca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_nutricionistaId_idx" ON "users"("nutricionistaId");

-- CreateIndex
CREATE INDEX "users_personalId_idx" ON "users"("personalId");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_data_userId_key" ON "questionnaire_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dietas_userId_key" ON "dietas"("userId");

-- CreateIndex
CREATE INDEX "alimentos_nutricionistaId_idx" ON "alimentos"("nutricionistaId");

-- CreateIndex
CREATE INDEX "daily_check_ins_userId_idx" ON "daily_check_ins"("userId");

-- CreateIndex
CREATE INDEX "daily_check_ins_checkInDate_idx" ON "daily_check_ins"("checkInDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_ins_userId_checkInDate_key" ON "daily_check_ins"("userId", "checkInDate");

-- CreateIndex
CREATE INDEX "consumed_meals_userId_idx" ON "consumed_meals"("userId");

-- CreateIndex
CREATE INDEX "consumed_meals_consumedDate_idx" ON "consumed_meals"("consumedDate");

-- CreateIndex
CREATE UNIQUE INDEX "consumed_meals_userId_mealIndex_consumedDate_key" ON "consumed_meals"("userId", "mealIndex", "consumedDate");

-- CreateIndex
CREATE INDEX "exercicios_personalId_idx" ON "exercicios"("personalId");

-- CreateIndex
CREATE INDEX "exercicios_categoria_idx" ON "exercicios"("categoria");

-- CreateIndex
CREATE INDEX "divisoes_treino_personalId_idx" ON "divisoes_treino"("personalId");

-- CreateIndex
CREATE INDEX "divisoes_treino_itens_divisaoTreinoId_idx" ON "divisoes_treino_itens"("divisaoTreinoId");

-- CreateIndex
CREATE INDEX "divisoes_treino_itens_exercicioId_idx" ON "divisoes_treino_itens"("exercicioId");

-- CreateIndex
CREATE INDEX "prescricoes_treino_pacienteId_idx" ON "prescricoes_treino"("pacienteId");

-- CreateIndex
CREATE INDEX "prescricoes_treino_personalId_idx" ON "prescricoes_treino"("personalId");

-- CreateIndex
CREATE INDEX "prescricoes_treino_ativo_idx" ON "prescricoes_treino"("ativo");

-- CreateIndex
CREATE INDEX "prescricoes_treino_divisoes_prescricaoId_idx" ON "prescricoes_treino_divisoes"("prescricaoId");

-- CreateIndex
CREATE INDEX "prescricoes_treino_divisoes_divisaoTreinoId_idx" ON "prescricoes_treino_divisoes"("divisaoTreinoId");

-- CreateIndex
CREATE INDEX "prescricoes_treino_itens_divisaoId_idx" ON "prescricoes_treino_itens"("divisaoId");

-- CreateIndex
CREATE INDEX "prescricoes_treino_itens_exercicioId_idx" ON "prescricoes_treino_itens"("exercicioId");

-- CreateIndex
CREATE INDEX "treinos_executados_pacienteId_idx" ON "treinos_executados"("pacienteId");

-- CreateIndex
CREATE INDEX "treinos_executados_prescricaoId_idx" ON "treinos_executados"("prescricaoId");

-- CreateIndex
CREATE INDEX "treinos_executados_dataExecucao_idx" ON "treinos_executados"("dataExecucao");

-- CreateIndex
CREATE INDEX "treinos_executados_diaSemana_idx" ON "treinos_executados"("diaSemana");

-- CreateIndex
CREATE UNIQUE INDEX "treinos_executados_pacienteId_prescricaoId_divisaoId_dataEx_key" ON "treinos_executados"("pacienteId", "prescricaoId", "divisaoId", "dataExecucao");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_treinos_treinoExecutadoId_key" ON "feedback_treinos"("treinoExecutadoId");

-- CreateIndex
CREATE INDEX "feedback_treinos_treinoExecutadoId_idx" ON "feedback_treinos"("treinoExecutadoId");

-- CreateIndex
CREATE INDEX "solicitacoes_mudanca_pacienteId_idx" ON "solicitacoes_mudanca"("pacienteId");

-- CreateIndex
CREATE INDEX "solicitacoes_mudanca_personalId_idx" ON "solicitacoes_mudanca"("personalId");

-- CreateIndex
CREATE INDEX "solicitacoes_mudanca_status_idx" ON "solicitacoes_mudanca"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_nutricionistaId_fkey" FOREIGN KEY ("nutricionistaId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_data" ADD CONSTRAINT "questionnaire_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dietas" ADD CONSTRAINT "dietas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alimentos" ADD CONSTRAINT "alimentos_nutricionistaId_fkey" FOREIGN KEY ("nutricionistaId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_check_ins" ADD CONSTRAINT "daily_check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumed_meals" ADD CONSTRAINT "consumed_meals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercicios" ADD CONSTRAINT "exercicios_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisoes_treino" ADD CONSTRAINT "divisoes_treino_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisoes_treino_itens" ADD CONSTRAINT "divisoes_treino_itens_divisaoTreinoId_fkey" FOREIGN KEY ("divisaoTreinoId") REFERENCES "divisoes_treino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisoes_treino_itens" ADD CONSTRAINT "divisoes_treino_itens_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "exercicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes_treino" ADD CONSTRAINT "prescricoes_treino_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes_treino" ADD CONSTRAINT "prescricoes_treino_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes_treino_divisoes" ADD CONSTRAINT "prescricoes_treino_divisoes_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "prescricoes_treino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes_treino_divisoes" ADD CONSTRAINT "prescricoes_treino_divisoes_divisaoTreinoId_fkey" FOREIGN KEY ("divisaoTreinoId") REFERENCES "divisoes_treino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes_treino_itens" ADD CONSTRAINT "prescricoes_treino_itens_divisaoId_fkey" FOREIGN KEY ("divisaoId") REFERENCES "prescricoes_treino_divisoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes_treino_itens" ADD CONSTRAINT "prescricoes_treino_itens_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "exercicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinos_executados" ADD CONSTRAINT "treinos_executados_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinos_executados" ADD CONSTRAINT "treinos_executados_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "prescricoes_treino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinos_executados" ADD CONSTRAINT "treinos_executados_divisaoId_fkey" FOREIGN KEY ("divisaoId") REFERENCES "prescricoes_treino_divisoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_treinos" ADD CONSTRAINT "feedback_treinos_treinoExecutadoId_fkey" FOREIGN KEY ("treinoExecutadoId") REFERENCES "treinos_executados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_mudanca" ADD CONSTRAINT "solicitacoes_mudanca_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_mudanca" ADD CONSTRAINT "solicitacoes_mudanca_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_mudanca" ADD CONSTRAINT "solicitacoes_mudanca_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "prescricoes_treino"("id") ON DELETE SET NULL ON UPDATE CASCADE;
