import path from "path";
import { buildAssessmentFileDownloadUrl } from "@/lib/assessment-download";

export type AssessmentFileView = {
  id: string;
  fileName: string;
  filePath: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

type AssessmentWithFiles = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  filePath: string | null;
  files?: AssessmentFileView[];
};

export function getAssessmentFiles(assessment: {
  filePath: string | null;
  files?: AssessmentFileView[];
}): AssessmentFileView[] {
  if (assessment.files?.length) {
    return [...assessment.files].sort((a, b) => a.fileName.localeCompare(b.fileName));
  }
  if (assessment.filePath) {
    const fileName = path.basename(assessment.filePath).replace(/^\d+-/, "");
    return [
      {
        id: "legacy",
        fileName,
        filePath: assessment.filePath,
      },
    ];
  }
  return [];
}

export function assessmentHasFiles(assessment: {
  type: string;
  filePath: string | null;
  files?: AssessmentFileView[];
}): boolean {
  if (assessment.type !== "ATTACHMENT") return false;
  return getAssessmentFiles(assessment).length > 0;
}

export function primaryAssessmentLink(
  assessment: AssessmentWithFiles,
  baseUrl: string
): string {
  if (assessment.type === "LINK" && assessment.url) return assessment.url;
  const files = getAssessmentFiles(assessment);
  if (files.length === 0) return "#";
  const file = files[0];
  return buildAssessmentFileDownloadUrl(
    baseUrl,
    assessment.id,
    file.id === "legacy" ? undefined : file.id
  );
}

export function buildAssessmentLinksHtml(
  assessments: AssessmentWithFiles[],
  baseUrl: string
): string {
  const items = assessments.flatMap((a) => {
    if (a.type === "LINK" && a.url) {
      return [`<li><a href="${a.url}">${a.name}</a></li>`];
    }
    return getAssessmentFiles(a).map((f) => {
      const href = buildAssessmentFileDownloadUrl(
        baseUrl,
        a.id,
        f.id === "legacy" ? undefined : f.id
      );
      const label = getAssessmentFiles(a).length > 1 ? `${a.name} — ${f.fileName}` : a.name;
      return `<li><a href="${href}">${label}</a></li>`;
    });
  });
  if (items.length === 0) return "";
  return `<ul style="margin:12px 0;padding-left:20px;line-height:1.7">${items.join("")}</ul>`;
}

/** Reads one or more uploaded files from a server-action FormData payload. */
export function collectFilesFromFormData(formData: FormData): File[] {
  const files: File[] = [];

  for (const entry of formData.getAll("files")) {
    if (entry instanceof File && entry.size > 0) {
      files.push(entry);
    }
  }

  return files;
}
