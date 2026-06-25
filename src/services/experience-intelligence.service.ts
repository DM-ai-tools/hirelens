import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODEL } from "@/lib/constants";
import {
  computeExperienceIntelligenceScoreFromBreakdown,
  deriveExperienceRecommendation,
  enrichCompanyProfile,
  extractCompanyDomain,
  filterProfessionalCompanies,
  filterProfessionalTimeline,
  finalizeExperienceIntelligenceResult,
  isEducationEntry,
  normalizeCompanyUrl,
  resolveAgencyBadgeForResult,
} from "@/lib/experience-intelligence.utils";
import { hasAnthropicApiKey, requireAnthropicApiKey } from "@/lib/anthropic-config";
import { enrichExperienceIntelligenceCompanies } from "./company-enrichment.service";
import type {
  ExperienceIntelligenceBreakdown,
  ExperienceIntelligenceResult,
  CompanyExperienceDetail,
  ParsedResume,
} from "@/types";

const SYSTEM_PROMPT = `You are an expert talent analyst evaluating the QUALITY of a candidate's professional experience — separate from skill-match against a job description.

Score experience intelligence based on:
- Relevance of previous roles to the hiring role (35% weight — highest)
- Business impact described (20%)
- Technical complexity of work (15%)
- Leadership / ownership responsibilities (10%)
- Company relevance to the hiring context (10%)
- Years of experience (10% — lowest weight; do NOT over-reward tenure alone)

Return ONLY valid JSON matching this schema:
{
  "breakdown": {
    "relevantRoleExperience": 0,
    "businessImpact": 0,
    "technicalComplexity": 0,
    "leadershipOwnership": 0,
    "companyRelevance": 0,
    "yearsExperience": 0
  },
  "scoreRationale": "string — 2-4 sentences explaining the overall score",
  "currentCompany": "string",
  "currentRole": "string",
  "industry": "string",
  "experienceLevel": "Junior|Mid|Senior|Lead|Principal|Executive",
  "companyRating": "Exceptional|Strong|Moderate|Limited|Unknown",
  "impactRating": "High|Medium|Low",
  "hasAgencyExperience": false,
  "agencyBadgeType": "string|null — one of: Digital Marketing Agency, Performance Marketing Agency, Advertising Agency, Growth Marketing Agency, SEO Agency, Paid Media Agency",
  "overallRecommendation": "ignored — computed server-side from EI score",
  "aiExperienceSummary": "string — 3-5 sentence narrative of career trajectory",
  "hiringValue": {
    "whyValuable": "string",
    "experienceTransfer": "string",
    "businessValue": "string",
    "technicalStrengths": ["string"],
    "potentialRisks": ["string"],
    "interviewFocus": ["string"]
  },
  "agencyExperience": null or {
    "agencyName": "string",
    "agencyType": "string",
    "role": "string",
    "responsibilities": ["string"],
    "campaignTypes": ["string"],
    "platforms": ["string — e.g. Google Ads, Meta Ads, LinkedIn Ads, SEO, Analytics, Tag Manager, GA4, HubSpot, CRM, Marketing Automation"],
    "benefitsForRole": "string"
  },
  "companies": [{
    "companyName": "string — employer name only, NOT a college or university",
    "industry": "string",
    "companyDescription": "string — 1-2 sentence overview of the employer",
    "whatCompanyDoes": "string — products, services, or market focus",
    "role": "string — candidate's job title at this employer",
    "duration": "string — e.g. Jan 2022 – Present or 2 years",
    "companyUrl": "string|null — official website URL when known",
    "companyDomain": "string|null — bare domain e.g. dotmappers.in (no https)",
    "keyResponsibilities": ["string"],
    "projects": ["string"],
    "technologies": ["string"],
    "businessImpact": "string",
    "achievements": ["string"],
    "leadershipResponsibilities": ["string"],
    "relevantSkillsGained": ["string"],
    "valueForHiringRole": "string"
  }],
  "previousRolesTimeline": [{
    "role": "string",
    "company": "string",
    "duration": "string",
    "order": 1
  }]
}

RULES:
- Each breakdown dimension is 0-100 (integer or one decimal).
- Do NOT invent employers or roles not evidenced in the resume.
- EMPLOYERS ONLY: colleges, universities, institutes of technology, and student/education entries are NOT companies. Never list them in companies[], previousRolesTimeline[], currentCompany, or agencyName.
- currentCompany / currentRole must reflect the most recent PAID professional employer (not education).
- Agency gold badge is assigned server-side ONLY after employer descriptions are fetched via web search — always leave hasAgencyExperience=false and agencyBadgeType=null.
- companies: include up to 5 most relevant PROFESSIONAL employers, most recent first.
- For each company: companyName, role, duration, and all candidate-specific fields (responsibilities, projects, technologies, achievements) MUST come from the resume only.
- industry, companyDescription, whatCompanyDoes, companyUrl, companyDomain: use "—" or null — these are filled via web search after this step.
- previousRolesTimeline: professional roles only, order 1 = most recent.`;

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function computeExperienceIntelligenceScore(
  breakdown: ExperienceIntelligenceBreakdown
): number {
  return computeExperienceIntelligenceScoreFromBreakdown(breakdown);
}

