import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { SendStatus } from "@prisma/client";
import { readUploadFile } from "@/lib/storage";
import {
  replaceTemplateVars,
  formatDeadlineDisplay,
  type EmailTemplateVars,
} from "@/lib/assessment-email-templates";
import {
  buildAssessmentLinksHtml,
  getAssessmentFiles,
  primaryAssessmentLink,
} from "@/lib/assessment-files";
import { loadAssessmentsWithFilesByIds } from "@/lib/assessment-queries";
import { getAppBaseUrl } from "@/lib/assessment-download";
import path from "path";

async function getResendClient() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const apiKey = settings?.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Resend API key not configured");
  return new Resend(apiKey);
}

function candidateSummary(candidate: {
  score: number | null;
  strengths: string[];
  aiRationale: string | null;
  overallExperience: number | null;
}): string {
  const parts: string[] = [];
  if (candidate.score != null) parts.push(`AI score: ${Math.round(candidate.score)}%`);
  if (candidate.overallExperience != null) parts.push(`${candidate.overallExperience}y experience`);
  if (candidate.strengths.length) parts.push(`Strengths: ${candidate.strengths.slice(0, 5).join(", ")}`);
  if (candidate.aiRationale) parts.push(candidate.aiRationale.slice(0, 300));
  return parts.join(". ") || "Qualified candidate from recent screening.";
}

function enrichBodyForMultipleAssessments(
  bodyHtml: string,
  assessments: Array<{ id: string; name: string; type: string; url: string | null; filePath: string | null; files?: { id: string; fileName: string; filePath: string }[] }>,
  baseUrl: string
) {
  if (assessments.length <= 1) return bodyHtml;
  const links = buildAssessmentLinksHtml(assessments, baseUrl);
  if (!links) return bodyHtml;
  return `${bodyHtml}<div style="margin-top:20px"><p><strong>Included assessments:</strong></p>${links}</div>`;
}

export async function sendConfiguredAssessmentEmails(params: {
  candidateIds: string[];
  assessmentIds: string[];
  deadline: Date;
  timezone: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  templateId?: string;
  templateName: string;
  aiGenerated: boolean;
  sentById: string;
}) {
  const assessments = await loadAssessmentsWithFilesByIds(params.assessmentIds);

  if (assessments.length !== params.assessmentIds.length) {
    throw new Error("One or more assessments were not found");
  }

  for (const assessment of assessments) {
    if (assessment.type === "LINK" && !assessment.url) {
      throw new Error(`Assessment "${assessment.name}" is missing a link`);
    }
    if (assessment.type === "ATTACHMENT" && getAssessmentFiles(assessment).length === 0) {
      throw new Error(`Assessment "${assessment.name}" has no files uploaded`);
    }
  }

  const [settings, sender] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "default" } }),
    prisma.user.findUnique({ where: { id: params.sentById } }),
  ]);

  const companyName = settings?.companyName || "DOTMappers";
  const recruiterName = sender?.name || "Talent Acquisition Team";
  const deadlineStr = formatDeadlineDisplay(params.deadline, params.timezone);
  const baseUrl = getAppBaseUrl();
  const assessmentName = assessments.map((a) => a.name).join(", ");
  const primaryLink = primaryAssessmentLink(assessments[0], baseUrl);

  const resend = await getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "HireLens <onboarding@resend.dev>";

  const attachments = [];
  for (const assessment of assessments) {
    if (assessment.type !== "ATTACHMENT") continue;
    for (const file of getAssessmentFiles(assessment)) {
      attachments.push({
        filename: file.fileName || path.basename(file.filePath).replace(/^\d+-/, ""),
        content: await readUploadFile(file.filePath),
      });
    }
  }

  const results = [];

  for (const candidateId of params.candidateIds) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { job: true },
    });

    if (!candidate?.email) {
      results.push({ candidateId, success: false, error: "No email address" });
      continue;
    }

    const vars: EmailTemplateVars = {
      candidate_name: candidate.name || "Candidate",
      job_title: candidate.job.title,
      company_name: companyName,
      assessment_name: assessmentName,
      assessment_link: primaryLink,
      deadline: deadlineStr,
      recruiter_name: recruiterName,
    };

    const subject = replaceTemplateVars(params.subjectTemplate, vars);
    const bodyHtml = enrichBodyForMultipleAssessments(
      replaceTemplateVars(params.bodyHtmlTemplate, vars),
      assessments,
      baseUrl
    );

    const sendRecords = await Promise.all(
      assessments.map((assessment) =>
        prisma.assessmentSend.create({
          data: {
            candidateId,
            assessmentId: assessment.id,
            email: candidate.email!,
            templateId: params.templateId,
            templateName: params.templateName,
            subject,
            bodyHtml,
            deadline: params.deadline,
            timezone: params.timezone,
            aiGenerated: params.aiGenerated,
            sentById: params.sentById,
            status: SendStatus.QUEUED,
          },
        })
      )
    );

    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: candidate.email,
        subject,
        html: bodyHtml,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      await Promise.all(
        sendRecords.map((send) =>
          prisma.assessmentSend.update({
            where: { id: send.id },
            data: {
              status: SendStatus.SENT,
              providerMsgId: result.data?.id,
              sentAt: new Date(),
            },
          })
        )
      );
      results.push({ candidateId, success: true, send: sendRecords[0] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Send failed";
      await Promise.all(
        sendRecords.map((send) =>
          prisma.assessmentSend.update({
            where: { id: send.id },
            data: { status: SendStatus.FAILED, errorMessage: message },
          })
        )
      );
      results.push({ candidateId, success: false, error: message });
    }
  }

  return results;
}

export { candidateSummary };
