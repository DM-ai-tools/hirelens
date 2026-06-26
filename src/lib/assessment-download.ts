import { createAssessmentDownloadToken } from "@/lib/assessment-download-token";

export function getAppBaseUrl(): string {
  return process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3001";
}

export function buildAssessmentFileDownloadUrl(
  baseUrl: string,
  assessmentId: string,
  fileId?: string
): string {
  const resolvedFileId = fileId && fileId !== "legacy" ? fileId : "legacy";
  const token = createAssessmentDownloadToken(assessmentId, resolvedFileId);
  if (resolvedFileId === "legacy") {
    return `${baseUrl}/api/assessments/${assessmentId}/file?token=${encodeURIComponent(token)}`;
  }
  return `${baseUrl}/api/assessments/${assessmentId}/files/${resolvedFileId}?token=${encodeURIComponent(token)}`;
}
