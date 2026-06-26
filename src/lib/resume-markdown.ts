const SECTION_HEADERS = [
  "summary",
  "profile",
  "objective",
  "experience",
  "work experience",
  "professional experience",
  "employment",
  "education",
  "skills",
  "technical skills",
  "core competencies",
  "projects",
  "certifications",
  "achievements",
  "awards",
  "languages",
  "interests",
  "references",
];

const SECTION_PATTERN = new RegExp(
  `^(${SECTION_HEADERS.map((h) => h.replace(/\s+/g, "\\s+")).join("|")})\\s*:?\\s*$`,
  "i"
);

const BULLET_PREFIX = /^[\u2022\u25CF\u25CB\u25E6\-*•]\s+/;
const NUMBERED_PREFIX = /^\d{1,2}[.)]\s+/;
const PAGE_NUMBER = /^\d{1,3}$/;

function collapseWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function isLikelyNameLine(line: string): boolean {
  if (!line || line.length > 60) return false;
  if (line.includes("@")) return false;
  if (/\d{3,}/.test(line)) return false;
  if (SECTION_PATTERN.test(line)) return false;
  return /^[A-Za-z][A-Za-z\s.'-]+$/.test(line);
}

function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length > 50) return false;
  return SECTION_PATTERN.test(trimmed);
}

function toSectionTitle(line: string): string {
  return line
    .replace(/:$/, "")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatBulletLine(line: string): string {
  const trimmed = line.trim();
  if (BULLET_PREFIX.test(trimmed)) {
    return `- ${trimmed.replace(BULLET_PREFIX, "").trim()}`;
  }
  if (NUMBERED_PREFIX.test(trimmed)) {
    return `- ${trimmed.replace(NUMBERED_PREFIX, "").trim()}`;
  }
  return trimmed;
}

/** Convert unstructured resume plain text into compact markdown for LLM input. */
export function plainTextToResumeMarkdown(text: string): string {
  const collapsed = collapseWhitespace(text);
  if (!collapsed) return "";

  const rawLines = collapsed.split("\n").map((l) => l.trim());
  const lines: string[] = [];

  for (const line of rawLines) {
    if (!line) continue;
    if (PAGE_NUMBER.test(line)) continue;
    if (line.length === 1 && !/[A-Za-z]/.test(line)) continue;
    lines.push(line);
  }

  if (lines.length === 0) return "";

  const output: string[] = [];
  let index = 0;

  if (isLikelyNameLine(lines[0])) {
    output.push(`# ${lines[0]}`);
    index = 1;
  }

  while (index < lines.length) {
    const line = lines[index];

    if (isSectionHeader(line)) {
      output.push("");
      output.push(`## ${toSectionTitle(line)}`);
      index++;
      continue;
    }

    const formatted = formatBulletLine(line);
    if (formatted.startsWith("- ")) {
      output.push(formatted);
    } else if (formatted.length > 0) {
      output.push(formatted);
    }
    index++;
  }

  return normalizeResumeMarkdown(output.join("\n"));
}

/** Final cleanup pass for markdown resume content. */
export function normalizeResumeMarkdown(md: string): string {
  if (!md) return "";

  let result = md
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const lines = result.split("\n");
  const deduped: string[] = [];

  for (const line of lines) {
    const prev = deduped[deduped.length - 1];
    if (line === "" && prev === "") continue;
    deduped.push(line);
  }

  return deduped.join("\n").trim();
}

/** Whether text already looks like structured markdown from mammoth. */
export function isStructuredMarkdown(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return /^#{1,3}\s/m.test(trimmed) || /^[-*]\s/m.test(trimmed);
}
