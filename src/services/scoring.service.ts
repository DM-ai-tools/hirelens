import { GoodToCall } from "@prisma/client";
import type { LLMEvaluationResult, MustHaveStats, ScoreBreakdown } from "@/types";
import {
  getVerdictThresholds,
  getScoringWeightsForMinExperience,
  computeExperienceScore,
  countMissingMustHaveRequirements,
  getMustHaveStats,
} from "@/lib/constants";

/**
 * Good to Call (TDD rules — threshold default 70, Maybe band 55–69):
 * - YES: score ≥ threshold AND missingMustHave === 0
 * - MAYBE: score in [threshold−15, threshold−1], OR missingMustHave === 1
 * - NO: score < threshold−15, OR missingMustHave > 1
 *
 * Mandatory recruiter requirements do NOT affect this verdict (score penalty only).
 */
export function computeGoodToCall(
  score: number,
  missingMustHave: number,
  scoreThreshold: number,
  options?: { hasIdentity?: boolean }
): GoodToCall {
  const { good, maybeMin, maybeMax } = getVerdictThresholds(scoreThreshold);

  if (options?.hasIdentity === false) {
    return GoodToCall.NEEDS_REVIEW;
  }

  if (missingMustHave > 1 || score < maybeMin) {
    return GoodToCall.NO;
  }

  if (missingMustHave === 1) {
    return GoodToCall.MAYBE;
  }

  if (score >= maybeMin && score <= maybeMax) {
    return GoodToCall.MAYBE;
  }

  if (score >= good && missingMustHave === 0) {
    return GoodToCall.YES;
  }

  return GoodToCall.NO;
}

export function extractMatchedMustHave(
  llmRaw: unknown,
  mustHaveSkills: string[],
  missingSkills: string[] = []
): string[] {
  if (llmRaw && typeof llmRaw === "object") {
    const matched = (llmRaw as LLMEvaluationResult).matched_must_have;
    if (Array.isArray(matched)) return matched;
  }

  const nonMandatoryGaps = missingSkills.filter((s) => !s.startsWith("Mandatory:"));
  return mustHaveSkills.filter((req) => {
    const options = req
      .split(/\s+or\s+/i)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return !nonMandatoryGaps.some((g) => {
      const gl = g.toLowerCase();
      return options.some((opt) => gl.includes(opt) || opt.includes(gl));
    });
  });
}

/** Single source of truth for must-have stats + Good to Call badge. */
export function resolveCandidateVerdict(
  score: number | null,
  mustHaveSkills: string[],
  scoreThreshold: number,
  options: {
    llmRaw?: unknown;
    missingSkills?: string[];
    hasIdentity?: boolean;
    storedStats?: Pick<MustHaveStats, "totalMustHave" | "matchedMustHave" | "missingMustHave">;
  }
): { stats: MustHaveStats; goodToCall: GoodToCall } {
  const stats =
    options.storedStats != null &&
    options.storedStats.totalMustHave != null &&
    options.storedStats.missingMustHave != null
      ? {
          totalMustHave: options.storedStats.totalMustHave,
          matchedMustHave:
            options.storedStats.matchedMustHave ??
            Math.max(0, options.storedStats.totalMustHave - options.storedStats.missingMustHave),
          missingMustHave: options.storedStats.missingMustHave,
        }
      : getMustHaveStats(
          mustHaveSkills,
          extractMatchedMustHave(
            options.llmRaw,
            mustHaveSkills,
            options.missingSkills ?? []
          )
        );

  if (score == null) {
    return { stats, goodToCall: GoodToCall.NEEDS_REVIEW };
  }

  const goodToCall = computeGoodToCall(score, stats.missingMustHave, scoreThreshold, {
    hasIdentity: options.hasIdentity,
  });

  return { stats, goodToCall };
}

