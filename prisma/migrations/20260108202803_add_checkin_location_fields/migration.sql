-- AlterTable
ALTER TABLE "daily_check_ins" ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "photoUrl" TEXT;