function normalizeBreakdown(raw: Partial<ExperienceIntelligenceBreakdown>): ExperienceIntelligenceBreakdown {
  return {
    relevantRoleExperience: clampScore(raw.relevantRoleExperience ?? 0),
    businessImpact: clampScore(raw.businessImpact ?? 0),
    technicalComplexity: clampScore(raw.technicalComplexity ?? 0),
    leadershipOwnership: clampScore(raw.leadershipOwnership ?? 0),
    companyRelevance: clampScore(raw.companyRelevance ?? 0),
    yearsExperience: clampScore(raw.yearsExperience ?? 0),
  };
}

function normalizeCompany(raw: Record<string, unknown>): CompanyExperienceDetail {
  const companyUrl = normalizeCompanyUrl(raw.companyUrl as string | null);
  const companyDomain = extractCompanyDomain(
    companyUrl,
    raw.companyDomain as string | null
  );
  return enrichCompanyProfile({
    companyName: String(raw.companyName ?? "—"),
    industry: String(raw.industry ?? "—"),
    companyDescription: String(raw.companyDescription ?? "—"),
    whatCompanyDoes: String(raw.whatCompanyDoes ?? "—"),
    role: String(raw.role ?? "—"),
    duration: String(raw.duration ?? "—"),
    companyUrl,
    companyDomain,
    keyResponsibilities: Array.isArray(raw.keyResponsibilities) ? (raw.keyResponsibilities as string[]) : [],
    projects: Array.isArray(raw.projects) ? (raw.projects as string[]) : [],
    technologies: Array.isArray(raw.technologies) ? (raw.technologies as string[]) : [],
    businessImpact: String(raw.businessImpact ?? ""),
    achievements: Array.isArray(raw.achievements) ? (raw.achievements as string[]) : [],
    leadershipResponsibilities: Array.isArray(raw.leadershipResponsibilities)
      ? (raw.leadershipResponsibilities as string[])
      : [],
    relevantSkillsGained: Array.isArray(raw.relevantSkillsGained)
      ? (raw.relevantSkillsGained as string[])
      : [],
    valueForHiringRole: String(raw.valueForHiringRole ?? ""),
  });
}

function buildResultFromLlm(
  parsed: Record<string, unknown>,
  job?: { title: string; jdText: string }
): ExperienceIntelligenceResult {
  const breakdown = normalizeBreakdown(
    (parsed.breakdown as Partial<ExperienceIntelligenceBreakdown>) ?? {}
  );
  const score = computeExperienceIntelligenceScore(breakdown);

  const hiringValue = (parsed.hiringValue as ExperienceIntelligenceResult["hiringValue"]) ?? {
    whyValuable: "",
    experienceTransfer: "",
    businessValue: "",
    technicalStrengths: [],
    potentialRisks: [],
    interviewFocus: [],
  };

  const rawCompanies = Array.isArray(parsed.companies)
    ? (parsed.companies as Record<string, unknown>[]).map(normalizeCompany)
    : [];
  const companies = filterProfessionalCompanies(rawCompanies);

  const rawTimeline = Array.isArray(parsed.previousRolesTimeline)
    ? (parsed.previousRolesTimeline as ExperienceIntelligenceResult["previousRolesTimeline"])
    : [];
  const previousRolesTimeline = filterProfessionalTimeline(rawTimeline);

  const currentFromCompanies = companies[0];
  const parsedCurrentCompany = String(parsed.currentCompany ?? "—");
  const parsedCurrentRole = String(parsed.currentRole ?? "—");
  const currentCompany = currentFromCompanies
    ? currentFromCompanies.companyName
    : isEducationEntry(parsedCurrentCompany, parsedCurrentRole)
      ? previousRolesTimeline[0]?.company ?? "—"
      : parsedCurrentCompany;
  const currentRole = currentFromCompanies
    ? currentFromCompanies.role
    : isEducationEntry(parsedCurrentCompany, parsedCurrentRole)
      ? previousRolesTimeline[0]?.role ?? "—"
      : parsedCurrentRole;

  return finalizeExperienceIntelligenceResult({
    score,
    breakdown,
    scoreRationale: String(parsed.scoreRationale ?? "Experience evaluated against role requirements."),
    currentCompany,
    currentRole,
    industry: String(parsed.industry ?? "—"),
    experienceLevel: String(parsed.experienceLevel ?? "Mid"),
    companyRating: String(parsed.companyRating ?? "Moderate"),
    impactRating: String(parsed.impactRating ?? "Medium"),
    hasAgencyExperience: false,
    agencyBadgeType: null,
    agencyRelevantToJd: false,
    overallRecommendation: deriveExperienceRecommendation(score),
    aiExperienceSummary: String(parsed.aiExperienceSummary ?? ""),
    hiringValue: {
      whyValuable: hiringValue.whyValuable ?? "",
      experienceTransfer: hiringValue.experienceTransfer ?? "",
      businessValue: hiringValue.businessValue ?? "",
      technicalStrengths: hiringValue.technicalStrengths ?? [],
      potentialRisks: hiringValue.potentialRisks ?? [],
      interviewFocus: hiringValue.interviewFocus ?? [],
    },
    agencyExperience: null,
    companies,
    previousRolesTimeline,
  });
}

