-- CreateTable
CREATE TABLE "photo_meals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "alimentos" TEXT NOT NULL,
    "totalKcal" DOUBLE PRECISION NOT NULL,
    "totalProtein" DOUBLE PRECISION NOT NULL,
    "totalCarbs" DOUBLE PRECISION NOT NULL,
    "totalFat" DOUBLE PRECISION NOT NULL,
    "consumedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_meals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "photo_meals_userId_idx" ON "photo_meals"("userId");

-- CreateIndex
CREATE INDEX "photo_meals_consumedDate_idx" ON "photo_meals"("consumedDate");

-- AddForeignKey
ALTER TABLE "photo_meals" ADD CONSTRAINT "photo_meals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
