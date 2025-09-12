-- AlterTable
ALTER TABLE "user" ADD COLUMN     "resetOTP" TEXT,
ADD COLUMN     "resetOTPExpiry" TIMESTAMP(3);
