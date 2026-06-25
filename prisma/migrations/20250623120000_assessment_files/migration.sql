-- AssessmentFile table (multi-file attachments per assessment)
CREATE TABLE IF NOT EXISTS "AssessmentFile" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AssessmentFile_assessmentId_idx" ON "AssessmentFile"("assessmentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AssessmentFile_assessmentId_fkey'
  ) THEN
    ALTER TABLE "AssessmentFile"
      ADD CONSTRAINT "AssessmentFile_assessmentId_fkey"
      FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
