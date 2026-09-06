-- Wave 3: structured noticeboard fields on Venue
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "rulesText" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "gateCode" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "gateNotes" TEXT;
