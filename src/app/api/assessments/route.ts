import { auth } from "@/lib/auth";
import { handleApiError, apiSuccess, AppError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { sendAssessmentSchema } from "@/lib/validations";
import { sendBulkAssessments } from "@/services/email.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const assessments = await prisma.assessment.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    return apiSuccess(assessments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const body = await request.json();
    const data = sendAssessmentSchema.parse(body);
    const deadline = data.deadline ? new Date(data.deadline) : undefined;

    const results = await sendBulkAssessments(
      data.candidateIds,
      data.assessmentId,
      deadline
    );

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SEND_ASSESSMENTS",
        metadata: { count: results.length },
      },
    });

    return apiSuccess(results);
  } catch (error) {
    return handleApiError(error);
  }
}
