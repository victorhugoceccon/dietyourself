-- AlterTable
ALTER TABLE "daily_check_ins" ADD COLUMN     "aguaMetaLitros" DOUBLE PRECISION,
ADD COLUMN     "focoDia" TEXT,
ADD COLUMN     "treinoPlanejado" BOOLEAN;

-- CreateTable
CREATE TABLE "generation_controls" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastDietGeneration" TIMESTAMP(3),
    "lastWorkoutGeneration" TIMESTAMP(3),
    "lastReset" TIMESTAMP(3),
    "resetsAvailable" INTEGER NOT NULL DEFAULT 1,
    "nextGenerationAllowed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_controls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generation_controls_userId_key" ON "generation_controls"("userId");

-- CreateIndex
CREATE INDEX "generation_controls_userId_idx" ON "generation_controls"("userId");

-- AddForeignKey
ALTER TABLE "generation_controls" ADD CONSTRAINT "generation_controls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
