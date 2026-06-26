import { getAssessmentFiles } from "@/lib/assessment-files";
import { loadAssessmentWithFiles } from "@/lib/assessment-queries";
import {
  displayFileName,
  requireAssessmentDownloadAccess,
  serveAssessmentFile,
} from "@/lib/assessment-file-route";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const denied = await requireAssessmentDownloadAccess(request, id, "legacy");
  if (denied) return denied;

  const assessment = await loadAssessmentWithFiles(id);

  if (!assessment || assessment.type !== "ATTACHMENT") {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const files = getAssessmentFiles(assessment);
  if (files.length === 0) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const file = files[0];

  try {
    const download = new URL(request.url).searchParams.get("download") === "1";
    return await serveAssessmentFile(
      displayFileName(file.filePath, file.fileName),
      { filePath: file.filePath, fileData: file.fileData },
      { download }
    );
  } catch (error) {
    console.error(`[AssessmentFile] Failed to serve ${file.filePath}:`, error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
