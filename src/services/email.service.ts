import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { SendStatus } from "@prisma/client";
import { render } from "@react-email/components";
import AssessmentEmail from "@/emails/assessment-email";
import { readUploadFile } from "@/lib/storage";
import path from "path";

async function getResendClient() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const apiKey = settings?.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Resend API key not configured");
  return new Resend(apiKey);
}

export async function sendAssessmentEmail(params: {
  candidateId: string;
  assessmentId: string;
  deadline?: Date;
}) {
  const [candidate, assessment, settings] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id: params.candidateId },
      include: { job: true },
    }),
    prisma.assessment.findUnique({ where: { id: params.assessmentId } }),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  if (!candidate?.email) throw new Error("Candidate email not found");
  if (!assessment) throw new Error("Assessment not found");

  if (assessment.type === "LINK" && !assessment.url) {
    throw new Error("Assessment link is not configured");
  }
  if (assessment.type === "ATTACHMENT" && !assessment.filePath) {
    throw new Error("Assessment document is not uploaded");
  }

  const existing = await prisma.assessmentSend.findFirst({
    where: {
      candidateId: params.candidateId,
      assessmentId: params.assessmentId,
      status: { in: [SendStatus.SENT, SendStatus.DELIVERED, SendStatus.QUEUED] },
    },
  });
  if (existing) return existing;

  const send = await prisma.assessmentSend.create({
    data: {
      candidateId: params.candidateId,
      assessmentId: params.assessmentId,
      email: candidate.email,
      deadline: params.deadline,
      status: SendStatus.QUEUED,
    },
  });

  try {
    const isAttachment = assessment.type === "ATTACHMENT";
    const assessmentLink = assessment.url || undefined;

    const html = await render(
      AssessmentEmail({
        candidateName: candidate.name || "Candidate",
        assessmentName: assessment.name,
        assessmentLink,
        isAttachment,
        deadline: params.deadline?.toLocaleDateString() || "TBD",
        companyName: settings?.companyName || "DOTMappers",
        companyLogo: settings?.companyLogo,
      })
    );

    const resend = await getResendClient();
    const fromEmail = process.env.RESEND_FROM_EMAIL || "HireLens <onboarding@resend.dev>";

    const attachments =
      isAttachment && assessment.filePath
        ? [
            {
              filename: path.basename(assessment.filePath).replace(/^\d+-/, ""),
              content: await readUploadFile(assessment.filePath),
            },
          ]
        : undefined;

    const result = await resend.emails.send({
      from: fromEmail,
      to: candidate.email,
      subject: `Assessment: ${assessment.name} - ${settings?.companyName}`,
      html,
      attachments,
    });

    return await prisma.assessmentSend.update({
      where: { id: send.id },
      data: {
        status: SendStatus.SENT,
        providerMsgId: result.data?.id,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    return await prisma.assessmentSend.update({
      where: { id: send.id },
      data: { status: SendStatus.FAILED, errorMessage: message },
    });
  }
}

export async function sendBulkAssessments(
  candidateIds: string[],
  assessmentId: string,
  deadline?: Date
) {
  const results = [];
  for (const candidateId of candidateIds) {
    const result = await sendAssessmentEmail({ candidateId, assessmentId, deadline });
    results.push(result);
  }
  return results;
}
