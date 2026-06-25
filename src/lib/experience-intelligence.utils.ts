import type {
  CompanyExperienceDetail,
  ExperienceIntelligenceBreakdown,
  ExperienceIntelligenceResult,
  ExperienceRoleTimeline,
} from "@/types";

const EDUCATION_PATTERNS = [
  /\b(university|college|institute of technology|polytechnic|school of)\b/i,
  /\b(iit|nit|iiit|bits)\b/i,
  /\b(b\.?\s*e\.?|b\.?\s*tech|bachelor|master|mba|m\.?\s*tech|ph\.?\s*d)\b/i,
  /\(student\)/i,
  /\bstudent\b/i,
  /\bcmrit\b/i,
  /\bcmr\s+institute\b/i,
];

/** True when the entry is education, not paid employment. */
export function isEducationEntry(companyName: string, role?: string): boolean {
  const text = `${companyName} ${role ?? ""}`.trim();
  if (!text || text === "—") return false;
  return EDUCATION_PATTERNS.some((re) => re.test(text));
}

export function filterProfessionalCompanies(
  companies: CompanyExperienceDetail[]
): CompanyExperienceDetail[] {
  return companies.filter((c) => !isEducationEntry(c.companyName, c.role));
}

export function filterProfessionalTimeline(
  timeline: ExperienceRoleTimeline[]
): ExperienceRoleTimeline[] {
  return timeline.filter((t) => !isEducationEntry(t.company, t.role));
}

export function resolveCurrentEmployer(ei: ExperienceIntelligenceResult): {
  company: string;
  role: string;
} {
  const fromCompanies = filterProfessionalCompanies(ei.companies);
  if (fromCompanies[0]) {
    return { company: fromCompanies[0].companyName, role: fromCompanies[0].role };
  }

  if (!isEducationEntry(ei.currentCompany, ei.currentRole)) {
    return { company: ei.currentCompany, role: ei.currentRole };
  }

  const fromTimeline = filterProfessionalTimeline(ei.previousRolesTimeline);
  if (fromTimeline[0]) {
    return { company: fromTimeline[0].company, role: fromTimeline[0].role };
  }

  return { company: "—", role: "—" };
}

export const AGENCY_BADGE_TYPES = [
  "Digital Marketing Agency",
  "Performance Marketing Agency",
  "Advertising Agency",
  "Growth Marketing Agency",
  "SEO Agency",
  "Paid Media Agency",
] as const;

export type AgencyBadgeType = (typeof AGENCY_BADGE_TYPES)[number];

const AGENCY_DETECTION_PATTERNS: [RegExp, AgencyBadgeType][] = [
  [/digital marketing agency|dm agency/i, "Digital Marketing Agency"],
  [/performance marketing agency/i, "Performance Marketing Agency"],
  [/advertising agency|ad agency/i, "Advertising Agency"],
  [/growth marketing agency/i, "Growth Marketing Agency"],
  [/seo agency/i, "SEO Agency"],
  [/paid media agency/i, "Paid Media Agency"],
];

/** Detect agency type from free text (legacy helper — prefer detectAgencyTypeFromCompanyProfile). */
export function detectAgencyTypeFromText(text: string): AgencyBadgeType | null {
  if (!text?.trim()) return null;
  for (const [re, type] of AGENCY_DETECTION_PATTERNS) {
    if (re.test(text)) return type;
  }
  if (/marketing agency|media agency/i.test(text)) {
    return "Digital Marketing Agency";
  }
  return null;
}

const MIN_FETCHED_PROFILE_CHARS = 12;

function isValidFetchedProfileText(value: string): boolean {
  return !!value && value !== "—" && value.length >= MIN_FETCHED_PROFILE_CHARS;
}

/** True when web-search employer description is present (required before agency classification). */
export function hasFetchedCompanyProfile(company: CompanyExperienceDetail): boolean {
  const desc = cleanCompanyProfileText(company.companyDescription);
  const what = cleanCompanyProfileText(company.whatCompanyDoes);
  return isValidFetchedProfileText(desc) || isValidFetchedProfileText(what);
}

/** Classify agency type from fetched company description / services text only. */
export function classifyAgencyFromCompanyDescription(text: string): AgencyBadgeType | null {
  if (!text?.trim()) return null;
  const t = text.toLowerCase();

  if (/performance marketing agency/.test(t)) return "Performance Marketing Agency";
  if (/digital marketing agency|digital advertising agency/.test(t)) return "Digital Marketing Agency";
  if (/\badvertising agency\b|\bad agency\b/.test(t)) return "Advertising Agency";
  if (/growth marketing agency/.test(t)) return "Growth Marketing Agency";
  if (/\bseo agency\b|search engine optimization agency/.test(t)) return "SEO Agency";
  if (/paid media agency/.test(t)) return "Paid Media Agency";

  const mentionsAgency =
    /\b(agency|agencies)\b/.test(t) ||
    /\bmarketing firm\b/.test(t) ||
    /\badvertising firm\b/.test(t);
  const marketingServices =
    /digital marketing|digital advertising|performance marketing|advertising|marketing services|seo|ppc|paid media|\bsem\b|social media marketing|media buying|campaign management/.test(
      t
    );

  if (mentionsAgency && marketingServices) return "Digital Marketing Agency";

  return null;
}

