import { prisma } from "@/lib/prisma";
import JobsClient from "./jobs-client";

export default async function AdminJobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { candidates: true } },
    },
  });

  const rows = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    department: j.department,
    status: j.status,
    candidateCount: j._count.candidates,
    recruiterName: j.createdBy.name,
    createdAt: j.createdAt.toISOString(),
  }));

  return <JobsClient jobs={rows} />;
}
