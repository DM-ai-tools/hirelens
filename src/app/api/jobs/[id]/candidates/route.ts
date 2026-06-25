import { auth } from "@/lib/auth";
import { handleApiError, apiSuccess, AppError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";
import { enqueueScreening } from "@/services/queue.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const { id: jobId } = await params;
    const formData = await request.formData();
    const files = formData.getAll("resumes") as File[];

    if (files.length === 0) throw new AppError("No files uploaded", 400);

    for (const file of files) {
      if (!file.size) continue;
      const saved = await saveUpload(file, `jobs/${jobId}`);
      await prisma.candidate.create({
        data: {
          jobId,
          resumePath: saved.filePath,
          resumeFileName: saved.fileName,
        },
      });
    }

    await enqueueScreening(jobId);
    return apiSuccess({ message: "Upload started", jobId });
  } catch (error) {
    return handleApiError(error);
  }
}
