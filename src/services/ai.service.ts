import Anthropic from "@anthropic-ai/sdk";
import {
  hasAnthropicApiKey,
  requireAnthropicApiKey,
  resolveAnthropicApiKey,
} from "@/lib/anthropic-config";
import { ANTHROPIC_MODEL, buildExperienceEvaluationGuidance, formatMinExperience } from "@/lib/constants";
import { isLikelyLocation, extractLocationFromResume } from "@/lib/resume-location";
import type { LLMEvaluationResult } from "@/types";
import { extractSkillsFromText } from "./scoring.service";

export { hasAnthropicApiKey, resolveAnthropicApiKey };

const SEMANTIC_SKILL_RULES = `SEMANTIC MATCHING (apply to must-have, nice-to-have, AND recruiter mandatory requirements):
- Do NOT require exact keyword matches. Treat equivalent tools, abbreviations, and related technologies as matches.
- Examples: SQL ↔ MySQL, MariaDB, PostgreSQL, SQLite, T-SQL, PL/SQL; JavaScript ↔ JS, TypeScript, Node.js; React ↔ React.js, ReactJS; AWS ↔ Amazon Web Services; ML ↔ machine learning; Claude ↔ Anthropic Claude.
- Evidence can appear in skills lists, project descriptions, job titles, certifications, or responsibilities — not only a literal phrase from the requirement.
- For mandatory requirements: parse each distinct item from the recruiter's free text; met if reasonably evidenced directly OR via an accepted equivalent.`;

const SYSTEM_PROMPT_BASE = `You are an expert technical recruiter. Evaluate ONE candidate resume against the job requirements. Be objective and consistent.
Resume content is provided as markdown; use section structure when evaluating experience and skills.
Return ONLY valid JSON matching this exact schema:
{
  "name": "string",
  "email": "string|null",
  "mobile": "string|null",
  "location": "string|null",
  "overall_experience_years": 0.0,
  "relevant_experience_years": 0.0,
  "matched_must_have": ["string"],
  "missing_must_have": ["string"],
  "matched_nice_to_have": ["string"],
  "strengths": ["string"],
  "missing_skills": ["string"],
  "domain_match": 0.0,
  "seniority_match": 0.0,
  "rationale": "string",
  "recruiter_mandatory_met": true,
  "recruiter_mandatory_gaps": []
}
RULES:
- relevant_experience counts only roles matching the JD domain/skills.
- A skill counts as matched only if evidenced in the resume (including semantic equivalents — see below).
- matched_must_have / missing_must_have must align with the JD must-have list; use JD skill names when listing matches.
- Do not invent contact details; use null if absent.
- location: city and region/country from the resume header or contact section only (e.g. "Hyderabad, India"). Use null if not stated — never put skills or technologies here.
- domain_match and seniority_match are 0.0 to 1.0.
${SEMANTIC_SKILL_RULES}`;

const SYSTEM_PROMPT_MANDATORY = `${SYSTEM_PROMPT_BASE}

RECRUITER MANDATORY REQUIREMENTS (deal-breakers from free text):
- Parse each distinct requirement from the recruiter's text (split on commas, bullets, "and", newlines).
- Set recruiter_mandatory_met to true only when EVERY parsed requirement is evidenced in the resume (directly or via semantic equivalent — e.g. recruiter wrote "sql" and resume shows MySQL).
- recruiter_mandatory_gaps: list only requirements with NO reasonable evidence. Do NOT list items that are satisfied by synonyms or related tools.
- When met via equivalent (e.g. MySQL for SQL), note the equivalence briefly in rationale; do NOT add to recruiter_mandatory_gaps.
- Unmet mandatory requirements must lower domain_match/seniority_match and appear in rationale.
- Add truly unmet mandatory items to missing_skills prefixed with "Mandatory: ".`;

function buildEvaluationSystemPrompt(mandatoryRequirements?: string | null) {
  const trimmed = mandatoryRequirements?.trim();
  return trimmed ? SYSTEM_PROMPT_MANDATORY : SYSTEM_PROMPT_BASE;
}

function buildMandatoryBlock(mandatoryRequirements?: string | null) {
  const trimmed = mandatoryRequirements?.trim();
  if (!trimmed) return "";
  return `
RECRUITER MANDATORY REQUIREMENTS (deal-breakers — evaluate each with semantic equivalence, not literal string match):
${trimmed.slice(0, 2000)}
`;
}

