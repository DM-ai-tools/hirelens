import { prisma } from "@/lib/prisma";
import ReportsClient from "./reports-client";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { generatedAt: "desc" },
    include: { job: { select: { title: true, id: true } } },
    take: 100,
  });

  const rows = reports.map((r) => ({
    id: r.id,
    jobId: r.job.id,
    jobTitle: r.job.title,
    format: r.format,
    generatedAt: r.generatedAt,
  }));

  return <ReportsClient reports={rows} />;
}