/** Agency badge for one employer — only after fetched description exists. */
export function detectAgencyTypeFromCompanyProfile(
  company: CompanyExperienceDetail
): AgencyBadgeType | null {
  if (!hasFetchedCompanyProfile(company)) return null;

  const profileText = cleanCompanyProfileText(
    [company.companyDescription, company.whatCompanyDoes, company.industry].join(" ")
  );
  return classifyAgencyFromCompanyDescription(profileText);
}

export interface AgencyCompanyMatch {
  badgeType: AgencyBadgeType;
  company: CompanyExperienceDetail;
}

/** Pick the most recent employer whose fetched profile confirms marketing-agency category. */
export function resolveAgencyFromEnrichedCompanies(
  companies: CompanyExperienceDetail[]
): AgencyCompanyMatch | null {
  for (const company of filterProfessionalCompanies(companies).map(enrichCompanyProfile)) {
    const badgeType = detectAgencyTypeFromCompanyProfile(company);
    if (badgeType) return { badgeType, company };
  }
  return null;
}

/** Normalize LLM agency labels (used only when merging with fetched profile analysis). */
export function normalizeAgencyBadgeType(type: string | null | undefined): AgencyBadgeType | null {
  if (!type?.trim()) return null;
  const trimmed = type.trim();
  const exact = AGENCY_BADGE_TYPES.find((t) => t.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  const detected = detectAgencyTypeFromText(trimmed);
  if (detected) return detected;

  for (const badge of AGENCY_BADGE_TYPES) {
    const keyword = badge.toLowerCase().replace(/ agency$/, "");
    if (trimmed.toLowerCase().includes(keyword)) return badge;
  }
  return null;
}

const EI_SCORE_WEIGHTS = {
  relevantRoleExperience: 0.35,
  businessImpact: 0.2,
  technicalComplexity: 0.15,
  leadershipOwnership: 0.1,
  companyRelevance: 0.1,
  yearsExperience: 0.1,
} as const;

function clampExperienceScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function applyAgencyJdBoostToBreakdown(
  breakdown: ExperienceIntelligenceBreakdown,
  jdRelevant: boolean
): ExperienceIntelligenceBreakdown {
  if (!jdRelevant) return breakdown;
  return {
    ...breakdown,
    companyRelevance: clampExperienceScore(breakdown.companyRelevance + 10),
    relevantRoleExperience: clampExperienceScore(breakdown.relevantRoleExperience + 5),
  };
}

export function computeExperienceIntelligenceScoreFromBreakdown(
  breakdown: ExperienceIntelligenceBreakdown
): number {
  const score =
    breakdown.relevantRoleExperience * EI_SCORE_WEIGHTS.relevantRoleExperience +
    breakdown.businessImpact * EI_SCORE_WEIGHTS.businessImpact +
    breakdown.technicalComplexity * EI_SCORE_WEIGHTS.technicalComplexity +
    breakdown.leadershipOwnership * EI_SCORE_WEIGHTS.leadershipOwnership +
    breakdown.companyRelevance * EI_SCORE_WEIGHTS.companyRelevance +
    breakdown.yearsExperience * EI_SCORE_WEIGHTS.yearsExperience;
  return clampExperienceScore(score);
}

/** Set agency badge only after enriched employer profiles; optionally apply JD boost to score. */
export function resolveAgencyBadgeForResult(
  ei: ExperienceIntelligenceResult,
  options?: {
    job?: { title: string; jdText: string };
    recalculateScore?: boolean;
  }
): ExperienceIntelligenceResult {
  const companies = filterProfessionalCompanies(ei.companies).map(enrichCompanyProfile);
  const previousRolesTimeline = filterProfessionalTimeline(ei.previousRolesTimeline);
  const agency = resolveAgencyFromEnrichedCompanies(companies);
  const employer = resolveCurrentEmployer({ ...ei, companies, previousRolesTimeline });

  const jdRelevant = options?.job
    ? isJdMarketingRelevant(options.job.jdText, options.job.title)
    : Boolean(ei.agencyRelevantToJd);

  let breakdown = ei.breakdown;
  let score = ei.score;

  if (agency && options?.recalculateScore) {
    breakdown = applyAgencyJdBoostToBreakdown(breakdown, jdRelevant);
    score = computeExperienceIntelligenceScoreFromBreakdown(breakdown);
  }

  const agencyExperience = agency
    ? {
        agencyName: agency.company.companyName,
        agencyType: agency.badgeType,
        role: agency.company.role,
        responsibilities: agency.company.keyResponsibilities.slice(0, 6),
        campaignTypes: [] as string[],
        platforms: agency.company.technologies.slice(0, 8),
        benefitsForRole:
          ei.agencyExperience?.benefitsForRole ||
          "Agency experience may strengthen adaptability and client-facing delivery for marketing roles.",
      }
    : null;

  return {
    ...ei,
    companies,
    previousRolesTimeline,
    currentCompany: employer.company,
    currentRole: employer.role,
    breakdown,
    score,
    hasAgencyExperience: !!agency,
    agencyBadgeType: agency?.badgeType ?? null,
    agencyRelevantToJd: !!agency && jdRelevant,
    agencyExperience,
    overallRecommendation: deriveExperienceRecommendation(score),
  };
}

export function isJdMarketingRelevant(jdText: string, title: string): boolean {
  const t = `${title} ${jdText}`.toLowerCase();
  return /marketing|seo|sem|ppc|paid media|advertising|growth marketing|digital marketing|performance marketing|agency|social media|meta ads|google ads|campaign|brand|content marketing/.test(
    t
  );
}

export function normalizeCompanyUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed === "—" || trimmed.toLowerCase() === "unknown") return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/\//, "")}`;
}

