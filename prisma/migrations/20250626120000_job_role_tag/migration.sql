-- Persist role tag from saved job descriptions onto screening jobs for assessment matching.
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "roleTag" TEXT;
