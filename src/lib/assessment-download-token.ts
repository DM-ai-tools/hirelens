import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Signed token for public assessment file downloads (email links, previews). */
export function createAssessmentDownloadToken(
  assessmentId: string,
  fileId: string = "legacy"
): string {
  const payload = `${assessmentId}:${fileId}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyAssessmentDownloadToken(
  token: string,
  assessmentId: string,
  fileId: string = "legacy"
): boolean {
  const expected = createAssessmentDownloadToken(assessmentId, fileId);
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
