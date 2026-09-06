-- Post hide for owner/moderation
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "hidden" BOOLEAN NOT NULL DEFAULT false;

-- Brand placement stub (Discover Partner card) — no payments
CREATE TABLE IF NOT EXISTS "BrandSpot" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrandSpot_pkey" PRIMARY KEY ("id")
);

-- Post report + notification type (from wave2 gold)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POST_REPORT';

CREATE TABLE IF NOT EXISTS "PostReport" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PostReport_postId_idx" ON "PostReport"("postId");
CREATE UNIQUE INDEX IF NOT EXISTS "PostReport_postId_reporterId_key" ON "PostReport"("postId", "reporterId");

DO $$ BEGIN
  ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