export async function evaluateExperienceIntelligence(
  resumeText: string,
  parsedData: ParsedResume | null,
  job: { title: string; jdText: string; mustHaveSkills: string[]; mandatoryRequirements?: string | null }
): Promise<ExperienceIntelligenceResult> {
  const apiKey = await requireAnthropicApiKey();
  const client = new Anthropic({ apiKey });

  const mandatory = job.mandatoryRequirements?.trim() ?? "";

  const parsedContext = parsedData
    ? `\nPARSED STRUCTURE (use as hints, verify against resume):\n${JSON.stringify(
        {
          experience: parsedData.experience,
          skills: parsedData.skills?.slice(0, 20),
          projects: parsedData.projects?.slice(0, 5),
        },
        null,
        2
      )}`
    : "";

  const userPrompt = `HIRING ROLE: ${job.title}
MUST-HAVE SKILLS: ${job.mustHaveSkills.join(", ") || "See JD"}
${mandatory ? `\nRECRUITER MANDATORY REQUIREMENTS (factor into relevance scoring — not auto-disqualify unless clearly unmet):\n${mandatory.slice(0, 2000)}\n` : ""}
JOB DESCRIPTION:
${job.jdText.slice(0, 3500)}
${parsedContext}

RESUME:
${resumeText.slice(0, 9000)}`;

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    temperature: 0.15,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected LLM response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Experience intelligence LLM did not return valid JSON");

  const result = buildResultFromLlm(JSON.parse(jsonMatch[0]) as Record<string, unknown>, job);

  try {
    return await enrichExperienceIntelligenceCompanies(result, apiKey, job);
  } catch (error) {
    console.warn("[EI] Company web search enrichment failed, using resume-only profiles:", error);
    return result;
  }
}

