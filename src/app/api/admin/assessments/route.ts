import { auth } from "@/lib/auth";
import { handleApiError, apiSuccess, AppError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { assessmentSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") throw new AppError("Unauthorized", 401);

    const body = await request.json();
    const data = assessmentSchema.parse(body);

    const assessment = await prisma.assessment.create({ data });
    return apiSuccess(assessment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
