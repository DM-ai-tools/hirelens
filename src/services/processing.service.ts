import { prisma } from "@/lib/prisma";
import { CandidateStatus, JobStatus } from "@prisma/client";
import { parseResumeFile } from "./parsing.service";
import { runEvaluation } from "./ai.service";
import { computeScore, rankCandidates } from "./scoring.service";
import {
  runExperienceIntelligence,
  rankExperienceIntelligence,
} from "./experience-intelligence.service";
import { getMissingMustHaveLabels } from "@/lib/constants";
import type { ParsedResume } from "@/types";

export async function processJobPipeline(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { candidates: true },
  });
  if (!job) throw new Error("Job not found");

  if (job.candidates.length === 0) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.COMPLETED },
    });
    return { parsedCount: 0, evaluatedCount: 0 };
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.PROCESSING },
  });

  const existingRun = await prisma.processingRun.findFirst({
    where: { jobId },
    orderBy: { startedAt: "desc" },
  });

  const run = existingRun
    ? await prisma.processingRun.update({
        where: { id: existingRun.id },
        data: {
          currentStage: "ingest",
          completedAt: null,
          totalCandidates: job.candidates.length,
        },
      })
    : await prisma.processingRun.create({
        data: {
          jobId,
          totalCandidates: job.candidates.length,
          currentStage: "ingest",
        },
      });

  const runId = run.id;

  let parsedCount = 0;
  let evaluatedCount = 0;

  // Stage 1: Parse
  await prisma.processingRun.update({
    where: { id: runId },
    data: { currentStage: "parse" },
  });

  for (const candidate of job.candidates) {
    if (candidate.status === CandidateStatus.EVALUATED) {
      parsedCount++;
      continue;
    }

    if (candidate.status === CandidateStatus.PARSED) {
      parsedCount++;
      continue;
    }

    if (candidate.status === CandidateStatus.FAILED && candidate.rawText) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { status: CandidateStatus.PARSED },
      });
      parsedCount++;
      continue;
    }

    try {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { status: CandidateStatus.PARSING },
      });

      const parsed = await parseResumeFile(
        candidate.resumePath,
        candidate.resumeFileName
      );

      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          status: CandidateStatus.PARSED,
          rawText: parsed.rawText,
          parsedData: parsed as object,
          name: parsed.name || candidate.name,
          email: parsed.email || candidate.email,
          phone: parsed.phone || candidate.phone,
        },
      });
      parsedCount++;
      await prisma.processingRun.update({
        where: { id: runId },
        data: { parsedCount, currentStage: "parse" },
      });
    } catch (error) {
      console.error(`Parse failed for ${candidate.id}:`, error);
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { status: CandidateStatus.FAILED },
      });
    }
  }

  // Stage 2: Experience intelligence extraction
  await prisma.processingRun.update({
    where: { id: runId },
    data: { currentStage: "extract", parsedCount },
  });

  // Stage 3: Evaluate (JD fit score)
  await prisma.processingRun.update({
    where: { id: runId },
    data: { currentStage: "evaluate" },
  });

  const parsedCandidates = await prisma.candidate.findMany({
    where: { jobId, status: CandidateStatus.PARSED },
  });

  for (const candidate of parsedCandidates) {
    try {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { status: CandidateStatus.EVALUATING },
      });

      const evaluation = await runEvaluation(candidate.rawText || "", {
        title: job.title,
        mustHaveSkills: job.mustHaveSkills,
        niceToHaveSkills: job.niceToHaveSkills,
        minExperience: job.minExperience,
        jdText: job.jdText,
        mandatoryRequirements: job.mandatoryRequirements,
      });

      const expIntel = await runExperienceIntelligence(
        candidate.rawText || "",
        (candidate.parsedData as ParsedResume | null) ?? null,
        {
          title: job.title,
          jdText: job.jdText,
          mustHaveSkills: job.mustHaveSkills,
          mandatoryRequirements: job.mandatoryRequirements,
        }
      );

      const { score, breakdown, goodToCall } = computeScore(
        evaluation,
        job.mustHaveSkills,
        job.niceToHaveSkills,
        job.minExperience,
        job.scoreThreshold,
        job.mandatoryRequirements
      );

      const matchedSkills = [
        ...evaluation.matched_must_have,
        ...evaluation.matched_nice_to_have,
      ];

      const mandatoryGaps = evaluation.recruiter_mandatory_gaps ?? [];
      const missingSkills = [
        ...getMissingMustHaveLabels(job.mustHaveSkills, evaluation.matched_must_have),
        ...mandatoryGaps.map((g) => `Mandatory: ${g}`),
      ];

      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          status: CandidateStatus.EVALUATED,
          name: evaluation.name || candidate.name,
          email: evaluation.email || candidate.email,
          phone: evaluation.mobile || candidate.phone,
          overallExperience: evaluation.overall_experience_years,
          relevantExperience: evaluation.relevant_experience_years,
          strengths: evaluation.strengths,
          missingSkills,
          matchedSkills,
          score,
          goodToCall,
          scoreBreakdown: breakdown as object,
          aiRationale: evaluation.rationale,
          llmRaw: evaluation as object,
          experienceIntelligenceScore: expIntel.score,
          experienceIntelligenceData: expIntel as object,
        },
      });
      evaluatedCount++;
      await prisma.processingRun.update({
        where: { id: runId },
        data: { evaluatedCount, currentStage: "evaluate" },
      });
    } catch (error) {
      console.error(`Evaluation failed for ${candidate.id}:`, error);
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { status: CandidateStatus.FAILED },
      });
    }
  }

  // Stage 3: Rank
  await prisma.processingRun.update({
    where: { id: runId },
    data: { currentStage: "rank" },
  });

  const evaluated = await prisma.candidate.findMany({
    where: { jobId, status: CandidateStatus.EVALUATED },
  });

  const ranked = rankCandidates(
    evaluated.map((c) => ({
      id: c.id,
      score: c.score,
      relevantExperience: c.relevantExperience,
      matchedSkills: c.matchedSkills,
    }))
  );

  for (const r of ranked) {
    await prisma.candidate.update({
      where: { id: r.id },
      data: { rank: r.rank },
    });
  }

  // Backfill experience intelligence for previously evaluated candidates
  const missingExpIntel = await prisma.candidate.findMany({
    where: {
      jobId,
      status: CandidateStatus.EVALUATED,
      experienceIntelligenceScore: null,
    },
  });

  for (const candidate of missingExpIntel) {
    try {
      const expIntel = await runExperienceIntelligence(
        candidate.rawText || "",
        (candidate.parsedData as ParsedResume | null) ?? null,
        {
          title: job.title,
          jdText: job.jdText,
          mustHaveSkills: job.mustHaveSkills,
          mandatoryRequirements: job.mandatoryRequirements,
        }
      );
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          experienceIntelligenceScore: expIntel.score,
          experienceIntelligenceData: expIntel as object,
        },
      });
    } catch (error) {
      console.error(`Experience intelligence backfill failed for ${candidate.id}:`, error);
    }
  }

  const allEvaluatedForExp = await prisma.candidate.findMany({
    where: { jobId, status: CandidateStatus.EVALUATED },
    select: { id: true, experienceIntelligenceScore: true },
  });
  const expRanks = rankExperienceIntelligence(
    allEvaluatedForExp.map((c) => ({ id: c.id, score: c.experienceIntelligenceScore }))
  );
  for (const r of expRanks) {
    await prisma.candidate.update({
      where: { id: r.id },
      data: { experienceIntelligenceRank: r.rank },
    });
  }

  const terminal = await prisma.candidate.findMany({
    where: { jobId },
    select: { status: true },
  });
  const totalCandidates = terminal.length;
  const finishedCount = terminal.filter(
    (c) =>
      c.status === CandidateStatus.EVALUATED || c.status === CandidateStatus.FAILED
  ).length;
  const allDone = totalCandidates > 0 && finishedCount >= totalCandidates;

  if (allDone) {
    await prisma.processingRun.update({
      where: { id: runId },
      data: {
        currentStage: "complete",
        completedAt: new Date(),
        parsedCount,
        evaluatedCount,
        etaSeconds: 0,
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.COMPLETED },
    });
  } else {
    const nextStage =
      parsedCount < totalCandidates ? "parse" : evaluatedCount > 0 ? "evaluate" : "parse";
    await prisma.processingRun.update({
      where: { id: runId },
      data: {
        currentStage: nextStage,
        parsedCount,
        evaluatedCount,
      },
    });
    await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.PROCESSING },
    });
  }

  return { parsedCount, evaluatedCount };
}

