-- Sync schema with application (safe for existing databases)

ALTER TYPE "SendStatus" ADD VALUE IF NOT EXISTS 'OPENED';
ALTER TYPE "SendStatus" ADD VALUE IF NOT EXISTS 'CLICKED';

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "mandatoryRequirements" TEXT;

ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "experienceIntelligenceScore" DOUBLE PRECISION;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "experienceIntelligenceRank" INTEGER;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "experienceIntelligenceData" JSONB;

ALTER TABLE "AssessmentSend" ADD COLUMN IF NOT EXISTS "templateName" TEXT;
ALTER TABLE "AssessmentSend" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "AssessmentSend" ADD COLUMN IF NOT EXISTS "bodyHtml" TEXT;
ALTER TABLE "AssessmentSend" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE "AssessmentSend" ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3);
ALTER TABLE "AssessmentSend" ADD COLUMN IF NOT EXISTS "clickedAt" TIMESTAMP(3);
ALTER TABLE "AssessmentSend" ADD COLUMN IF NOT EXISTS "aiGenerated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AssessmentSend" ADD COLUMN IF NOT EXISTS "sentById" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AssessmentSend_sentById_fkey'
  ) THEN
    ALTER TABLE "AssessmentSend"
      ADD CONSTRAINT "AssessmentSend_sentById_fkey"
      FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
