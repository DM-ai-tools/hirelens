import { auth } from "@/lib/auth";
import { verifyAssessmentDownloadToken } from "@/lib/assessment-download-token";
import { readAssessmentFileContent } from "@/lib/assessment-file-content";
import { getMimeType } from "@/lib/storage";
import path from "path";
import { NextResponse } from "next/server";

export function assessmentDownloadAllowed(
  request: Request,
  assessmentId: string,
  fileId: string = "legacy"
): boolean {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token && verifyAssessmentDownloadToken(token, assessmentId, fileId)) {
    return true;
  }
  return false;
}

export async function requireAssessmentDownloadAccess(
  request: Request,
  assessmentId: string,
  fileId: string = "legacy"
): Promise<NextResponse | null> {
  if (assessmentDownloadAllowed(request, assessmentId, fileId)) {
    return null;
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function serveAssessmentFile(
  fileName: string,
  source: { filePath: string; fileData?: Buffer | Uint8Array | null },
  options?: { download?: boolean }
) {
  const buffer = await readAssessmentFileContent(source);
  const mime = getMimeType(fileName);
  const safeName = fileName.replace(/"/g, "");
  const disposition = options?.download ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `${disposition}; filename="${safeName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export function displayFileName(filePath: string, fileName?: string | null): string {
  return fileName || path.basename(filePath).replace(/^\d+-/, "");
}