/** Strip web-search citation markup and HTML from employer profile text fields. */
export function cleanCompanyProfileText(text: string | null | undefined): string {
  if (!text?.trim()) return text?.trim() ?? "";

  let cleaned = text;
  // Anthropic web search citations: <cite index="1-1">...</cite>
  cleaned = cleaned.replace(/<cite[^>]*>([\s\S]*?)<\/cite>/gi, "$1");
  // Any remaining HTML/XML tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");
  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return cleaned.replace(/\s+/g, " ").trim();
}

function cleanProfileField(value: string): string {
  const cleaned = cleanCompanyProfileText(value);
  return cleaned || "—";
}

/** EI recommendation bands — always derived from computed score, not LLM text. */
export const EI_RECOMMENDATION_THRESHOLDS = {
  STRONG_HIRE: 75,
  GOOD_POTENTIAL: 55,
  CONSIDER: 35,
} as const;

export function deriveExperienceRecommendation(score: number): string {
  if (score >= EI_RECOMMENDATION_THRESHOLDS.STRONG_HIRE) return "Strong hire";
  if (score >= EI_RECOMMENDATION_THRESHOLDS.GOOD_POTENTIAL) return "Good potential";
  if (score >= EI_RECOMMENDATION_THRESHOLDS.CONSIDER) return "Consider";
  return "Weak fit";
}

export function extractCompanyDomain(
  companyUrl: string | null | undefined,
  explicitDomain?: string | null
): string | null {
  const explicit = explicitDomain?.trim();
  if (explicit && explicit !== "—") {
    return explicit.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0] || null;
  }
  if (!companyUrl) return null;
  try {
    const host = new URL(companyUrl).hostname.replace(/^www\./i, "");
    return host || null;
  } catch {
    const bare = companyUrl.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
    return bare && bare.includes(".") ? bare : null;
  }
}

export function enrichCompanyProfile(company: CompanyExperienceDetail): CompanyExperienceDetail {
  const companyUrl = normalizeCompanyUrl(company.companyUrl);
  const companyDomain = extractCompanyDomain(companyUrl, company.companyDomain);
  return {
    ...company,
    industry: cleanProfileField(company.industry),
    companyDescription: cleanProfileField(company.companyDescription),
    whatCompanyDoes: cleanProfileField(company.whatCompanyDoes),
    companyUrl,
    companyDomain,
  };
}

/** Align recommendation with score, filter education, resolve agency badge from fetched profiles. */
export function finalizeExperienceIntelligenceResult(
  ei: ExperienceIntelligenceResult
): ExperienceIntelligenceResult {
  return resolveAgencyBadgeForResult(ei);
}

/** Re-filter stored EI data (e.g. older runs that included colleges as companies). */
export function sanitizeExperienceIntelligence(
  ei: ExperienceIntelligenceResult
): ExperienceIntelligenceResult {
  return finalizeExperienceIntelligenceResult(ei);
}

export function sortCandidatesByExperienceIntelligenceScore<
  T extends { experienceIntelligenceScore: number | null }
>(candidates: T[]): T[] {
  return [...candidates].sort(
    (a, b) => (b.experienceIntelligenceScore ?? -1) - (a.experienceIntelligenceScore ?? -1)
  );
}
