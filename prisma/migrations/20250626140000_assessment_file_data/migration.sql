-- Store assessment file bytes in Postgres so downloads survive Railway redeploys.
ALTER TABLE "AssessmentFile" ADD COLUMN IF NOT EXISTS "fileData" BYTEA;
