import { prisma } from "@/lib/prisma";
import { fetchAnalyticsData } from "@/features/admin/lib/fetch-analytics";
import { fetchPlatformMetrics } from "@/features/admin/lib/fetch-platform-metrics";
import type {
  ActivityItem,
  DashboardKpi,
  DashboardStats,
  JobCard,
  PipelineStage,
  RecruiterLeaderboardRow,
} from "@/features/admin/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapAuditType(action: string): ActivityItem["type"] {
  const a = action.toLowerCase();
  if (a.includes("login")) return "login";
  if (a.includes("report")) return "report_generated";
  if (a.includes("assessment") || a.includes("email")) return "assessment_sent";
  if (a.includes("job")) return "job_created";
  if (a.includes("recruiter") || a.includes("user")) return "recruiter_added";
  if (a.includes("resume") || a.includes("upload")) return "resume_upload";
  if (a.includes("screen") || a.includes("evaluat")) return "candidate_screened";
  return "email_delivered";
}

export async function fetchDashboardStats(adminName: string): Promise<DashboardStats> {
  const [
    recruiters,
    jobs,
    candidates,
    parsedCandidates,
    goodToCall,
    maybe,
    notNow,
    assessmentsSent,
    reports,
    avgScore,
    avgEi,
    recentJobs,
    recruiterUsers,
    auditLogs,
    platform,
    analytics,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "RECRUITER" } }),
    prisma.job.count({ where: { status: { not: "DRAFT" } } }),
    prisma.candidate.count({ where: { status: "EVALUATED" } }),
    prisma.candidate.count({ where: { status: { in: ["PARSED", "EVALUATING", "EVALUATED"] } } }),
    prisma.candidate.count({ where: { goodToCall: "YES" } }),
    prisma.candidate.count({ where: { goodToCall: "MAYBE" } }),
    prisma.candidate.count({ where: { goodToCall: "NO" } }),
    prisma.assessmentSend.count({ where: { status: { in: ["SENT", "DELIVERED"] } } }),
    prisma.report.count(),
    prisma.candidate.aggregate({
      where: { score: { not: null } },
      _avg: { score: true },
    }),
    prisma.candidate.aggregate({
      where: { experienceIntelligenceScore: { not: null } },
      _avg: { experienceIntelligenceScore: true },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        createdBy: { select: { name: true } },
        candidates: { select: { score: true, goodToCall: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "RECRUITER" },
      include: {
        _count: { select: { jobs: true, auditLogs: true } },
        jobs: {
          select: {
            status: true,
            candidates: { select: { score: true, goodToCall: true } },
            reports: { select: { id: true } },
          },
        },
      },
      take: 10,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { user: { select: { name: true } } },
    }),
    fetchPlatformMetrics(),
    fetchAnalyticsData(),
  ]);

  const total = Math.max(candidates, 1);
  const parsed = parsedCandidates;
  const screened = candidates;
  const assessments = assessmentsSent;

  const pipeline: PipelineStage[] = [
    {
      id: "applications",
      label: "Applications",
      count: total,
      percentage: 100,
      conversionRate: 100,
    },
    {
      id: "parsed",
      label: "Resume Parsed",
      count: parsed,
      percentage: Math.round((parsed / total) * 100),
      conversionRate: Math.round((parsed / total) * 100),
    },
    {
      id: "screened",
      label: "AI Screening",
      count: screened,
      percentage: Math.round((screened / total) * 100),
      conversionRate: Math.round((screened / parsed) * 100),
    },
    {
      id: "good",
      label: "Good To Call",
      count: goodToCall,
      percentage: Math.round((goodToCall / total) * 100),
      conversionRate: Math.round((goodToCall / screened) * 100),
    },
    {
      id: "assessment",
      label: "Assessment Sent",
      count: assessments,
      percentage: Math.round((assessments / total) * 100),
      conversionRate: goodToCall ? Math.round((assessments / goodToCall) * 100) : 0,
    },
  ];

  const kpis: DashboardKpi[] = [
    { id: "recruiters", label: "Total Recruiters", value: recruiters, accent: "navy" },
    { id: "jobs", label: "Open Jobs", value: jobs, accent: "red" },
    { id: "screened", label: "Candidates Screened", value: candidates, accent: "green" },
    { id: "good", label: "Good To Call", value: goodToCall, accent: "green" },
    { id: "maybe", label: "Maybe", value: maybe, accent: "amber" },
    { id: "no", label: "Not Now", value: notNow, accent: "red" },
    { id: "assessments", label: "Assessments Sent", value: assessmentsSent, accent: "navy" },
    { id: "reports", label: "Reports Generated", value: reports, accent: "red" },
    {
      id: "api",
      label: "Claude API Usage",
      value: `${platform.apiUsagePct}%`,
      accent: "amber",
      change: platform.apiUsagePct < 80 ? "Within quota" : "Approaching limit",
      trend: platform.apiUsagePct < 80 ? "neutral" : "down",
    },
    {
      id: "avgScore",
      label: "Avg Resume Score",
      value: avgScore._avg.score ? `${Math.round(avgScore._avg.score)}%` : "—",
      accent: "navy",
    },
    {
      id: "avgEi",
      label: "Avg Experience Intelligence",
      value: avgEi._avg.experienceIntelligenceScore
        ? `${avgEi._avg.experienceIntelligenceScore.toFixed(1)}`
        : "—",
      accent: "green",
    },
  ];

  const recruiterRows: RecruiterLeaderboardRow[] = recruiterUsers.map((u) => {
    const allCandidates = u.jobs.flatMap((j) => j.candidates);
    const scores = allCandidates.map((c) => c.score).filter((s): s is number => s != null);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const reportsCount = u.jobs.reduce((s, j) => s + j.reports.length, 0);
    const completedJobs = u.jobs.filter((j) => j.status === "COMPLETED").length;
    const totalJobs = u._count.jobs;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      department: "Talent Acquisition",
      designation: "Recruiter",
      jobsCreated: u._count.jobs,
      candidatesReviewed: allCandidates.length,
      reportsGenerated: reportsCount,
      avgCandidateScore: avg,
      hiringSuccess: allCandidates.length
        ? Math.round(
            (allCandidates.filter((c) => c.goodToCall === "YES").length / allCandidates.length) * 100
          )
        : 0,
      completionRate: totalJobs ? Math.round((completedJobs / totalJobs) * 100) : 0,
      avatarInitials: initials(u.name),
    };
  });

  const jobCards: JobCard[] = recentJobs.map((j) => {
    const scores = j.candidates.map((c) => c.score).filter((s): s is number => s != null);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      id: j.id,
      title: j.title,
      department: j.department,
      status: j.status,
      applicants: j.candidates.length,
      goodCandidates: j.candidates.filter((c) => c.goodToCall === "YES").length,
      avgScore: avg,
      createdBy: j.createdBy.name,
      createdAt: j.createdAt.toISOString(),
    };
  });

  const activity: ActivityItem[] = auditLogs.map((log) => ({
    id: log.id,
    type: mapAuditType(log.action),
    title: log.action,
    description: log.entity ? `${log.entity} updated` : "Platform activity",
    actor: log.user?.name ?? "System",
    timestamp: log.createdAt.toISOString(),
  }));

  return {
    adminName,
    kpis,
    pipeline,
    recruiters: recruiterRows.sort((a, b) => b.avgCandidateScore - a.avgCandidateScore),
    activity,
    jobs: jobCards,
    storageUsedPct: platform.storageUsedPct,
    apiUsagePct: platform.apiUsagePct,
    currentPlan: platform.currentPlan,
    appVersion: platform.appVersion,
    analytics,
  };
}
