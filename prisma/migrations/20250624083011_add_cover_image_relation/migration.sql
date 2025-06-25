-- AlterTable
ALTER TABLE "tour_package" ADD COLUMN     "cover_image_id" INTEGER;

-- DropEnum
DROP TYPE "LogUserType";

-- DropEnum
DROP TYPE "TargetType";

-- CreateIndex
CREATE INDEX "tour_package_guide_id_idx" ON "tour_package"("guide_id");

-- CreateIndex
CREATE INDEX "tour_package_status_idx" ON "tour_package"("status");

-- CreateIndex
CREATE INDEX "tour_package_created_at_idx" ON "tour_package"("created_at");

-- AddForeignKey
ALTER TABLE "tour_package" ADD CONSTRAINT "tour_package_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
