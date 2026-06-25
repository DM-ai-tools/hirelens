import { apiSuccess } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return apiSuccess({ status: "ok", service: "HireLens API", database: "connected", userCount });
  } catch (error) {
    return apiSuccess({
      status: "degraded",
      service: "HireLens API",
      database: "error",
      message: error instanceof Error ? error.message : "Database unavailable",
    });
  }
}
