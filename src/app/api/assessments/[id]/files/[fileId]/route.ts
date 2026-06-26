import { prisma } from "@/lib/prisma";
import {
  displayFileName,
  requireAssessmentDownloadAccess,
  serveAssessmentFile,
} from "@/lib/assessment-file-route";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id, fileId } = await params;
  const denied = await requireAssessmentDownloadAccess(request, id, fileId);
  if (denied) return denied;

  const fileRecord = await prisma.assessmentFile.findFirst({
    where: { id: fileId, assessmentId: id },
    include: { assessment: true },
  });

  if (!fileRecord || fileRecord.assessment.type !== "ATTACHMENT") {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const download = new URL(request.url).searchParams.get("download") === "1";
    return await serveAssessmentFile(
      fileRecord.filePath,
      displayFileName(fileRecord.filePath, fileRecord.fileName),
      { download }
    );
  } catch (error) {
    console.error(`[AssessmentFile] Failed to serve ${fileRecord.filePath}:`, error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
