/*
  Warnings:

  - You are about to drop the column `s3_key` on the `media` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "media_s3_key_key";

-- AlterTable
ALTER TABLE "media" DROP COLUMN "s3_key";
