-- CreateTable
CREATE TABLE "grupos_treino_check_ins" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "locationName" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "activity" TEXT,
    "duration" INTEGER,
    "distance" DOUBLE PRECISION,
    "calories" INTEGER,
    "steps" INTEGER,
    "treinoExecutadoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_treino_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grupos_treino_check_ins_grupoId_idx" ON "grupos_treino_check_ins"("grupoId");

-- CreateIndex
CREATE INDEX "grupos_treino_check_ins_userId_idx" ON "grupos_treino_check_ins"("userId");

-- CreateIndex
CREATE INDEX "grupos_treino_check_ins_createdAt_idx" ON "grupos_treino_check_ins"("createdAt");

-- AddForeignKey
ALTER TABLE "grupos_treino_check_ins" ADD CONSTRAINT "grupos_treino_check_ins_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_treino_check_ins" ADD CONSTRAINT "grupos_treino_check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_treino_check_ins" ADD CONSTRAINT "grupos_treino_check_ins_treinoExecutadoId_fkey" FOREIGN KEY ("treinoExecutadoId") REFERENCES "treinos_executados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
