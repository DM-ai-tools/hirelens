import { auth } from "@/lib/auth";
import { handleApiError, apiSuccess, AppError } from "@/lib/api-error";
import { ensureScreeningStarted } from "@/services/queue.service";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const { id } = await params;
    const result = await ensureScreeningStarted(id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
