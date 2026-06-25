import { prisma } from "@/lib/prisma";

const RESUME_STORAGE_QUOTA = 5000;
const MONTHLY_SCREENING_QUOTA = 1000;

export type PlatformMetrics = {
  storageUsedPct: number;
  apiUsagePct: number;
  currentPlan: string;
  appVersion: string;
  recruiterCount: number;
  screenedThisMonth: number;
};

export async function fetchPlatformMetrics(): Promise<PlatformMetrics> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [candidateCount, recruiterCount, screenedThisMonth] = await Promise.all([
    prisma.candidate.count(),
    prisma.user.count({ where: { role: "RECRUITER" } }),
    prisma.candidate.count({
      where: { status: "EVALUATED", updatedAt: { gte: monthStart } },
    }),
  ]);

  const storageUsedPct = Math.min(
    100,
    Math.round((candidateCount / RESUME_STORAGE_QUOTA) * 100)
  );
  const apiUsagePct = Math.min(
    100,
    Math.round((screenedThisMonth / MONTHLY_SCREENING_QUOTA) * 100)
  );
  const currentPlan = recruiterCount > 5 ? "Enterprise" : "Starter";

  return {
    storageUsedPct,
    apiUsagePct,
    currentPlan,
    appVersion: process.env.npm_package_version ?? "0.1.0",
    recruiterCount,
    screenedThisMonth,
  };
}
