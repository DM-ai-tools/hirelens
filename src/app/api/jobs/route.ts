import { auth } from "@/lib/auth";
import { handleApiError, apiSuccess, AppError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { jobSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { candidates: true } },
        createdBy: { select: { name: true } },
      },
    });

    return apiSuccess(jobs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const body = await request.json();
    const data = jobSchema.parse(body);

    const job = await prisma.job.create({
      data: { ...data, createdById: session.user.id },
    });

    return apiSuccess(job, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
