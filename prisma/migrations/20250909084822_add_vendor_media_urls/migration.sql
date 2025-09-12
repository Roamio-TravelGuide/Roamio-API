/*
  Warnings:

  - You are about to drop the column `cover_image_id` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `logo_id` on the `vendor` table. All the data in the column will be lost.

*/
-- DropForeignKey


-- AlterTable
ALTER TABLE "vendor"
ADD COLUMN "cover_url" TEXT,
ADD COLUMN "logo_url" TEXT;

