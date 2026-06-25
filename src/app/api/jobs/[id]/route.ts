import { auth } from "@/lib/auth";
import { handleApiError, apiSuccess, AppError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { getProcessingStatus } from "@/services/processing.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        candidates: { orderBy: { rank: "asc" } },
        createdBy: { select: { name: true, email: true } },
        reports: { orderBy: { generatedAt: "desc" }, take: 5 },
      },
    });

    if (!job) throw new AppError("Job not found", 404);
    return apiSuccess(job);
  } catch (error) {
    return handleApiError(error);
  }
}
