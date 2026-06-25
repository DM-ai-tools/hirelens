import Anthropic from "@anthropic-ai/sdk";
import { requireAnthropicApiKey } from "@/lib/anthropic-config";
import { ANTHROPIC_MODEL } from "@/lib/constants";
import {
  cleanCompanyProfileText,
  enrichCompanyProfile,
  filterProfessionalCompanies,
  resolveAgencyBadgeForResult,
} from "@/lib/experience-intelligence.utils";
import type { CompanyExperienceDetail, ExperienceIntelligenceResult } from "@/types";

const WEB_SEARCH_TOOL: Anthropic.Messages.WebSearchTool20250305 = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 10,
};

interface WebEnrichedCompany {
  index: number;
  industry?: string | null;
  companyDescription?: string | null;
  whatCompanyDoes?: string | null;
  companyUrl?: string | null;
  companyDomain?: string | null;
}

function extractTextFromResponse(content: Anthropic.Message["content"]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

/** Best-effort JSON array parse — never throws (web search replies are often messy). */
export function tryParseJsonArray(text: string): unknown[] {
  if (!text) return [];

  const candidates: string[] = [];

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) candidates.push(fenceMatch[1].trim());

  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch?.[0]) candidates.push(bracketMatch[0]);

  candidates.push(text.trim());

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* try next strategy */
    }
  }

  console.warn(
    "[CompanyEnrichment] Web search response did not contain a parseable JSON array; using resume-only profiles."
  );
  return [];
}

function normalizeWebEnrichment(raw: unknown): WebEnrichedCompany | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const index = typeof row.index === "number" ? row.index : Number(row.index);
  if (!Number.isFinite(index) || index < 0) return null;
  return {
    index,
    industry: typeof row.industry === "string" ? cleanCompanyProfileText(row.industry) : null,
    companyDescription:
      typeof row.companyDescription === "string"
        ? cleanCompanyProfileText(row.companyDescription)
        : null,
    whatCompanyDoes:
      typeof row.whatCompanyDoes === "string" ? cleanCompanyProfileText(row.whatCompanyDoes) : null,
    companyUrl: typeof row.companyUrl === "string" ? row.companyUrl : null,
    companyDomain: typeof row.companyDomain === "string" ? row.companyDomain : null,
  };
}

export function mergeWebEnrichmentIntoCompanies(
  companies: CompanyExperienceDetail[],
  enriched: WebEnrichedCompany[]
): CompanyExperienceDetail[] {
  const byIndex = new Map(enriched.map((e) => [e.index, e]));

  return companies.map((company, index) => {
    const web = byIndex.get(index);
    if (!web) return enrichCompanyProfile(company);

    const pick = (value: string | null | undefined, fallback: string) => {
      const trimmed = value?.trim();
      if (!trimmed || trimmed === "—" || trimmed.toLowerCase() === "unknown") return fallback;
      return trimmed;
    };

    return enrichCompanyProfile({
      ...company,
      industry: pick(web.industry, company.industry),
      companyDescription: pick(web.companyDescription, company.companyDescription),
      whatCompanyDoes: pick(web.whatCompanyDoes, company.whatCompanyDoes),
      companyUrl: web.companyUrl ?? company.companyUrl,
      companyDomain: web.companyDomain ?? company.companyDomain,
    });
  });
}

export function companiesNeedWebEnrichment(companies: CompanyExperienceDetail[]): boolean {
  return filterProfessionalCompanies(companies).some(
    (co) =>
      co.companyName !== "—" &&
      (!co.companyDomain ||
        co.industry === "—" ||
        co.companyDescription === "—" ||
        co.whatCompanyDoes === "—")
  );
}

/** Look up employer profiles via Claude web search (industry, description, domain, URL). */
export async function enrichCompaniesFromWebSearch(
  companies: CompanyExperienceDetail[],
  apiKey?: string
): Promise<CompanyExperienceDetail[]> {
  const professional = filterProfessionalCompanies(companies);
  if (professional.length === 0) return companies;

  try {
    const key = apiKey ?? (await requireAnthropicApiKey());
    const client = new Anthropic({ apiKey: key });

    const lookupList = professional.map((co, index) => ({
      index,
      companyName: co.companyName,
      candidateRole: co.role,
      duration: co.duration,
    }));

    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      temperature: 0.1,
      tools: [{ ...WEB_SEARCH_TOOL, max_uses: Math.min(lookupList.length + 2, 10) }],
      system: `You research employers using web search. For each company in the user's list, search the web to find:
- Official industry / sector
- Brief company description (1-2 sentences, factual)
- What the company does (products, services, market)
- Official website URL (https://...)
- Bare domain only (e.g. dotmappers.in — no https, no www)

Return ONLY a valid JSON array as your final message — no prose before or after.
Each object must include "index" matching the input list.
Use null for companyUrl and companyDomain only when the company cannot be identified after search.
Do NOT copy resume text. Use web search results.
All string values must be plain text only — no HTML, XML, or <cite> tags.`,
      messages: [
        {
          role: "user",
          content: `Research these employers from candidate resumes:\n${JSON.stringify(lookupList, null, 2)}\n\nReturn JSON array only:\n[{"index":0,"industry":"...","companyDescription":"...","whatCompanyDoes":"...","companyUrl":"https://...","companyDomain":"example.com"}]`,
        },
      ],
    });

    const text = extractTextFromResponse(response.content);
    const parsed = tryParseJsonArray(text)
      .map(normalizeWebEnrichment)
      .filter((row): row is WebEnrichedCompany => row != null);

    if (parsed.length === 0) return companies.map(enrichCompanyProfile);

    return mergeWebEnrichmentIntoCompanies(companies, parsed);
  } catch (error) {
    console.warn("[CompanyEnrichment] Web search enrichment failed, using resume-only profiles:", error);
    return companies.map(enrichCompanyProfile);
  }
}

/** Enrich employer cards, then classify agency badge from fetched descriptions only. */
export async function enrichExperienceIntelligenceCompanies(
  result: ExperienceIntelligenceResult,
  apiKey?: string,
  job?: { title: string; jdText: string }
): Promise<ExperienceIntelligenceResult> {
  let companies = result.companies;
  if (companiesNeedWebEnrichment(companies)) {
    try {
      companies = await enrichCompaniesFromWebSearch(companies, apiKey);
    } catch (error) {
      console.warn("[CompanyEnrichment] Skipping web enrichment:", error);
      companies = companies.map(enrichCompanyProfile);
    }
  } else {
    companies = companies.map(enrichCompanyProfile);
  }

  return resolveAgencyBadgeForResult(
    { ...result, companies },
    job ? { job, recalculateScore: true } : undefined
  );
}
