-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'moderator', 'traveler', 'travel_guide', 'vendor');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'in_progress', 'resolved', 'rejected');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('spam', 'inappropriate', 'fake', 'other');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('draft', 'pending_approval', 'published', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('uploading', 'processing', 'ready', 'failed', 'deleted');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video', 'audio', 'document');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "HiddenPlaceStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('hotel', 'restaurant', 'transport', 'attraction', 'shop', 'other');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('user_login', 'user_logout', 'user_registration', 'package_create', 'package_update', 'package_delete', 'package_publish', 'package_approve', 'package_reject', 'package_download', 'media_upload', 'media_delete', 'payment_success', 'payment_failed', 'payment_refund', 'report_submit', 'report_resolve', 'hidden_place_submit', 'hidden_place_approve', 'hidden_place_reject', 'review_post', 'review_update', 'review_delete', 'poi_create', 'poi_update', 'poi_delete', 'vendor_subscribe', 'vendor_unsubscribe', 'profile_update', 'password_change', 'admin_action', 'moderator_action', 'system_event', 'other');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('user', 'tour_package', 'tour_stop', 'media', 'payment', 'hidden_place', 'download', 'review', 'vendor', 'poi', 'location', 'report', 'system', 'none');

-- CreateEnum
CREATE TYPE "LogUserType" AS ENUM ('admin', 'moderator', 'traveler', 'travel_guide', 'vendor');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'traveler',
    "email" TEXT NOT NULL,
    "phone_no" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "name" TEXT NOT NULL,
    "registered_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password_hash" TEXT NOT NULL,
    "last_login" TIMESTAMP(3),
    "profile_picture_url" TEXT,
    "bio" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "reported_user_id" INTEGER,
    "reported_package_id" INTEGER,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "type" "ReportType" NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" INTEGER,
    "resolution_notes" TEXT,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" SERIAL NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postal_code" TEXT,
    "place_id" TEXT,
    "full_address" TEXT,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_guide" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "verification_documents" TEXT[],
    "years_of_experience" INTEGER,
    "languages_spoken" TEXT[],
    "specialties" TEXT[],
    "verification_date" TIMESTAMP(3),
    "verification_notes" TEXT,

    CONSTRAINT "travel_guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_package" (
    "id" SERIAL NOT NULL,
    "guide_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "max_group_size" INTEGER,
    "difficulty_level" TEXT,
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "location_id" INTEGER,

    CONSTRAINT "tour_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_stop" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "sequence_no" INTEGER NOT NULL,
    "description" TEXT,
    "stop_name" TEXT NOT NULL,
    "location_id" INTEGER,
    "arrival_instructions" TEXT,
    "estimated_stay_duration" INTEGER,

    CONSTRAINT "tour_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'uploading',
    "description" TEXT,
    "duration_seconds" INTEGER,
    "media_type" "MediaType" NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_id" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "file_size" BIGINT,
    "format" TEXT,
    "thumbnail_url" TEXT,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_stop_media" (
    "stop_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,

    CONSTRAINT "tour_stop_media_pkey" PRIMARY KEY ("stop_id","media_id")
);

-- CreateTable
CREATE TABLE "traveler" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "preferences" JSONB,
    "saved_locations" INTEGER[],
    "preferred_languages" TEXT[],
    "notification_preferences" JSONB,

    CONSTRAINT "traveler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "transaction_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paid_at" TIMESTAMP(3),
    "payment_method" TEXT,
    "payment_gateway" TEXT,
    "gateway_transaction_id" TEXT,
    "invoice_number" TEXT,
    "refund_amount" DOUBLE PRECISION,
    "package_id" INTEGER,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "hidden_place" (
    "id" SERIAL NOT NULL,
    "traveler_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "picture_id" INTEGER,
    "description" TEXT,
    "title" TEXT NOT NULL,
    "status" "HiddenPlaceStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "verified_by_id" INTEGER,
    "verified_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "tags" TEXT[],

    CONSTRAINT "hidden_place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download" (
    "id" SERIAL NOT NULL,
    "traveler_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_size" BIGINT,
    "url" TEXT NOT NULL,
    "device_info" TEXT,
    "ip_address" TEXT,
    "download_count" INTEGER NOT NULL DEFAULT 1,
    "last_downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" SERIAL NOT NULL,
    "traveler_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comments" TEXT,
    "title" TEXT,
    "response" TEXT,
    "response_date" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "idx_location_coords" ON "location"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_location_country" ON "location"("country");

-- CreateIndex
CREATE INDEX "idx_location_city" ON "location"("city");

-- CreateIndex
CREATE UNIQUE INDEX "travel_guide_user_id_key" ON "travel_guide"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tour_stop_package_id_sequence_no_key" ON "tour_stop"("package_id", "sequence_no");

-- CreateIndex
CREATE UNIQUE INDEX "traveler_user_id_key" ON "traveler"("user_id");

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_guide" ADD CONSTRAINT "travel_guide_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_package" ADD CONSTRAINT "tour_package_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "travel_guide"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_package" ADD CONSTRAINT "tour_package_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_package" ADD CONSTRAINT "tour_package_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_stop" ADD CONSTRAINT "tour_stop_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "tour_package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_stop" ADD CONSTRAINT "tour_stop_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_stop_media" ADD CONSTRAINT "tour_stop_media_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "tour_stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_stop_media" ADD CONSTRAINT "tour_stop_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler" ADD CONSTRAINT "traveler_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "tour_package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidden_place" ADD CONSTRAINT "hidden_place_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "traveler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidden_place" ADD CONSTRAINT "hidden_place_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidden_place" ADD CONSTRAINT "hidden_place_picture_id_fkey" FOREIGN KEY ("picture_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidden_place" ADD CONSTRAINT "hidden_place_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download" ADD CONSTRAINT "download_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "traveler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download" ADD CONSTRAINT "download_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "tour_package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "traveler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "tour_package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
