type JobLike = { title: string; department: string | null; roleTag?: string | null };
type AssessmentLike = { roleTag: string | null; active?: boolean };

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "for",
  "to",
  "in",
  "at",
  "with",
  "senior",
  "junior",
  "lead",
  "sr",
  "jr",
  "ii",
  "iii",
]);

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function meaningfulTokens(value: string): string[] {
  return normalize(value)
    .replace(/[^a-z0-9+#.]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function isNearTokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a))) return true;
  const maxDistance = Math.min(a.length, b.length) <= 4 ? 1 : 2;
  return levenshtein(a, b) <= maxDistance;
}

function tokenOverlapScore(needles: string[], haystack: string[]): number {
  let score = 0;
  for (const needle of needles) {
    if (haystack.some((token) => isNearTokenMatch(needle, token))) score++;
  }
  return score;
}

/** Loose match between role tag and job title / department / saved role tag. */
export function stringsLooselyMatch(a: string, b: string): boolean {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = meaningfulTokens(a);
  const rightTokens = meaningfulTokens(b);
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;

  const overlap = tokenOverlapScore(leftTokens, rightTokens);
  const required = Math.max(1, Math.ceil(Math.min(leftTokens.length, rightTokens.length) * 0.5));
  return overlap >= required;
}

/** Match assessments to a job by role tag, or include global assessments with no tag. */
export function assessmentMatchesJob(assessment: AssessmentLike, job: JobLike): boolean {
  const tag = assessment.roleTag?.trim();
  if (!tag) return true;

  const fields = [job.roleTag, job.title, job.department].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  return fields.some((field) => stringsLooselyMatch(tag, field));
}

export function filterAssessmentsForJob<T extends AssessmentLike>(
  assessments: T[],
  job: JobLike
): T[] {
  return assessments.filter((a) => a.active !== false && assessmentMatchesJob(a, job));
}
