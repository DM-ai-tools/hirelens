import type { MustHaveStats } from "@/types";

export const BRAND = {
  name: "HireLens",
  company: "DOTMappers IT Pvt Ltd",
  tagline: "AI Candidate Screening",
  phone: "080-31206609",
  email: "contact@dotmappers.in",
} as const;

export const COLORS = {
  navy: "#0B1E3B",
  navy2: "#16294a",
  red: "#C8202A",
  red2: "#E0353D",
  pale: "#FBE9EA",
  ink: "#14202E",
  body: "#3A4858",
  mute: "#7A8798",
  line: "#E5E9F0",
  amber: "#E0A106",
  green: "#1E9E5A",
  bad: "#E24B4A",
  soft: "#F6F8FB",
} as const;

export const SCORING_WEIGHTS = {
  mustHave: 0.4,
  experience: 0.25,
  niceToHave: 0.15,
  domain: 0.1,
  role: 0.1,
} as const;

export type ExperienceTier = {
  min: number | null;
  max: number | null;
  ignoreExperience: boolean;
};

/** Maps landing-page selection to an experience band used in scoring and Claude evaluation. */
export function getExperienceTier(selectedYears: number): ExperienceTier {
  if (selectedYears <= 0) {
    return { min: null, max: null, ignoreExperience: true };
  }
  const tierSteps = [1, 3, 5, 8] as const;
  const min = selectedYears;
  const idx = tierSteps.indexOf(selectedYears as (typeof tierSteps)[number]);
  const next = idx >= 0 ? tierSteps[idx + 1] : undefined;
  return { min, max: next ?? null, ignoreExperience: false };
}

export function getScoringWeightsForMinExperience(minExperience: number) {
  const tier = getExperienceTier(minExperience);
  if (!tier.ignoreExperience) {
    return { ...SCORING_WEIGHTS };
  }
  const withoutExp = 1 - SCORING_WEIGHTS.experience;
  const scale = 1 / withoutExp;
  return {
    mustHave: SCORING_WEIGHTS.mustHave * scale,
    experience: 0,
    niceToHave: SCORING_WEIGHTS.niceToHave * scale,
    domain: SCORING_WEIGHTS.domain * scale,
    role: SCORING_WEIGHTS.role * scale,
  };
}

/** 0–100 experience component; fresher roles always score 100 on this axis. */
export function computeExperienceScore(
  relevantYears: number,
  minExperience: number
): number {
  const tier = getExperienceTier(minExperience);
  if (tier.ignoreExperience) return 100;

  const years = Math.max(0, relevantYears);
  const { min, max } = tier;

  if (min != null && years < min) {
    return Math.round(Math.max(0, years / min) * 1000) / 10;
  }
  if (max != null && years >= max) {
    const excess = years - max;
    const penalty = Math.min(0.6, excess * 0.12);
    return Math.round(Math.max(20, (1 - penalty) * 100) * 10) / 10;
  }
  return 100;
}

/** Whether relevant experience fits the band chosen on the landing form. */
export function meetsExperienceRequirement(
  relevantYears: number,
  minExperience: number
): boolean {
  const tier = getExperienceTier(minExperience);
  if (tier.ignoreExperience) return true;

  const years = Math.max(0, relevantYears);
  if (tier.min != null && years < tier.min) return false;
  if (tier.max != null && years >= tier.max) return false;
  return true;
}

export function buildExperienceEvaluationGuidance(minExperience: number): string {
  const tier = getExperienceTier(minExperience);
  if (tier.ignoreExperience) {
    return `Experience requirement: FRESHER / entry-level (0 years required).
- Do NOT penalize candidates for zero or limited professional experience.
- relevant_experience_years should still be estimated honestly from the resume.
- seniority_match should reflect skill and project fit, NOT years in industry.`;
  }
  const maxLine =
    tier.max != null
      ? `- Ideal relevant experience band: ${tier.min} to under ${tier.max} years for this role tier.
- Candidates with ${tier.max}+ years relevant experience are overqualified for this selection.`
      : `- Minimum relevant experience: ${tier.min}+ years.`;
  return `Experience requirement: ${tier.min}+ years (user-selected tier on screening form).
- Only count experience in roles relevant to this JD.
- ${maxLine}
- Do not require more experience than this tier specifies.`;
}

