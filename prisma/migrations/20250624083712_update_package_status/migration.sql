-- AlterEnum
ALTER TYPE "PackageStatus" ADD VALUE 'draft';

-- AlterTable
ALTER TABLE "tour_package" ALTER COLUMN "status" SET DEFAULT 'draft';
