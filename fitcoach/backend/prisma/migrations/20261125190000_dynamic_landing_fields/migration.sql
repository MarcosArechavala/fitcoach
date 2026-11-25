-- AlterTable
ALTER TABLE "SiteSettings"
ADD COLUMN "heroImageUrl" TEXT,
ADD COLUMN "heroTitle" TEXT,
ADD COLUMN "heroSubtitle" TEXT,
ADD COLUMN "services" JSONB,
ADD COLUMN "testimonials" JSONB;
