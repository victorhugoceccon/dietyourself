-- CreateTable
CREATE TABLE "branding_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "brandName" TEXT,
    "professionalSettings" TEXT,
    "patientSettings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branding_settings_userId_key" ON "branding_settings"("userId");

-- CreateIndex
CREATE INDEX "branding_settings_userId_idx" ON "branding_settings"("userId");

-- AddForeignKey
ALTER TABLE "branding_settings" ADD CONSTRAINT "branding_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
