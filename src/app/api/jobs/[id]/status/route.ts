import { auth } from "@/lib/auth";
import { handleApiError, apiSuccess, AppError } from "@/lib/api-error";
import { getProcessingStatus } from "@/services/processing.service";
import { isJobActive } from "@/services/queue.service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const { id } = await params;
    const status = await getProcessingStatus(id);
    return apiSuccess({
      ...status,
      isActive: isJobActive(id),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
