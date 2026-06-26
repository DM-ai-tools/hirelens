const LOCATION_LABEL =
  /(?:^|\s)(?:location|current location|address|based in|city|residence|residing in|geo)\s*[:\-–]\s*(.+)$/i;

const EMAIL_IN_LINE = /@/;
const PHONE_HEAVY = /(?:\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_URL = /linkedin\.com/i;

/** City, region/country — e.g. "Bangalore, India" or "San Francisco, CA" */
const CITY_REGION =
  /\b([A-Za-z][A-Za-z\s.'-]{1,48},\s*[A-Za-z][A-Za-z\s.'-]{1,40})\b/;

function hasCityRegion(text: string): boolean {
  return CITY_REGION.test(text);
}

const PIPE_LOCATION =
  /^[A-Za-z][A-Za-z\s.'-]{1,48}\s*[|·]\s*[A-Za-z][A-Za-z\s.'-]{1,40}$/;

const CITY_WITH_PIN =
  /^([A-Za-z][A-Za-z\s.'-]{2,40})\s*,?\s*\d{6}\b/;

const CONTACT_SPLIT = /\s*[|⋄•·§]\s*/;

const SECTION_HEADER =
  /^(experience|education|skills|technical skills|core competencies|summary|profile|objective|projects|certifications|work|professional summary|key skills)/i;

const TECH_TERM =
  /\b(python|java|javascript|typescript|react|node\.?js|tensorflow|pytorch|hugging\s*face|transformers?|kubernetes|docker|aws|azure|gcp|sql|mongodb|postgresql|mysql|redis|kafka|flask|django|spring|angular|vue|next\.?js|fastapi|scikit|pandas|numpy|opencv|nlp|llm|gpt|bert|api|git|github|gitlab|jenkins|terraform|ansible|microservices|rest|graphql|html|css|tailwind|bootstrap|excel|power\s*bi|tableau|spark|hadoop|airflow|langchain|openai|anthropic|claude|gemini|cuda|gpu|mlops|devops|ci\/cd|agile|scrum|jira|figma|photoshop|illustrator|selenium|cypress|jest|pytest|maven|gradle|dotnet|\.net|c\+\+|c#|ruby|rails|php|laravel|swift|kotlin|go\b|golang|rust|blockchain|solidity|ethereum)\b/i;

const GEOGRAPHIC_HINT =
  /\b(india|usa|u\.?s\.?a|united states|united kingdom|uk|canada|australia|germany|france|singapore|dubai|uae|hyderabad|bangalore|bengaluru|mumbai|delhi|new delhi|chennai|coimbatore|pune|kolkata|noida|gurgaon|gurugram|kochi|kerala|karnataka|telangana|tamil nadu|andhra|maharashtra|gujarat|rajasthan|west bengal|punjab|haryana|uttar pradesh|madhya pradesh|odisha|assam|goa|california|texas|york|francisco|seattle|austin|boston|chicago|london|toronto|sydney|melbourne|ropar|amritsar)\b/i;

const US_STATE_ABBR = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY", "DC",
]);

const INVALID_STATE_CODES = new Set(["AI", "ML", "UI", "UX", "QA", "IT", "HR", "PM", "PO"]);

function cleanLocation(value: string): string {
  return value
    .replace(/\s*[|•·§]\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/[.,;]+$/, "")
    .trim();
}

function normalizeLine(line: string): string {
  return line.replace(/^#+\s*/, "").replace(/^[-*]\s+/, "").trim();
}

function contactSegments(line: string): string[] {
  return normalizeLine(line)
    .split(CONTACT_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Returns true when text looks like a geographic location, not a skill list. */
export function isLikelyLocation(text: string): boolean {
  const value = cleanLocation(text);
  if (value.length < 3 || value.length > 80) return false;
  if (EMAIL_IN_LINE.test(value) || PHONE_HEAVY.test(value) || LINKEDIN_URL.test(value)) {
    return false;
  }

  const commaCount = (value.match(/,/g) || []).length;
  if (commaCount > 2) return false;

  if (TECH_TERM.test(value)) return false;
  if (/\b(framework|library|libraries|toolkit|stack|technologies|tools|skills)\b/i.test(value)) {
    return false;
  }

  if (GEOGRAPHIC_HINT.test(value)) return true;

  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) {
    const [first, second] = parts;
    if (TECH_TERM.test(first) || TECH_TERM.test(second)) return false;

    const secondUpper = second.toUpperCase();
    if (US_STATE_ABBR.has(secondUpper) && !INVALID_STATE_CODES.has(secondUpper)) return true;
    if (GEOGRAPHIC_HINT.test(second)) return true;
    if (/^[A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+){0,3}$/.test(first) && second.length >= 3) {
      return !TECH_TERM.test(second);
    }
  }

  if (parts.length === 1 && /^[A-Za-z][A-Za-z\s.'-]{2,40}$/.test(parts[0])) {
    return GEOGRAPHIC_HINT.test(parts[0]);
  }

  return false;
}

function tryLocation(value: string): string | undefined {
  const cleaned = cleanLocation(value);
  return isLikelyLocation(cleaned) ? cleaned : undefined;
}

function tryEmbeddedCityRegion(text: string): string | undefined {
  const matches = text.matchAll(new RegExp(CITY_REGION.source, "g"));
  for (const match of matches) {
    const loc = tryLocation(match[1]);
    if (loc) return loc;
  }
  return undefined;
}

function tryLabeledLocation(line: string): string | undefined {
  const labeled = line.match(LOCATION_LABEL);
  if (!labeled?.[1]) return undefined;
  return tryLocation(labeled[1]) ?? tryEmbeddedCityRegion(labeled[1]);
}

function tryContactLine(line: string): string | undefined {
  const labeled = tryLabeledLocation(line);
  if (labeled) return labeled;

  for (const segment of contactSegments(line)) {
    if (EMAIL_IN_LINE.test(segment) && !hasCityRegion(segment)) continue;
    if (PHONE_HEAVY.test(segment) && !hasCityRegion(segment)) continue;
    if (LINKEDIN_URL.test(segment) && !hasCityRegion(segment)) continue;

    const direct = tryLocation(segment);
    if (direct) return direct;

    const embedded = tryEmbeddedCityRegion(segment);
    if (embedded) return embedded;
  }

  return tryEmbeddedCityRegion(line);
}

/** Extract candidate location from resume plain or markdown text. */
export function extractLocationFromResume(text: string): string | undefined {
  if (!text?.trim()) return undefined;

  const lines = text.split("\n").map(normalizeLine).filter(Boolean);

  for (const line of lines.slice(0, 60)) {
    const labeled = tryLabeledLocation(line);
    if (labeled) return labeled;
  }

  for (const line of lines.slice(0, 30)) {
    if (SECTION_HEADER.test(line)) break;

    const fromContact = tryContactLine(line);
    if (fromContact) return fromContact;

    if (line.length > 120) continue;

    if (PIPE_LOCATION.test(line)) {
      const loc = tryLocation(line.replace(/\s*[|·]\s*/, ", "));
      if (loc) return loc;
    }

    const pinMatch = line.match(CITY_WITH_PIN);
    if (pinMatch?.[1]) {
      const loc = tryLocation(pinMatch[1]);
      if (loc) return loc;
    }

    if (
      /^[A-Za-z][A-Za-z\s.'-]{2,35}$/.test(line) &&
      GEOGRAPHIC_HINT.test(line) &&
      !SECTION_HEADER.test(line)
    ) {
      const loc = tryLocation(line);
      if (loc) return loc;
    }
  }

  return undefined;
}

function firstValidLocation(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && isLikelyLocation(trimmed)) return trimmed;
  }
  return null;
}

/** Resolve location from stored field, parsed data, or resume text (for legacy rows). */
export function resolveCandidateLocation(candidate: {
  location?: string | null;
  parsedData?: unknown;
  rawText?: string | null;
  llmRaw?: unknown;
  experienceIntelligenceData?: unknown;
}): string | null {
  const parsed = candidate.parsedData as { location?: string } | null | undefined;
  const llm = candidate.llmRaw as { location?: string | null } | null | undefined;
  const ei = candidate.experienceIntelligenceData as
    | { candidateLocation?: string | null }
    | null
    | undefined;

  const fromStored = firstValidLocation(
    llm?.location ?? undefined,
    ei?.candidateLocation ?? undefined,
    candidate.location ?? undefined,
    parsed?.location
  );
  if (fromStored) return fromStored;

  if (candidate.rawText) {
    const fromText = extractLocationFromResume(candidate.rawText);
    if (fromText) return fromText;
  }

  return null;
}

/** Pick best location after evaluation (AI > validated parse > re-extract). */
export function pickCandidateLocation(
  existing: string | null | undefined,
  fromEvaluation: string | null | undefined,
  rawText: string | null | undefined,
  fromExpIntel?: string | null | undefined
): string | null {
  return (
    firstValidLocation(
      fromEvaluation ?? undefined,
      fromExpIntel ?? undefined,
      existing ?? undefined
    ) ?? (rawText ? extractLocationFromResume(rawText) ?? null : null)
  );
}
