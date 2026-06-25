import { sanitizeExperienceIntelligence } from "@/lib/experience-intelligence.utils";
import { resolveCandidateVerdict } from "@/services/scoring.service";
import type { ExperienceIntelligenceResult, ParsedResume, ScoreBreakdown } from "@/types";
import type { AdminCandidateRow } from "@/app/admin/candidates/candidates-client";

type CandidateRecord = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  resumeFileName: string;
  rawText: string | null;
  parsedData: unknown;
  overallExperience: number | null;
  relevantExperience: number | null;
  strengths: string[];
  missingSkills: string[];
  matchedSkills: string[];
  score: number | null;
  rank: number | null;
  status: string;
  goodToCall: string | null;
  scoreBreakdown: unknown;
  aiRationale: string | null;
  llmRaw: unknown;
  experienceIntelligenceScore: number | null;
  experienceIntelligenceData: unknown;
  job: {
    id: string;
    title: string;
    mustHaveSkills: string[];
    scoreThreshold: number;
  };
  assessmentSends: Array<{
    status: string;
    sentAt: Date | null;
    assessment: { name: string };
  }>;
};

function nameFromFile(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function experienceFromParsed(parsed: ParsedResume | null) {
  if (!parsed?.experience?.length) return { overall: null as number | null, relevant: null as number | null };
  const overall = parsed.experience.reduce((sum, e) => sum + (e.years || 0), 0);
  const relevant = parsed.experience[0]?.years ?? null;
  return { overall: overall > 0 ? overall : null, relevant };
}

export function mapAdminCandidateRow(c: CandidateRecord): AdminCandidateRow {
  const parsed = (c.parsedData as ParsedResume | null) ?? null;
  const ei = c.experienceIntelligenceData
    ? sanitizeExperienceIntelligence(c.experienceIntelligenceData as ExperienceIntelligenceResult)
    : null;
  const employer = ei?.companies?.[0];
  const expFromParsed = experienceFromParsed(parsed);
  const exp0 = parsed?.experience?.[0];

  const displayName =
    c.name?.trim() ||
    parsed?.name?.trim() ||
    nameFromFile(c.resumeFileName) ||
    "Unknown";

  const { goodToCall } = resolveCandidateVerdict(
    c.score,
    c.job.mustHaveSkills,
    c.job.scoreThreshold,
    {
      llmRaw: c.llmRaw,
      missingSkills: c.missingSkills,
      hasIdentity: !!(c.email || c.name || parsed?.email || parsed?.name),
      storedStats: (c.scoreBreakdown as ScoreBreakdown) ?? undefined,
    }
  );

  const latestSend = c.assessmentSends[0];

  return {
    id: c.id,
    jobId: c.job.id,
    name: displayName,
    email: c.email ?? parsed?.email ?? null,
    phone: c.phone ?? parsed?.phone ?? null,
    resumeFileName: c.resumeFileName,
    score: c.score,
    rank: c.rank,
    status: c.status,
    goodToCall: c.goodToCall ?? goodToCall,
    jobTitle: c.job.title,
    currentCompany: employer?.companyName ?? ei?.currentCompany ?? exp0?.company ?? null,
    currentRole: employer?.role ?? ei?.currentRole ?? exp0?.role ?? null,
    overallExperience: c.overallExperience ?? expFromParsed.overall,
    relevantExperience: c.relevantExperience ?? expFromParsed.relevant,
    experienceIntelligenceScore: c.experienceIntelligenceScore,
    assessmentStatus: latestSend?.status ?? "Not sent",
    strengths: c.strengths.length ? c.strengths : parsed?.skills?.slice(0, 8) ?? [],
    missingSkills: c.missingSkills,
    matchedSkills: c.matchedSkills.length ? c.matchedSkills : parsed?.skills?.slice(0, 8) ?? [],
    aiRationale: c.aiRationale,
    resumePreview: c.rawText?.slice(0, 2500) ?? parsed?.rawText?.slice(0, 2500) ?? null,
    experienceIntelligence: ei,
    assessmentHistory: c.assessmentSends.map((s) => ({
      name: s.assessment.name,
      status: s.status,
      sentAt: s.sentAt?.toISOString() ?? null,
    })),
  };
}
