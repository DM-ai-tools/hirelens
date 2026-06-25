import { notFound, redirect } from "next/navigation";
import "@/styles/hirelens-design.css";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseProposedSkills } from "@/lib/skills-config";
import { JobStatus } from "@prisma/client";
import { TopBar, SiteNav } from "@/components/brand/brand-logo";
import { SkillsSelectionForm } from "@/components/screening/skills-selection-form";

export default async function SkillsSelectionPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=%2F");

  const { jobId } = await params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      status: true,
      mustHaveSkills: true,
      niceToHaveSkills: true,
      scoringConfig: true,
      createdById: true,
      _count: { select: { candidates: true } },
    },
  });

  if (!job) notFound();
  if (job.createdById !== session.user.id && session.user.role !== "ADMIN") {
    notFound();
  }

  if (job.status !== JobStatus.DRAFT) {
    redirect(`/processing/${jobId}`);
  }

  const proposed = parseProposedSkills(job.scoringConfig);
  const mustHaveSkills = proposed?.proposedMustHave.length
    ? proposed.proposedMustHave
    : job.mustHaveSkills;
  const niceToHaveSkills = proposed?.proposedNiceToHave.length
    ? proposed.proposedNiceToHave
    : job.niceToHaveSkills;

  return (
    <div className="hirelens-page skills-page hirelens-gradient">
      <TopBar />
      <SiteNav />

      <main className="skills-main">
        <SkillsSelectionForm
          jobId={job.id}
          jobTitle={job.title}
          mustHaveSkills={mustHaveSkills}
          niceToHaveSkills={niceToHaveSkills}
          resumeCount={job._count.candidates}
        />
      </main>
    </div>
  );
}
