import { auth } from "@/lib/auth";
import { getAssessmentFiles } from "@/lib/assessment-files";
import { loadAssessmentWithFiles } from "@/lib/assessment-queries";
import { readUploadFile, getMimeType } from "@/lib/storage";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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
    const buffer = await readUploadFile(file.filePath);
    const fileName = file.fileName || path.basename(file.filePath).replace(/^\d+-/, "");
    const mime = getMimeType(fileName);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
