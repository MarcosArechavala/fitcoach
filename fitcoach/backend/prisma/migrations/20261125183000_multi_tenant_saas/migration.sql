-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- DropIndex
DROP INDEX IF EXISTS "ServicePlan_slug_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "trainerId" TEXT;

-- AlterTable
ALTER TABLE "ContactLead" ADD COLUMN "trainerId" TEXT;

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "trainerId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "trainerId" TEXT;

-- AlterTable
ALTER TABLE "ServicePlan" ADD COLUMN "trainerId" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "trainerId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN "trainerId" TEXT;

-- AlterTable: agregar slug primero como nullable, rellenar y luego NOT NULL
ALTER TABLE "TrainerProfile" ADD COLUMN "slug" TEXT;

UPDATE "TrainerProfile"
SET "slug" = LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE("firstName" || '-' || "lastName", '[^a-zA-Z0-9]+', '-', 'g')))
WHERE "slug" IS NULL;

-- En caso de nombres repetidos o vacíos, asegurar unicidad
UPDATE "TrainerProfile"
SET "slug" = 'coach-' || SUBSTRING("id", 1, 6)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "TrainerProfile" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkoutTemplate" ADD COLUMN "trainerId" TEXT;

-- Backfill trainerId para datos existentes usando el primer entrenador
UPDATE "SiteSettings" SET "trainerId" = (SELECT "id" FROM "TrainerProfile" ORDER BY "createdAt" ASC LIMIT 1) WHERE "trainerId" IS NULL;
UPDATE "StudentProfile" SET "trainerId" = (SELECT "id" FROM "TrainerProfile" ORDER BY "createdAt" ASC LIMIT 1) WHERE "trainerId" IS NULL;
UPDATE "ServicePlan" SET "trainerId" = (SELECT "id" FROM "TrainerProfile" ORDER BY "createdAt" ASC LIMIT 1) WHERE "trainerId" IS NULL;
UPDATE "Exercise" SET "trainerId" = (SELECT "id" FROM "TrainerProfile" ORDER BY "createdAt" ASC LIMIT 1) WHERE "trainerId" IS NULL;
UPDATE "WorkoutTemplate" SET "trainerId" = (SELECT "id" FROM "TrainerProfile" ORDER BY "createdAt" ASC LIMIT 1) WHERE "trainerId" IS NULL;
UPDATE "Appointment" SET "trainerId" = (SELECT "id" FROM "TrainerProfile" ORDER BY "createdAt" ASC LIMIT 1) WHERE "trainerId" IS NULL;
UPDATE "Payment" SET "trainerId" = (SELECT "id" FROM "TrainerProfile" ORDER BY "createdAt" ASC LIMIT 1) WHERE "trainerId" IS NULL;
UPDATE "ContactLead" SET "trainerId" = (SELECT "id" FROM "TrainerProfile" ORDER BY "createdAt" ASC LIMIT 1) WHERE "trainerId" IS NULL;

-- CreateIndex
CREATE INDEX "Appointment_trainerId_scheduledAt_status_idx" ON "Appointment"("trainerId", "scheduledAt", "status");

-- CreateIndex
CREATE INDEX "ContactLead_trainerId_status_createdAt_idx" ON "ContactLead"("trainerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Exercise_trainerId_muscleGroup_isArchived_idx" ON "Exercise"("trainerId", "muscleGroup", "isArchived");

-- CreateIndex
CREATE INDEX "Payment_trainerId_status_dueDate_idx" ON "Payment"("trainerId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "ServicePlan_trainerId_isActive_idx" ON "ServicePlan"("trainerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePlan_trainerId_slug_key" ON "ServicePlan"("trainerId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_trainerId_key" ON "SiteSettings"("trainerId");

-- CreateIndex
CREATE INDEX "StudentProfile_trainerId_status_deletedAt_idx" ON "StudentProfile"("trainerId", "status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_slug_key" ON "TrainerProfile"("slug");

-- CreateIndex
CREATE INDEX "WorkoutTemplate_trainerId_deletedAt_idx" ON "WorkoutTemplate"("trainerId", "deletedAt");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePlan" ADD CONSTRAINT "ServicePlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplate" ADD CONSTRAINT "WorkoutTemplate_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactLead" ADD CONSTRAINT "ContactLead_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