export async function getProcessingStatus(jobId: string) {
  const [job, run] = await Promise.all([
    prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true, minExperience: true, scoreThreshold: true },
    }),
    prisma.processingRun.findFirst({
      where: { jobId },
      orderBy: { startedAt: "desc" },
    }),
  ]);
  const candidates = await prisma.candidate.findMany({
    where: { jobId },
    select: {
      id: true,
      name: true,
      status: true,
      score: true,
      goodToCall: true,
      aiRationale: true,
      strengths: true,
      relevantExperience: true,
    },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
  });

  const total = run?.totalCandidates ?? candidates.length;
  const parsed = candidates.filter(
    (c) =>
      c.status !== CandidateStatus.UPLOADED &&
      c.status !== CandidateStatus.PARSING
  ).length;
  const evaluated = candidates.filter(
    (c) => c.status === CandidateStatus.EVALUATED
  ).length;
  const failed = candidates.filter((c) => c.status === CandidateStatus.FAILED).length;
  const finished = evaluated + failed;
  const isComplete = total > 0 && finished >= total;

  const remaining = Math.max(0, total - finished);
  const etaSeconds = isComplete ? 0 : remaining > 0 ? remaining * 8 : 0;

  const { getModelDisplayName } = await import("@/lib/constants");

  return {
    jobId,
    title: job?.title ?? "",
    minExperience: job?.minExperience ?? 0,
    scoreThreshold: job?.scoreThreshold ?? 70,
    modelName: getModelDisplayName(),
    total,
    parsed,
    evaluated,
    failed,
    finished,
    isComplete,
    currentStage: run?.currentStage ?? "ingest",
    etaSeconds,
    candidates,
  };
}