/** Gap below shortlist threshold used for "Maybe" verdict band */
export const MAYBE_THRESHOLD_OFFSET = 15;

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export function getModelDisplayName(model = ANTHROPIC_MODEL): string {
  if (model.includes("haiku-4-5") || model.includes("haiku-4.5")) return "Claude Haiku 4.5";
  if (model.includes("sonnet")) return "Claude Sonnet";
  if (model.includes("opus")) return "Claude Opus";
  if (model.includes("haiku")) return "Claude Haiku";
  return model;
}

export function formatMinExperience(years: number, short = false): string {
  if (years <= 0) return "Fresher";
  const tier = getExperienceTier(years);
  if (tier.max != null) {
    return short
      ? `${years}–<${tier.max} yrs`
      : `${years} to under ${tier.max} years`;
  }
  return short ? `${years}+ yrs` : `${years}+ years`;
}

export function getVerdictThresholds(scoreThreshold: number) {
  const good = scoreThreshold;
  const maybeMin = Math.max(0, scoreThreshold - MAYBE_THRESHOLD_OFFSET);
  const maybeMax = good - 1;
  return { good, maybeMin, maybeMax };
}

/** Synonym families for fuzzy must-have matching when AI uses equivalent labels. */
const SKILL_SYNONYM_GROUPS: string[][] = [
  ["sql", "mysql", "mariadb", "postgresql", "postgres", "sqlite", "mssql", "t-sql", "pl/sql"],
  ["javascript", "js", "typescript", "ts", "node.js", "nodejs"],
  ["react", "reactjs", "react.js", "next.js", "nextjs"],
  ["python", "django", "flask", "fastapi"],
  ["java", "spring", "spring boot"],
  ["aws", "amazon web services"],
  ["docker", "kubernetes", "k8s"],
  ["machine learning", "ml", "deep learning", "pytorch", "tensorflow"],
  ["claude", "anthropic"],
];

function skillTokensMatch(a: string, b: string): boolean {
  const left = a.toLowerCase().trim();
  const right = b.toLowerCase().trim();
  if (!left || !right) return false;
  if (left.includes(right) || right.includes(left)) return true;

  for (const group of SKILL_SYNONYM_GROUPS) {
    const leftIn = group.some((g) => left.includes(g) || g.includes(left));
    const rightIn = group.some((g) => right.includes(g) || g.includes(right));
    if (leftIn && rightIn) return true;
  }
  return false;
}

/** Count JD must-have rows not satisfied (handles "PyTorch or TensorFlow" as one requirement). */
export function countMissingMustHaveRequirements(
  mustHaveSkills: string[],
  matchedMustHave: string[]
): number {
  if (mustHaveSkills.length === 0) return 0;

  let missing = 0;

  for (const req of mustHaveSkills) {
    const options = req
      .split(/\s+or\s+/i)
      .map((s) => s.trim())
      .filter(Boolean);

    const satisfied = options.some((opt) =>
      matchedMustHave.some((m) => skillTokensMatch(m, opt))
    );

    if (!satisfied) missing++;
  }

  return missing;
}

export function getMustHaveStats(
  mustHaveSkills: string[],
  matchedMustHave: string[]
): MustHaveStats {
  const totalMustHave = mustHaveSkills.length;
  const missingMustHave = countMissingMustHaveRequirements(mustHaveSkills, matchedMustHave);
  const matchedCount = Math.max(0, totalMustHave - missingMustHave);
  return { totalMustHave, matchedMustHave: matchedCount, missingMustHave };
}

export function getMissingMustHaveLabels(
  mustHaveSkills: string[],
  matchedMustHave: string[]
): string[] {
  if (mustHaveSkills.length === 0) return [];

  return mustHaveSkills.filter((req) => {
    const options = req
      .split(/\s+or\s+/i)
      .map((s) => s.trim())
      .filter(Boolean);
    return !options.some((opt) =>
      matchedMustHave.some((m) => skillTokensMatch(m, opt))
    );
  });
}

export const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
export const REPORT_DIR = process.env.REPORT_DIR || "./reports";
