import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readUploadFile, getMimeType } from "@/lib/storage";
import { NextResponse } from "next/server";

async function serveFile(filePath: string, fileName: string) {
  const buffer = await readUploadFile(filePath);
  const mime = getMimeType(fileName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await params;
  const fileRecord = await prisma.assessmentFile.findFirst({
    where: { id: fileId, assessmentId: id },
    include: { assessment: true },
  });

  if (!fileRecord || fileRecord.assessment.type !== "ATTACHMENT") {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    return await serveFile(fileRecord.filePath, fileRecord.fileName);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
