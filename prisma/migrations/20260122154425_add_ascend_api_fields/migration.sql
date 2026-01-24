-- AlterTable
ALTER TABLE "exercicios" ADD COLUMN "source" TEXT,
ADD COLUMN "ascendExerciseId" TEXT,
ADD COLUMN "ascendData" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "exercicios_ascendExerciseId_key" ON "exercicios"("ascendExerciseId");

-- CreateIndex
CREATE INDEX "exercicios_source_idx" ON "exercicios"("source");

-- CreateIndex
CREATE INDEX "exercicios_ascendExerciseId_idx" ON "exercicios"("ascendExerciseId");
