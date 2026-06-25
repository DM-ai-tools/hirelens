import { prisma } from "@/lib/prisma";

export type TrendPoint = {
  date: string;
  screened: number;
  hired: number;
  assessments: number;
};

export type AnalyticsData = {
  avgAiScore: number | null;
  avgExperienceIntelligence: number | null;
  avgSkillMatch: number | null;
  hiringSuccessPrediction: number | null;
  topMatchingSkills: string[];
  topMissingSkills: string[];
  skillFrequency: { skill: string; count: number }[];
  topTechnologies: { name: string; pct: number }[];
  duplicateResumes: number;
  fraudFlags: number;
  hiringTrend7d: TrendPoint[];
  hiringTrend30d: TrendPoint[];
  hiringTrend90d: TrendPoint[];
  candidatesByDept: { department: string; count: number }[];
  candidateStatusPie: { name: string; value: number; fill: string }[];
  topSkillsRadar: { skill: string; score: number }[];
  hiringHeatmap: { day: string; slot: string; value: number }[];
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HEATMAP_SLOTS = ["6a", "9a", "12p", "3p", "6p", "9p"] as const;
const STATUS_COLORS: Record<string, string> = {
  "Good to Call": "#1E9E5A",
  Maybe: "#E0A106",
  "Not Now": "#C8202A",
  "Needs Review": "#7A8798",
  "In Review": "#7A8798",
};

function countSkills(skills: string[][]): { skill: string; count: number }[] {
  const map = new Map<string, number>();
  for (const list of skills) {
    for (const skill of list) {
      const key = skill.trim();
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);
}

function utcDayStart(offsetDays: number): number {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function buildTrend(
  days: number,
  labelFn: (offset: number) => string,
  candidates: { createdAt: Date; status: string; goodToCall: string | null }[],
  assessments: { sentAt: Date }[]
): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = utcDayStart(i);
    const end = start + 86_400_000;
    const screened = candidates.filter(
      (c) =>
        c.createdAt.getTime() >= start &&
        c.createdAt.getTime() < end &&
        c.status === "EVALUATED"
    ).length;
    const hired = candidates.filter(
      (c) =>
        c.createdAt.getTime() >= start &&
        c.createdAt.getTime() < end &&
        c.goodToCall === "YES"
    ).length;
    const assessmentCount = assessments.filter(
      (a) => a.sentAt.getTime() >= start && a.sentAt.getTime() < end
    ).length;
    points.push({
      date: labelFn(i),
      screened,
      hired,
      assessments: assessmentCount,
    });
  }
  return points;
}

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const since90 = new Date();
  since90.setUTCDate(since90.getUTCDate() - 90);

  const [evaluated, recentCandidates, assessments, jobs, goodToCallCounts, fraudFlags, emailRows] =
    await Promise.all([
      prisma.candidate.findMany({
        where: { status: "EVALUATED" },
        select: {
          score: true,
          experienceIntelligenceScore: true,
          matchedSkills: true,
          missingSkills: true,
          goodToCall: true,
          email: true,
        },
      }),
      prisma.candidate.findMany({
        where: { createdAt: { gte: since90 } },
        select: { createdAt: true, status: true, goodToCall: true },
      }),
      prisma.assessmentSend.findMany({
        where: { sentAt: { gte: since90, not: null } },
        select: { sentAt: true },
      }),
      prisma.job.findMany({
        select: {
          department: true,
          _count: { select: { candidates: true } },
        },
      }),
      prisma.candidate.groupBy({
        by: ["goodToCall"],
        _count: { id: true },
        where: { goodToCall: { not: null } },
      }),
      prisma.candidate.count({ where: { status: "FAILED" } }),
      prisma.candidate.findMany({
        where: { email: { not: null } },
        select: { email: true },
      }),
    ]);

  const scores = evaluated.map((c) => c.score).filter((s): s is number => s != null);
  const eiScores = evaluated
    .map((c) => c.experienceIntelligenceScore)
    .filter((s): s is number => s != null);

  const avgAiScore = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;
  const avgExperienceIntelligence = eiScores.length
    ? Math.round((eiScores.reduce((a, b) => a + b, 0) / eiScores.length) * 10) / 10
    : null;

  const skillMatches = countSkills(evaluated.map((c) => c.matchedSkills));
  const skillMissing = countSkills(evaluated.map((c) => c.missingSkills));

  const totalSkillRefs = evaluated.reduce(
    (sum, c) => sum + c.matchedSkills.length + c.missingSkills.length,
    0
  );
  const matchedRefs = evaluated.reduce((sum, c) => sum + c.matchedSkills.length, 0);
  const avgSkillMatch =
    totalSkillRefs > 0 ? Math.round((matchedRefs / totalSkillRefs) * 1000) / 10 : null;

  const goodYes = evaluated.filter((c) => c.goodToCall === "YES").length;
  const hiringSuccessPrediction = evaluated.length
    ? Math.round((goodYes / evaluated.length) * 100)
    : null;

  const emailCounts = new Map<string, number>();
  for (const row of emailRows) {
    const email = row.email?.toLowerCase().trim();
    if (!email) continue;
    emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
  }
  const duplicateResumes = [...emailCounts.values()].filter((n) => n > 1).length;

  const deptMap = new Map<string, number>();
  for (const job of jobs) {
    const dept = job.department?.trim() || "Unassigned";
    deptMap.set(dept, (deptMap.get(dept) ?? 0) + job._count.candidates);
  }
  const candidatesByDept = [...deptMap.entries()]
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  const statusLabels: Record<string, string> = {
    YES: "Good to Call",
    MAYBE: "Maybe",
    NO: "Not Now",
    NEEDS_REVIEW: "Needs Review",
  };
  const candidateStatusPie = goodToCallCounts
    .filter((g) => g.goodToCall != null)
    .map((g) => ({
      name: statusLabels[g.goodToCall!] ?? g.goodToCall!,
      value: g._count.id,
      fill: STATUS_COLORS[statusLabels[g.goodToCall!] ?? ""] ?? "#7A8798",
    }));

  const maxSkillCount = skillMatches[0]?.count ?? 1;
  const topSkillsRadar = skillMatches.slice(0, 6).map((s) => ({
    skill: s.skill,
    score: Math.round((s.count / maxSkillCount) * 100),
  }));

  const heatmap = new Map<string, number>();
  for (const c of recentCandidates) {
    const day = DAY_NAMES[c.createdAt.getUTCDay()];
    const hour = c.createdAt.getUTCHours();
    const slot =
      hour < 9
        ? "6a"
        : hour < 12
          ? "9a"
          : hour < 15
            ? "12p"
            : hour < 18
              ? "3p"
              : hour < 21
                ? "6p"
                : "9p";
    const key = `${day}-${slot}`;
    heatmap.set(key, (heatmap.get(key) ?? 0) + 1);
  }
  const maxHeat = Math.max(1, ...heatmap.values());
  const hiringHeatmap = DAY_NAMES.slice(1)
    .concat(DAY_NAMES[0])
    .flatMap((day) =>
      HEATMAP_SLOTS.map((slot) => ({
        day,
        slot,
        value: Math.round(((heatmap.get(`${day}-${slot}`) ?? 0) / maxHeat) * 100),
      }))
    );

  const topTech = skillMatches.slice(0, 6);
  const topTechnologies = topTech.map((s) => ({
    name: s.skill,
    pct: evaluated.length ? Math.round((s.count / evaluated.length) * 100) : 0,
  }));

  const assessmentRows = assessments.filter(
    (a): a is { sentAt: Date } => a.sentAt != null
  );

  return {
    avgAiScore,
    avgExperienceIntelligence,
    avgSkillMatch,
    hiringSuccessPrediction,
    topMatchingSkills: skillMatches.slice(0, 8).map((s) => s.skill),
    topMissingSkills: skillMissing.slice(0, 8).map((s) => s.skill),
    skillFrequency: skillMatches.slice(0, 8),
    topTechnologies,
    duplicateResumes,
    fraudFlags,
    hiringTrend7d: buildTrend(7, (offset) => DAY_NAMES[new Date(utcDayStart(offset)).getUTCDay()], recentCandidates, assessmentRows),
    hiringTrend30d: buildTrend(30, (offset) => `D${30 - offset}`, recentCandidates, assessmentRows),
    hiringTrend90d: buildTrend(12, (offset) => `W${12 - offset}`, recentCandidates, assessmentRows),
    candidatesByDept,
    candidateStatusPie,
    topSkillsRadar,
    hiringHeatmap,
  };
}