export function evaluateExperienceIntelligenceMock(
  resumeText: string,
  parsedData: ParsedResume | null,
  job: { title: string; jdText?: string }
): ExperienceIntelligenceResult {
  const lower = resumeText.toLowerCase();
  const yearsMatch = resumeText.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);
  const years = yearsMatch ? parseFloat(yearsMatch[1]) : 3;
  const exp = (parsedData?.experience ?? []).filter(
    (e) => !isEducationEntry(e.company, e.role)
  );
  const current = exp[0];

  const relevantBoost = job.title.split(" ").some((w) => lower.includes(w.toLowerCase())) ? 15 : 0;

  const companies: ExperienceIntelligenceResult["companies"] =
    exp.length > 0
      ? exp.slice(0, 4).map((e) => {
          const isDotMappers = e.company?.toLowerCase().includes("dotmapper");
          return {
            companyName: e.company || "Company",
            industry: isDotMappers ? "Digital Marketing / Advertising" : "Technology / Services",
            companyDescription: isDotMappers
              ? "DotMappers IT Pvt Ltd is a Bangalore based Digital Advertising Agency."
              : "—",
            whatCompanyDoes: isDotMappers
              ? "Provides SEO, PPC, paid media, web development, and digital marketing services for clients."
              : "—",
            role: e.role,
            duration: e.years ? `${e.years} years` : "—",
            companyUrl: isDotMappers ? "https://dotmappers.in" : null,
            companyDomain: isDotMappers ? "dotmappers.in" : null,
            keyResponsibilities: [`Performed ${e.role} responsibilities`],
            projects: parsedData?.projects?.slice(0, 2) ?? [],
            technologies: parsedData?.skills?.slice(0, 5) ?? [],
            businessImpact: "Contributed to team deliverables.",
            achievements: [],
            leadershipResponsibilities: [],
            relevantSkillsGained: parsedData?.skills?.slice(0, 4) ?? [],
            valueForHiringRole: `Experience as ${e.role} supports ${job.title} requirements.`,
          };
        })
      : [
          {
            companyName: "Previous employer",
            industry: "—",
            companyDescription: "—",
            whatCompanyDoes: "—",
            role: "Professional",
            duration: `${years} years`,
            companyUrl: null,
            keyResponsibilities: [],
            projects: [],
            technologies: [],
            businessImpact: "—",
            achievements: [],
            leadershipResponsibilities: [],
            relevantSkillsGained: [],
            valueForHiringRole: "General professional experience.",
          },
        ];

  const timeline = exp.map((e, i) => ({
    role: e.role,
    company: e.company,
    duration: e.years ? `${e.years}y` : "—",
    order: i + 1,
  }));

  const mockBreakdown = normalizeBreakdown({
    relevantRoleExperience: Math.min(85, 45 + relevantBoost + exp.length * 5),
    businessImpact: Math.min(80, 40 + (lower.includes("impact") || lower.includes("revenue") ? 25 : 10)),
    technicalComplexity: Math.min(85, 35 + (parsedData?.skills?.length ?? 0) * 2),
    leadershipOwnership: Math.min(75, lower.includes("lead") || lower.includes("managed") ? 60 : 25),
    companyRelevance: Math.min(80, 40 + exp.length * 8),
    yearsExperience: Math.min(70, years * 8),
  });

  const base = finalizeExperienceIntelligenceResult({
    score: computeExperienceIntelligenceScore(mockBreakdown),
    breakdown: mockBreakdown,
    scoreRationale: `Score reflects ${mockBreakdown.relevantRoleExperience}/100 role relevance, ${mockBreakdown.businessImpact}/100 business impact, and ${mockBreakdown.leadershipOwnership}/100 leadership signal. Years of experience weighted at only 10%.`,
    currentCompany: current?.company ?? "—",
    currentRole: current?.role ?? "—",
    industry: "Technology / Services",
    experienceLevel: years >= 8 ? "Senior" : years >= 4 ? "Mid" : "Junior",
    companyRating: mockBreakdown.companyRelevance >= 60 ? "Strong" : "Moderate",
    impactRating: mockBreakdown.businessImpact >= 60 ? "High" : "Medium",
    hasAgencyExperience: false,
    agencyBadgeType: null,
    agencyRelevantToJd: false,
    overallRecommendation: deriveExperienceRecommendation(computeExperienceIntelligenceScore(mockBreakdown)),
    aiExperienceSummary: `This candidate brings approximately ${years} years of experience${current ? `, most recently as ${current.role} at ${current.company}` : ""}. Their background shows ${mockBreakdown.relevantRoleExperience >= 60 ? "solid" : "moderate"} alignment with ${job.title} responsibilities.`,
    hiringValue: {
      whyValuable: "Demonstrated progression across relevant roles.",
      experienceTransfer: "Prior responsibilities map to key job requirements.",
      businessValue: "Can contribute from day one on core deliverables.",
      technicalStrengths: parsedData?.skills?.slice(0, 4) ?? [],
      potentialRisks: years < 2 ? ["Limited tenure in role"] : [],
      interviewFocus: ["Deep-dive on most recent project impact", "Validate leadership scope"],
    },
    agencyExperience: null,
    companies,
    previousRolesTimeline: timeline,
  });

  return resolveAgencyBadgeForResult(base, {
    job: job.jdText ? { title: job.title, jdText: job.jdText } : undefined,
    recalculateScore: Boolean(job.jdText),
  });
}

export async function runExperienceIntelligence(
  resumeText: string,
  parsedData: ParsedResume | null,
  job: { title: string; jdText: string; mustHaveSkills: string[]; mandatoryRequirements?: string | null }
): Promise<ExperienceIntelligenceResult> {
  const hasKey = await hasAnthropicApiKey();
  if (process.env.USE_MOCK_AI === "true" && !hasKey) {
    return evaluateExperienceIntelligenceMock(resumeText, parsedData, job);
  }
  if (!hasKey) {
    return evaluateExperienceIntelligenceMock(resumeText, parsedData, job);
  }
  try {
    return await evaluateExperienceIntelligence(resumeText, parsedData, job);
  } catch (error) {
    console.warn("[AI] Experience intelligence failed, using heuristic fallback:", error);
    return evaluateExperienceIntelligenceMock(resumeText, parsedData, job);
  }
}

export function rankExperienceIntelligence(
  candidates: Array<{ id: string; score: number | null }>
): Array<{ id: string; rank: number }> {
  const sorted = [...candidates].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return sorted.map((c, i) => ({ id: c.id, rank: i + 1 }));
}
