import { NextResponse } from "next/server";

/** Deployment fingerprint — compare with latest GitHub commit on main. */
export async function GET() {
  return NextResponse.json({
    service: "HireLens",
    gitCommit:
      process.env.RAILWAY_GIT_COMMIT_SHA ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.GIT_COMMIT ??
      null,
    gitBranch:
      process.env.RAILWAY_GIT_BRANCH ??
      process.env.VERCEL_GIT_COMMIT_REF ??
      null,
    environment: process.env.RAILWAY_ENVIRONMENT ?? process.env.NODE_ENV ?? null,
    expectedFeatures: [
      "admin-job-descriptions",
      "assessment-multi-file-upload",
      "landing-jd-dropdown",
    ],
  });
}
