import { auth } from "@/lib/auth";
import { handleApiError, apiSuccess, AppError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const [jobs, candidates, recruiters] = await Promise.all([
      prisma.job.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        take: 10,
        select: { id: true, title: true, status: true },
      }),
      prisma.candidate.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 10,
        select: { id: true, name: true, email: true, jobId: true },
      }),
      session.user.role === "ADMIN"
        ? prisma.user.findMany({
            where: {
              role: "RECRUITER",
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
            take: 10,
            select: { id: true, name: true, email: true },
          })
        : Promise.resolve([]),
    ]);

    return apiSuccess({ jobs, candidates, recruiters });
  } catch (error) {
    return handleApiError(error);
  }
}
