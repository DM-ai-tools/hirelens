"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deadlineFromParts } from "@/lib/assessment-email-templates";
import { generateAssessmentEmailWithAI } from "@/services/assessment-email-ai.service";
import { sendConfiguredAssessmentEmails, candidateSummary } from "@/services/assessment-send.service";

const sendSchema = z.object({
  jobId: z.string(),
  candidateIds: z.array(z.string()).min(1),
  assessmentIds: z.array(z.string()).min(1),
  deadlineDate: z.string(),
  deadlineTime: z.string(),
  timezone: z.string(),
  subject: z.string().min(3),
  bodyHtml: z.string().min(10),
  templateId: z.string().optional(),
  templateName: z.string(),
  aiGenerated: z.boolean(),
});

const aiSchema = z.object({
  jobId: z.string(),
  candidateId: z.string(),
  assessmentIds: z.array(z.string()).min(1),
  deadlineDate: z.string(),
  deadlineTime: z.string(),
  timezone: z.string(),
  templateName: z.string(),
  currentSubject: z.string(),
  currentBodyHtml: z.string(),
});

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function generateAssessmentEmailAction(input: z.infer<typeof aiSchema>) {
  const session = await requireSession();
  const data = aiSchema.parse(input);

  const [job, candidate, assessments, settings] = await Promise.all([
    prisma.job.findUnique({ where: { id: data.jobId } }),
    prisma.candidate.findUnique({ where: { id: data.candidateId } }),
    prisma.assessment.findMany({ where: { id: { in: data.assessmentIds } } }),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  if (!job || !candidate || assessments.length === 0) {
    throw new Error("Missing job, candidate, or assessments");
  }

  const deadline = deadlineFromParts(data.deadlineDate, data.deadlineTime, data.timezone);
  const { formatDeadlineDisplay } = await import("@/lib/assessment-email-templates");

  return generateAssessmentEmailWithAI({
    jobTitle: job.title,
    jdText: job.jdText,
    candidateName: candidate.name || "Candidate",
    candidateSummary: candidateSummary(candidate),
    assessmentName: assessments.map((a) => a.name).join(", "),
    deadline: formatDeadlineDisplay(deadline, data.timezone),
    companyName: settings?.companyName || "DOTMappers",
    recruiterName: session.user.name || "Recruiter",
    templateName: data.templateName,
    currentSubject: data.currentSubject,
    currentBodyHtml: data.currentBodyHtml,
  });
}

export async function sendConfiguredAssessmentsAction(input: z.infer<typeof sendSchema>) {
  const session = await requireSession();
  const data = sendSchema.parse(input);

  const deadline = deadlineFromParts(data.deadlineDate, data.deadlineTime, data.timezone);
  if (deadline.getTime() <= Date.now()) {
    throw new Error("Deadline must be in the future");
  }

  const candidates = await prisma.candidate.findMany({
    where: { id: { in: data.candidateIds } },
    select: { id: true, name: true, email: true },
  });
  const missingEmail = candidates.filter((c) => !c.email?.trim());
  if (missingEmail.length > 0) {
    const names = missingEmail.map((c) => c.name || "Unknown candidate").join(", ");
    throw new Error(`Cannot send — missing email for: ${names}`);
  }

  const results = await sendConfiguredAssessmentEmails({
    candidateIds: data.candidateIds,
    assessmentIds: data.assessmentIds,
    deadline,
    timezone: data.timezone,
    subjectTemplate: data.subject,
    bodyHtmlTemplate: data.bodyHtml,
    templateId: data.templateId,
    templateName: data.templateName,
    aiGenerated: data.aiGenerated,
    sentById: session.user.id,
  });

  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SEND_ASSESSMENTS",
      entity: "AssessmentSend",
      metadata: {
        jobId: data.jobId,
        assessmentIds: data.assessmentIds,
        candidateIds: data.candidateIds,
        sent,
        failed,
      },
    },
  });

  revalidatePath(`/report/${data.jobId}`);
  revalidatePath("/admin/candidates");

  if (sent === 0) {
    throw new Error(results[0]?.error || "Failed to send any emails");
  }

  return { sent, failed, results };
}