export function computeScore(
  evaluation: LLMEvaluationResult,
  mustHaveSkills: string[],
  niceToHaveSkills: string[],
  minExperience: number,
  scoreThreshold: number,
  mandatoryRequirements?: string | null
): { score: number; breakdown: ScoreBreakdown; goodToCall: GoodToCall } {
  const mustHaveTotal = Math.max(mustHaveSkills.length, 1);
  const niceToHaveTotal = Math.max(niceToHaveSkills.length, 1);
  const weights = getScoringWeightsForMinExperience(minExperience);

  const mustHaveScore =
    (evaluation.matched_must_have.length / mustHaveTotal) * 100;
  const niceToHaveScore =
    (evaluation.matched_nice_to_have.length / niceToHaveTotal) * 100;

  const experienceScore = computeExperienceScore(
    evaluation.relevant_experience_years,
    minExperience
  );

  const domainScore = evaluation.domain_match * 100;
  const roleScore = evaluation.seniority_match * 100;

  const total =
    mustHaveScore * weights.mustHave +
    experienceScore * weights.experience +
    niceToHaveScore * weights.niceToHave +
    domainScore * weights.domain +
    roleScore * weights.role;

  const scoreRaw = Math.round(total * 10) / 10;
  const mandatoryGaps = evaluation.recruiter_mandatory_gaps?.length ?? 0;
  const hasMandatory = Boolean(mandatoryRequirements?.trim());
  const mandatoryFailed = hasMandatory && evaluation.recruiter_mandatory_met === false;

  let score = scoreRaw;
  if (mandatoryFailed) {
    const penalty = Math.min(30, Math.max(10, mandatoryGaps * 12));
    score = Math.max(0, Math.round((scoreRaw - penalty) * 10) / 10);
  }

  const missingMustHave = countMissingMustHaveRequirements(
    mustHaveSkills,
    evaluation.matched_must_have
  );
  const mustHaveStats = getMustHaveStats(mustHaveSkills, evaluation.matched_must_have);

  const goodToCall = computeGoodToCall(score, mustHaveStats.missingMustHave, scoreThreshold, {
    hasIdentity: !!(evaluation.email || evaluation.name),
  });

  return {
    score,
    breakdown: {
      mustHaveScore: Math.round(mustHaveScore * 10) / 10,
      experienceScore: Math.round(experienceScore * 10) / 10,
      niceToHaveScore: Math.round(niceToHaveScore * 10) / 10,
      domainScore: Math.round(domainScore * 10) / 10,
      roleScore: Math.round(roleScore * 10) / 10,
      total: score,
      totalMustHave: mustHaveStats.totalMustHave,
      matchedMustHave: mustHaveStats.matchedMustHave,
      missingMustHave: mustHaveStats.missingMustHave,
    },
    goodToCall,
  };
}

export function rankCandidates<
  T extends { id: string; score: number | null; relevantExperience: number | null; matchedSkills: string[] }
>(candidates: T[]): (T & { rank: number })[] {
  const sorted = [...candidates].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    const expDiff =
      (b.relevantExperience ?? 0) - (a.relevantExperience ?? 0);
    if (expDiff !== 0) return expDiff;
    return (b.matchedSkills?.length ?? 0) - (a.matchedSkills?.length ?? 0);
  });

  let currentRank = 0;
  let lastScore = -1;
  return sorted.map((c, i) => {
    if ((c.score ?? 0) !== lastScore) {
      currentRank = i + 1;
      lastScore = c.score ?? 0;
    }
    return { ...c, rank: currentRank };
  });
}

export function extractSkillsFromText(text: string): string[] {
  const common = [
    "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java",
    "AWS", "Docker", "Kubernetes", "CI/CD", "REST", "GraphQL",
    "PostgreSQL", "MongoDB", "Redis", "Kafka", "Next.js", "Vue",
    "Angular", "SQL", "Git", "Agile", "Scrum", "TensorFlow",
  ];
  const lower = text.toLowerCase();
  return common.filter((s) => lower.includes(s.toLowerCase()));
}
