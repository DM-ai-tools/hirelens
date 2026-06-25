import { auth } from "@/lib/auth";
import { handleApiError, apiSuccess, AppError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const { id } = await params;
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { job: true, assessmentSends: { include: { assessment: true } } },
    });

    if (!candidate) throw new AppError("Candidate not found", 404);
    return apiSuccess(candidate);
  } catch (error) {
    return handleApiError(error);
  }
}
