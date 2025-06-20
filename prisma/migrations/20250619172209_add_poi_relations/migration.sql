/*
  Warnings:

  - The values [video,document] on the enum `MediaType` will be removed. If these variants are still used in the database, this will fail.
  - The values [draft,archived] on the enum `PackageStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [refunded,partially_refunded] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `device_info` on the `download` table. All the data in the column will be lost.
  - You are about to drop the column `download_count` on the `download` table. All the data in the column will be lost.
  - You are about to drop the column `ip_address` on the `download` table. All the data in the column will be lost.
  - You are about to drop the column `last_downloaded_at` on the `download` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `hidden_place` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `hidden_place` table. All the data in the column will be lost.
  - You are about to drop the column `verified_by_id` on the `hidden_place` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `location` table. All the data in the column will be lost.
  - You are about to drop the column `full_address` on the `location` table. All the data in the column will be lost.
  - You are about to drop the column `place_id` on the `location` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `location` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_url` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_at` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `gateway_transaction_id` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `payment_gateway` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `refund_amount` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `resolution_notes` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `resolved_at` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `resolved_by_id` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `review` table. All the data in the column will be lost.
  - You are about to drop the column `response_date` on the `review` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `review` table. All the data in the column will be lost.
  - You are about to drop the column `approved_at` on the `tour_package` table. All the data in the column will be lost.
  - You are about to drop the column `approved_by_id` on the `tour_package` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty_level` on the `tour_package` table. All the data in the column will be lost.
  - You are about to drop the column `location_id` on the `tour_package` table. All the data in the column will be lost.
  - You are about to drop the column `max_group_size` on the `tour_package` table. All the data in the column will be lost.
  - You are about to drop the column `arrival_instructions` on the `tour_stop` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_stay_duration` on the `tour_stop` table. All the data in the column will be lost.
  - You are about to drop the column `specialties` on the `travel_guide` table. All the data in the column will be lost.
  - You are about to drop the column `verification_date` on the `travel_guide` table. All the data in the column will be lost.
  - You are about to drop the column `verification_notes` on the `travel_guide` table. All the data in the column will be lost.
  - You are about to drop the column `verification_status` on the `travel_guide` table. All the data in the column will be lost.
  - You are about to drop the column `notification_preferences` on the `traveler` table. All the data in the column will be lost.
  - You are about to drop the column `preferences` on the `traveler` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_languages` on the `traveler` table. All the data in the column will be lost.
  - You are about to drop the column `saved_locations` on the `traveler` table. All the data in the column will be lost.
  - The `status` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `phone_no` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'blocked');

-- CreateEnum
CREATE TYPE "POIStatus" AS ENUM ('pending_approval', 'approved', 'rejected', 'archived');

-- AlterEnum
BEGIN;
CREATE TYPE "MediaType_new" AS ENUM ('image', 'audio');
ALTER TABLE "media" ALTER COLUMN "media_type" TYPE "MediaType_new" USING ("media_type"::text::"MediaType_new");
ALTER TYPE "MediaType" RENAME TO "MediaType_old";
ALTER TYPE "MediaType_new" RENAME TO "MediaType";
DROP TYPE "MediaType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PackageStatus_new" AS ENUM ('pending_approval', 'published', 'rejected');
ALTER TABLE "tour_package" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tour_package" ALTER COLUMN "status" TYPE "PackageStatus_new" USING ("status"::text::"PackageStatus_new");
ALTER TYPE "PackageStatus" RENAME TO "PackageStatus_old";
ALTER TYPE "PackageStatus_new" RENAME TO "PackageStatus";
DROP TYPE "PackageStatus_old";
ALTER TABLE "tour_package" ALTER COLUMN "status" SET DEFAULT 'pending_approval';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('pending', 'completed', 'failed');
ALTER TABLE "payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "payment" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- DropForeignKey
ALTER TABLE "hidden_place" DROP CONSTRAINT "hidden_place_verified_by_id_fkey";

-- DropForeignKey
ALTER TABLE "report" DROP CONSTRAINT "report_resolved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "tour_package" DROP CONSTRAINT "tour_package_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "tour_package" DROP CONSTRAINT "tour_package_location_id_fkey";

-- DropIndex
DROP INDEX "idx_location_country";

-- AlterTable
ALTER TABLE "download" DROP COLUMN "device_info",
DROP COLUMN "download_count",
DROP COLUMN "ip_address",
DROP COLUMN "last_downloaded_at";

-- AlterTable
ALTER TABLE "hidden_place" DROP COLUMN "tags",
DROP COLUMN "updated_at",
DROP COLUMN "verified_by_id";

-- AlterTable
ALTER TABLE "location" DROP COLUMN "country",
DROP COLUMN "full_address",
DROP COLUMN "place_id",
DROP COLUMN "state",
ADD COLUMN     "district" TEXT,
ADD COLUMN     "province" TEXT;

-- AlterTable
ALTER TABLE "media" DROP COLUMN "description",
DROP COLUMN "height",
DROP COLUMN "status",
DROP COLUMN "thumbnail_url",
DROP COLUMN "uploaded_at",
DROP COLUMN "width";

-- AlterTable
ALTER TABLE "payment" DROP COLUMN "gateway_transaction_id",
DROP COLUMN "payment_gateway",
DROP COLUMN "payment_method",
DROP COLUMN "refund_amount",
ALTER COLUMN "currency" SET DEFAULT 'LKR';

-- AlterTable
ALTER TABLE "report" DROP COLUMN "resolution_notes",
DROP COLUMN "resolved_at",
DROP COLUMN "resolved_by_id",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "review" DROP COLUMN "response",
DROP COLUMN "response_date",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "tour_package" DROP COLUMN "approved_at",
DROP COLUMN "approved_by_id",
DROP COLUMN "difficulty_level",
DROP COLUMN "location_id",
DROP COLUMN "max_group_size",
ALTER COLUMN "status" SET DEFAULT 'pending_approval';

-- AlterTable
ALTER TABLE "tour_stop" DROP COLUMN "arrival_instructions",
DROP COLUMN "estimated_stay_duration";

-- AlterTable
ALTER TABLE "travel_guide" DROP COLUMN "specialties",
DROP COLUMN "verification_date",
DROP COLUMN "verification_notes",
DROP COLUMN "verification_status";

-- AlterTable
ALTER TABLE "traveler" DROP COLUMN "notification_preferences",
DROP COLUMN "preferences",
DROP COLUMN "preferred_languages",
DROP COLUMN "saved_locations";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "phone_no" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'pending';

-- DropEnum
DROP TYPE "MediaStatus";

-- DropEnum
DROP TYPE "ReportType";

-- DropEnum
DROP TYPE "VerificationStatus";

-- CreateTable
CREATE TABLE "poi" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" "POIStatus" NOT NULL DEFAULT 'pending_approval',
    "location_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejection_reason" TEXT,

    CONSTRAINT "poi_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "poi" ADD CONSTRAINT "poi_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poi" ADD CONSTRAINT "poi_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