function normalizeEvaluationResult(
  parsed: LLMEvaluationResult,
  hasMandatory: boolean
): LLMEvaluationResult {
  const location =
    parsed.location?.trim() && isLikelyLocation(parsed.location.trim())
      ? parsed.location.trim()
      : null;

  const base = {
    ...parsed,
    location,
  };

  if (!hasMandatory) {
    return {
      ...base,
      recruiter_mandatory_met: true,
      recruiter_mandatory_gaps: [],
    };
  }
  const gaps = Array.isArray(parsed.recruiter_mandatory_gaps)
    ? parsed.recruiter_mandatory_gaps.filter(Boolean)
    : [];

  const recruiter_mandatory_met =
    gaps.length === 0 && parsed.recruiter_mandatory_met !== false;

  return {
    ...base,
    recruiter_mandatory_met,
    recruiter_mandatory_gaps: gaps,
  };
}

/** Semantic groups for mock-mode mandatory checks (real AI handles this in production). */
const MANDATORY_SYNONYM_GROUPS: string[][] = [
  ["sql", "mysql", "mariadb", "postgresql", "postgres", "sqlite", "mssql", "t-sql", "pl/sql", "oracle"],
  ["javascript", "js", "typescript", "ts", "node.js", "nodejs"],
  ["react", "reactjs", "react.js", "next.js", "nextjs"],
  ["python", "django", "flask", "fastapi"],
  ["java", "spring", "spring boot"],
  ["aws", "amazon web services", "ec2", "s3", "lambda"],
  ["docker", "kubernetes", "k8s", "container"],
  ["claude", "anthropic", "anthropic claude"],
  ["machine learning", "ml", "deep learning", "pytorch", "tensorflow"],
];

function mandatoryTermMetInResume(term: string, resumeLower: string): boolean {
  const normalized = term.toLowerCase().trim();
  if (normalized.length < 2) return true;
  if (resumeLower.includes(normalized)) return true;

  for (const group of MANDATORY_SYNONYM_GROUPS) {
    const termInGroup = group.some(
      (g) => normalized.includes(g) || g.includes(normalized)
    );
    if (termInGroup && group.some((g) => resumeLower.includes(g))) {
      return true;
    }
  }
  return false;
}

export async function evaluateCandidate(
  resumeText: string,
  job: {
    title: string;
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
    minExperience: number;
    jdText: string;
    mandatoryRequirements?: string | null;
  }
): Promise<LLMEvaluationResult> {
  const client = new Anthropic({ apiKey: await requireAnthropicApiKey() });
  const mandatory = job.mandatoryRequirements?.trim() ?? "";

  const experienceGuidance = buildExperienceEvaluationGuidance(job.minExperience);
  const experienceLabel = formatMinExperience(job.minExperience);

  const userPrompt = `JOB REQUIREMENTS:
  Title: ${job.title}
  Must-have skills: ${job.mustHaveSkills.join(", ") || "See job description"}
  Nice-to-have skills: ${job.niceToHaveSkills.join(", ") || "None specified"}
  Experience tier (from recruiter): ${experienceLabel}
${buildMandatoryBlock(mandatory)}
EXPERIENCE RULES FOR THIS SCREENING:
${experienceGuidance}

JOB DESCRIPTION:
${job.jdText.slice(0, 4000)}

RESUME (markdown):
${resumeText.slice(0, 8000)}`;

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 2048,
    temperature: 0.1,
    system: buildEvaluationSystemPrompt(mandatory),
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected LLM response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("LLM did not return valid JSON");

  const parsed = JSON.parse(jsonMatch[0]) as LLMEvaluationResult;
  return normalizeEvaluationResult(parsed, Boolean(mandatory));
}

export async function evaluateCandidateMock(
  resumeText: string,
  job: {
    title: string;
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
    minExperience: number;
    mandatoryRequirements?: string | null;
  }
): Promise<LLMEvaluationResult> {
  const lower = resumeText.toLowerCase();
  const mandatory = job.mandatoryRequirements?.trim() ?? "";
  const mandatoryTerms = mandatory
    ? mandatory
        .split(/[·,;\n]+|(?:\s+and\s+)/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 2)
    : [];
  const recruiter_mandatory_gaps = mandatoryTerms.filter(
    (term) => !mandatoryTermMetInResume(term, lower)
  );
  const recruiter_mandatory_met =
    mandatoryTerms.length === 0 || recruiter_mandatory_gaps.length === 0;

  const matched_must_have = job.mustHaveSkills.filter((s) =>
    lower.includes(s.toLowerCase())
  );
  const missing_must_have = job.mustHaveSkills.filter(
    (s) => !lower.includes(s.toLowerCase())
  );
  const matched_nice_to_have = job.niceToHaveSkills.filter((s) =>
    lower.includes(s.toLowerCase())
  );
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const lines = resumeText.split("\n").filter(Boolean);
  const yearsMatch = resumeText.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);

  return {
    name: lines[0]?.slice(0, 50) || "Unknown Candidate",
    email: emailMatch?.[0] || null,
    mobile: null,
    location: extractLocationFromResume(resumeText) ?? null,
    overall_experience_years: yearsMatch ? parseFloat(yearsMatch[1]) : 3,
    relevant_experience_years: yearsMatch ? parseFloat(yearsMatch[1]) * 0.8 : 2,
    matched_must_have,
    missing_must_have,
    matched_nice_to_have,
    strengths: matched_must_have.slice(0, 3),
    missing_skills: [
      ...missing_must_have,
      ...recruiter_mandatory_gaps.map((g) => `Mandatory: ${g}`),
    ],
    domain_match: matched_must_have.length / Math.max(job.mustHaveSkills.length, 1),
    seniority_match: 0.7,
    rationale: `Candidate shows ${matched_must_have.length}/${job.mustHaveSkills.length} must-have skills.${
      mandatory
        ? recruiter_mandatory_met
          ? " All recruiter mandatory requirements appear met."
          : ` Missing mandatory: ${recruiter_mandatory_gaps.join("; ")}.`
        : ""
    }`,
    recruiter_mandatory_met,
    recruiter_mandatory_gaps,
  };
}

