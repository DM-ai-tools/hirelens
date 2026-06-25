import { after } from "next/server";
import { CandidateStatus, JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const activeJobs = new Set<string>();

const PENDING_STATUSES: CandidateStatus[] = [
  CandidateStatus.UPLOADED,
  CandidateStatus.PARSING,
  CandidateStatus.PARSED,
  CandidateStatus.EVALUATING,
];

async function runPipeline(jobId: string) {
  if (activeJobs.has(jobId)) return;
  activeJobs.add(jobId);
  try {
    const { processJobPipeline } = await import("./processing.service");
    await processJobPipeline(jobId);
  } catch (error) {
    console.error(`[Queue] Pipeline failed for job ${jobId}:`, error);
    const pending = await countPendingCandidates(jobId).catch(() => 0);
    await prisma.job
      .update({
        where: { id: jobId },
        data: {
          status: pending > 0 ? JobStatus.PROCESSING : JobStatus.FAILED,
        },
      })
      .catch(() => undefined);
  } finally {
    activeJobs.delete(jobId);
  }
}

/** Schedule screening in the background (survives redirects and response completion). */
export function startScreeningPipeline(jobId: string) {
  const start = () => {
    void runPipeline(jobId);
  };
  try {
    after(start);
  } catch {
    start();
  }
}

async function countPendingCandidates(jobId: string) {
  return prisma.candidate.count({
    where: {
      jobId,
      OR: [
        { status: { in: PENDING_STATUSES } },
        { status: CandidateStatus.FAILED, rawText: { not: null } },
      ],
    },
  });
}

async function resetStuckCandidates(jobId: string) {
  await prisma.candidate.updateMany({
    where: { jobId, status: CandidateStatus.PARSING },
    data: { status: CandidateStatus.UPLOADED },
  });
  await prisma.candidate.updateMany({
    where: { jobId, status: CandidateStatus.EVALUATING },
    data: { status: CandidateStatus.PARSED },
  });
  await prisma.candidate.updateMany({
    where: { jobId, status: CandidateStatus.FAILED, rawText: { not: null } },
    data: { status: CandidateStatus.PARSED },
  });
}

export async function enqueueScreening(jobId: string) {
  const useRedis = process.env.USE_REDIS_QUEUE === "true";

  if (useRedis) {
    try {
      const { screeningQueue } = await import("./queue.redis");
      await screeningQueue.add(
        "process-job",
        { jobId },
        { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
      );
      return;
    } catch (error) {
      console.warn("[Queue] Redis unavailable, processing inline:", error);
    }
  }

  startScreeningPipeline(jobId);
}

/** Idempotent — safe to call from the processing page if the pipeline has not started. */
export async function ensureScreeningStarted(jobId: string) {
  if (activeJobs.has(jobId)) {
    return { started: true, reason: "running" as const };
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true },
  });

  if (!job) return { started: false, reason: "not_found" as const };

  if (job.status === JobStatus.DRAFT) {
    return { started: false, reason: "awaiting_skills" as const };
  }

  const pending = await countPendingCandidates(jobId);
  if (pending === 0) {
    return { started: false, reason: "already_done" as const };
  }

  if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.PROCESSING },
    });
  }

  await resetStuckCandidates(jobId);
  startScreeningPipeline(jobId);
  return { started: true, reason: "started" as const };
}

export function isJobActive(jobId: string) {
  return activeJobs.has(jobId);
}
