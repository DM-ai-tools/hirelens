import { notFound, redirect } from "next/navigation";
import "@/styles/hirelens-design.css";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { ProcessingView } from "@/components/screening/processing-view";

export default async function ProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    select: { title: true, minExperience: true, scoreThreshold: true, status: true },
  });
  if (!job) notFound();

  if (job.status === JobStatus.DRAFT) {
    redirect(`/screening/${id}/skills`);
  }

  return <ProcessingView jobId={id} initialJob={job} />;
}
