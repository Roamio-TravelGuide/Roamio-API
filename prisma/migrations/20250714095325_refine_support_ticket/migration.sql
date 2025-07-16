/*
  Warnings:

  - You are about to drop the column `closed_at` on the `support_ticket` table. All the data in the column will be lost.
  - You are about to drop the column `ticket_id` on the `support_ticket` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "support_ticket_ticket_id_key";

-- AlterTable
ALTER TABLE "support_ticket" DROP COLUMN "closed_at",
DROP COLUMN "ticket_id",
ADD COLUMN     "opened_at" TIMESTAMP(3);
