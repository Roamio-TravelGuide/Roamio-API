-- CreateTable
CREATE TABLE "vendor" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" "BusinessType" NOT NULL DEFAULT 'other',
    "business_description" TEXT,
    "business_website" TEXT,
    "tagline" TEXT,
    
    "business_license" TEXT NOT NULL,
    "social_media_links" JSONB,
    "verification_status" "POIStatus" NOT NULL DEFAULT 'pending_approval',
    "rejection_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "average_rating" DOUBLE PRECISION DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_user_id_key" ON "vendor"("user_id");

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE "vendor" ADD CONSTRAINT "vendor_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE "vendor" ADD CONSTRAINT "vendor_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
