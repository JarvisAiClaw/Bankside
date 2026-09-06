-- Wave 2: DMs, join requests, featured venues, notification types

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'JOIN_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'JOIN_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'JOIN_DENIED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DM';

DO $$ BEGIN
  CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "JoinRequest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "JoinRequest_groupId_userId_key" ON "JoinRequest"("groupId", "userId");
CREATE INDEX IF NOT EXISTS "JoinRequest_groupId_status_idx" ON "JoinRequest"("groupId", "status");

CREATE TABLE IF NOT EXISTS "DmThread" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DmThread_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DmThread_userAId_userBId_key" ON "DmThread"("userAId", "userBId");
CREATE INDEX IF NOT EXISTS "DmThread_userAId_idx" ON "DmThread"("userAId");
CREATE INDEX IF NOT EXISTS "DmThread_userBId_idx" ON "DmThread"("userBId");

CREATE TABLE IF NOT EXISTS "DmMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DmMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DmMessage_threadId_createdAt_idx" ON "DmMessage"("threadId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "DmThread" ADD CONSTRAINT "DmThread_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "DmThread" ADD CONSTRAINT "DmThread_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "DmMessage" ADD CONSTRAINT "DmMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DmThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "DmMessage" ADD CONSTRAINT "DmMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