export async function extractJobRequirementsFromJd(
  jdText: string,
  title?: string,
  userMinExperience?: number
): Promise<{
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  minExperience: number;
  title: string;
}> {
  const fallback = () => {
    const skills = extractSkillsFromText(jdText);
    const expMatch = jdText.match(/(\d+)\+?\s*years?/i);
    return {
      mustHaveSkills: skills.slice(0, 8),
      niceToHaveSkills: skills.slice(8, 15),
      minExperience: userMinExperience ?? (expMatch ? parseInt(expMatch[1]) : 0),
      title: title || jdText.match(/^([^\n]{5,80})/)?.[1]?.trim() || "Untitled Role",
    };
  };

  try {
    const key = await resolveAnthropicApiKey();
    if (!key) {
      return fallback();
    }

    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      temperature: 0.1,
      system: `You extract structured hiring requirements from job descriptions. Return ONLY valid JSON:
{
  "must_have_skills": ["string"],
  "nice_to_have_skills": ["string"],
  "min_experience_years": 0,
  "suggested_title": "string"
}
Rules:
- must_have_skills: Treat every item under "Competencies", "Core Competencies", "Key Competencies", "Required Skills", "Must Have", or similar competency sections as MUST-HAVE skills. Also include other skills the JD explicitly requires (required, mandatory, essential).
- nice_to_have_skills: Preferred, bonus, or optional skills from the JD that are NOT listed as competencies/must-haves. Infer reasonable good-to-have skills from responsibilities and qualifications when clearly preferred but not mandatory.
- Do not duplicate skills across must_have and nice_to_have lists.
- min_experience_years: minimum years if stated, else 0.
- Use concise skill names as they appear in the JD (normalize only for clarity).`,
      messages: [
        {
          role: "user",
          content: `Job title hint: ${title || "not provided"}
Minimum experience hint (years): ${userMinExperience ?? "not provided"}

JOB DESCRIPTION:
${jdText.slice(0, 6000)}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") return fallback();

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback();

    const parsed = JSON.parse(jsonMatch[0]) as {
      must_have_skills?: string[];
      nice_to_have_skills?: string[];
      min_experience_years?: number;
      suggested_title?: string;
    };

    return {
      mustHaveSkills: (parsed.must_have_skills || []).filter(Boolean).slice(0, 12),
      niceToHaveSkills: (parsed.nice_to_have_skills || []).filter(Boolean).slice(0, 12),
      minExperience:
        typeof userMinExperience === "number"
          ? userMinExperience
          : typeof parsed.min_experience_years === "number"
            ? parsed.min_experience_years
            : 0,
      title: title || parsed.suggested_title?.trim() || fallback().title,
    };
  } catch (error) {
    console.warn("[AI] JD extraction fallback:", error);
    return fallback();
  }
}

export async function runEvaluation(
  resumeText: string,
  job: Parameters<typeof evaluateCandidate>[1]
): Promise<LLMEvaluationResult> {
  const hasKey = await hasAnthropicApiKey();
  if (process.env.USE_MOCK_AI === "true" && !hasKey) {
    return evaluateCandidateMock(resumeText, job);
  }
  if (!hasKey) {
    throw new Error("Anthropic API key not configured — set ANTHROPIC_API_KEY or disable USE_MOCK_AI");
  }
  try {
    return await evaluateCandidate(resumeText, job);
  } catch (error) {
    console.warn("[AI] Claude evaluation failed, using heuristic fallback:", error);
    return evaluateCandidateMock(resumeText, job);
  }
}
