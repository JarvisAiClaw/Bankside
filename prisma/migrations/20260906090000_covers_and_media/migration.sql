-- AlterTable
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
