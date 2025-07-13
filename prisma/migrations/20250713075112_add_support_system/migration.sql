-- CreateEnum
CREATE TYPE "SupportCategory" AS ENUM ('safety', 'harassment', 'workplace', 'payment', 'equipment', 'management', 'customer', 'scheduling', 'training', 'technical', 'account', 'billing', 'feature_request', 'bug_report', 'other');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('new', 'open', 'in_progress', 'resolved', 'closed', 'rejected');

-- CreateEnum
CREATE TYPE "SupportUrgency" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "support_ticket" (
    "id" SERIAL NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_type" "UserRole" NOT NULL,
    "travel_guide_id" INTEGER,
    "vendor_id" INTEGER,
    "category" "SupportCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" "SupportUrgency" NOT NULL DEFAULT 'medium',
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_ticket_ticket_id_key" ON "support_ticket"("ticket_id");

-- CreateIndex
CREATE INDEX "support_ticket_travel_guide_id_idx" ON "support_ticket"("travel_guide_id");

-- CreateIndex
CREATE INDEX "support_ticket_vendor_id_idx" ON "support_ticket"("vendor_id");

-- CreateIndex
CREATE INDEX "support_ticket_status_idx" ON "support_ticket"("status");

-- CreateIndex
CREATE INDEX "support_ticket_category_idx" ON "support_ticket"("category");

-- CreateIndex
CREATE INDEX "support_ticket_created_at_idx" ON "support_ticket"("created_at");

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_travel_guide_id_fkey" FOREIGN KEY ("travel_guide_id") REFERENCES "travel_guide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
