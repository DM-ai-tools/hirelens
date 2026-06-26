import { notFound } from "next/navigation";
import "@/styles/hirelens-design.css";
import { CandidateStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getModelDisplayName } from "@/lib/constants";
import { sanitizeExperienceIntelligence } from "@/lib/experience-intelligence.utils";
import { resolveCandidateLocation } from "@/lib/resume-location";
import { filterAssessmentsForJob } from "@/lib/assessment-match";
import { assessmentHasFiles } from "@/lib/assessment-files";
import { loadAssessmentsWithFiles } from "@/lib/assessment-queries";
import { ReportClient } from "@/components/report/report-client";
import { auth } from "@/lib/auth";
import {
  companiesNeedWebEnrichment,
  enrichExperienceIntelligenceCompanies,
} from "@/services/company-enrichment.service";
import { hasAnthropicApiKey } from "@/services/ai.service";
import { runExperienceIntelligence, rankExperienceIntelligence } from "@/services/experience-intelligence.service";
import { resolveCandidateVerdict } from "@/services/scoring.service";
import type { ExperienceIntelligenceResult, ParsedResume, ScoreBreakdown } from "@/types";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [job, assessments, processingRun, settings, emailTemplates, emailActivity] = await Promise.all([
    prisma.job.findUnique({
      where: { id },
      include: {
        candidates: { orderBy: [{ rank: "asc" }, { score: "desc" }] },
      },
    }),
    loadAssessmentsWithFiles({ where: { active: true } }),
    prisma.processingRun.findFirst({
      where: { jobId: id },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true, completedAt: true },
    }),
    prisma.settings.findUnique({ where: { id: "default" } }),
    prisma.emailTemplate.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.assessmentSend.findMany({
      where: { candidate: { jobId: id } },
      orderBy: { createdAt: "desc" },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        assessment: { select: { name: true } },
      },
    }),
  ]);

  if (!job) notFound();

  const matchedAssessments = filterAssessmentsForJob(assessments, {
    title: job.title,
    department: job.department,
    roleTag: job.roleTag,
  });

  const evaluatedCandidates = job.candidates.filter(
    (c) => c.status === CandidateStatus.EVALUATED
  );

  const missingExpIntel = evaluatedCandidates.filter((c) => c.experienceIntelligenceScore == null);
  if (missingExpIntel.length > 0 && missingExpIntel.length <= 25) {
    for (const c of missingExpIntel) {
      if (!c.rawText) continue;
      try {
        const expIntel = await runExperienceIntelligence(
          c.rawText,
          (c.parsedData as ParsedResume | null) ?? null,
          {
            title: job.title,
            jdText: job.jdText,
            mustHaveSkills: job.mustHaveSkills,
            mandatoryRequirements: job.mandatoryRequirements,
          }
        );
        await prisma.candidate.update({
          where: { id: c.id },
          data: {
            experienceIntelligenceScore: expIntel.score,
            experienceIntelligenceData: expIntel as object,
          },
        });
        c.experienceIntelligenceScore = expIntel.score;
        c.experienceIntelligenceData = expIntel as object;
      } catch (error) {
        console.error(`Report backfill experience intelligence failed for ${c.id}:`, error);
      }
    }

    const expRanks = rankExperienceIntelligence(
      evaluatedCandidates.map((c) => ({
        id: c.id,
        score: c.experienceIntelligenceScore,
      }))
    );
    for (const r of expRanks) {
      await prisma.candidate.update({
        where: { id: r.id },
        data: { experienceIntelligenceRank: r.rank },
      });
      const match = evaluatedCandidates.find((c) => c.id === r.id);
      if (match) match.experienceIntelligenceRank = r.rank;
    }
  }

  const withExpIntel = evaluatedCandidates.filter((c) => c.experienceIntelligenceScore != null);
  if (withExpIntel.length > 0) {
    const expRanks = rankExperienceIntelligence(
      withExpIntel.map((c) => ({
        id: c.id,
        score: c.experienceIntelligenceScore,
      }))
    );
    for (const r of expRanks) {
      const match = evaluatedCandidates.find((c) => c.id === r.id);
      if (match) match.experienceIntelligenceRank = r.rank;
      await prisma.candidate.update({
        where: { id: r.id },
        data: { experienceIntelligenceRank: r.rank },
      });
    }
  }

  const hasKey = await hasAnthropicApiKey();
  if (hasKey && evaluatedCandidates.length <= 25) {
    for (const c of evaluatedCandidates) {
      if (!c.experienceIntelligenceData) continue;
      const ei = sanitizeExperienceIntelligence(
        c.experienceIntelligenceData as unknown as ExperienceIntelligenceResult
      );
      if (!companiesNeedWebEnrichment(ei.companies)) continue;
      try {
        const enriched = await enrichExperienceIntelligenceCompanies(ei, undefined, {
          title: job.title,
          jdText: job.jdText,
        });
        await prisma.candidate.update({
          where: { id: c.id },
          data: {
            experienceIntelligenceData: enriched as object,
            experienceIntelligenceScore: enriched.score,
          },
        });
        c.experienceIntelligenceData = enriched as object;
        c.experienceIntelligenceScore = enriched.score;
      } catch (error) {
        console.error(`Report company web enrichment failed for ${c.id}:`, error);
      }
    }
  }

  return (
    <ReportClient
      job={{
        id: job.id,
        title: job.title,
        minExperience: job.minExperience,
        scoreThreshold: job.scoreThreshold,
        mustHaveSkills: job.mustHaveSkills,
        niceToHaveSkills: job.niceToHaveSkills,
        mandatoryRequirements: job.mandatoryRequirements,
        modelName: getModelDisplayName(),
        completedAt: processingRun?.completedAt?.toISOString() ?? null,
        runtimeSeconds:
          processingRun?.startedAt && processingRun?.completedAt
            ? Math.round(
                (processingRun.completedAt.getTime() - processingRun.startedAt.getTime()) / 1000
              )
            : null,
        failedCount: job.candidates.filter((c) => c.status === CandidateStatus.FAILED).length,
        candidates: evaluatedCandidates.map((c) => {
          const breakdown = c.scoreBreakdown as ScoreBreakdown | null;
          const { stats, goodToCall } = resolveCandidateVerdict(
            c.score,
            job.mustHaveSkills,
            job.scoreThreshold,
            {
              llmRaw: c.llmRaw,
              missingSkills: c.missingSkills,
              hasIdentity: !!(c.email || c.name),
              storedStats: breakdown ?? undefined,
            }
          );

          return {
            id: c.id,
            rank: c.rank,
            name: c.name,
            email: c.email,
            phone: c.phone,
            location: resolveCandidateLocation(c),
            overallExperience: c.overallExperience,
            relevantExperience: c.relevantExperience,
            strengths: c.strengths,
            missingSkills: c.missingSkills,
            matchedSkills: c.matchedSkills,
            score: c.score,
            goodToCall,
            mustHaveStats: stats,
            selected: c.selected,
            aiRationale: c.aiRationale,
            experienceIntelligenceRank: c.experienceIntelligenceRank,
            experienceIntelligenceScore: c.experienceIntelligenceScore,
            experienceIntelligence: c.experienceIntelligenceData
              ? sanitizeExperienceIntelligence(
                  c.experienceIntelligenceData as unknown as ExperienceIntelligenceResult
                )
              : null,
          };
        }),
      }}
      assessments={matchedAssessments.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        url: a.url,
        roleTag: a.roleTag,
        description: a.description,
        hasFile: assessmentHasFiles(a),
        files: a.files.map((f) => ({ id: f.id, fileName: f.fileName })),
      }))}
      companyName={settings?.companyName ?? "DOTMappers"}
      recruiterName={session?.user?.name ?? "Recruiter"}
      defaultAssessmentDays={settings?.defaultAssessmentDays ?? 7}
      emailTemplates={emailTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        bodyHtml: t.bodyHtml,
      }))}
      emailActivity={emailActivity.map((e) => ({
        id: e.id,
        candidateId: e.candidateId,
        candidateName: e.candidate.name || "Candidate",
        candidateEmail: e.email,
        assessmentName: e.assessment.name,
        deadline: e.deadline?.toISOString() ?? null,
        sentAt: e.sentAt?.toISOString() ?? null,
        deliveredAt: e.deliveredAt?.toISOString() ?? null,
        openedAt: e.openedAt?.toISOString() ?? null,
        clickedAt: e.clickedAt?.toISOString() ?? null,
        status: e.status,
        subject: e.subject,
        bodyHtml: e.bodyHtml,
        templateName: e.templateName,
        aiGenerated: e.aiGenerated,
        timezone: e.timezone,
      }))}
    />
  );
}
