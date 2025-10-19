/*
  Warnings:

  - The values [draft] on the enum `HiddenPlaceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "HiddenPlaceStatus_new" AS ENUM ('pending', 'approved', 'rejected');
ALTER TABLE "hidden_place" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "hidden_place" ALTER COLUMN "status" TYPE "HiddenPlaceStatus_new" USING ("status"::text::"HiddenPlaceStatus_new");
ALTER TYPE "HiddenPlaceStatus" RENAME TO "HiddenPlaceStatus_old";
ALTER TYPE "HiddenPlaceStatus_new" RENAME TO "HiddenPlaceStatus";
DROP TYPE "HiddenPlaceStatus_old";
ALTER TABLE "hidden_place" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterTable
ALTER TABLE "hidden_place" ALTER COLUMN "status" SET DEFAULT 'pending';
