/*
  Warnings:

  - You are about to drop the column `cover_image_id` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `logo_id` on the `vendor` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "vendor" DROP CONSTRAINT "vendor_cover_image_id_fkey";

-- DropForeignKey
ALTER TABLE "vendor" DROP CONSTRAINT "vendor_logo_id_fkey";

-- AlterTable
ALTER TABLE "vendor" DROP COLUMN "cover_image_id",
DROP COLUMN "logo_id",
ADD COLUMN     "cover_url" TEXT,
ADD COLUMN     "logo_url" TEXT;
