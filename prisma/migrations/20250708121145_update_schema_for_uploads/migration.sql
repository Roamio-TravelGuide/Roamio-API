/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `media` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[s3_key]` on the table `media` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone_no]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "media" ADD COLUMN     "bitrate" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "s3_key" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sample_rate" INTEGER,
ADD COLUMN     "width" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "media_url_key" ON "media"("url");

-- CreateIndex
CREATE UNIQUE INDEX "media_s3_key_key" ON "media"("s3_key");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_no_key" ON "user"("phone_no");
