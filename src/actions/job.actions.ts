"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";
import { jobSchema } from "@/lib/validations";
import {
  parseJobDescription,
  parseJobDescriptionFile,
} from "@/services/parsing.service";
import { enqueueScreening } from "@/services/queue.service";
import type { ProposedSkillsConfig } from "@/lib/skills-config";
import { parseProposedSkills } from "@/lib/skills-config";
import { JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createJobAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const mustHaveRaw = formData.get("mustHaveSkills") as string;
  const niceToHaveRaw = formData.get("niceToHaveSkills") as string;

  const data = jobSchema.parse({
    title: formData.get("title"),
    department: formData.get("department") || undefined,
    location: formData.get("location") || undefined,
    employmentType: formData.get("employmentType") || undefined,
    minExperience: formData.get("minExperience"),
    mustHaveSkills: mustHaveRaw ? mustHaveRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
    niceToHaveSkills: niceToHaveRaw ? niceToHaveRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
    jdText: formData.get("jdText"),
    scoreThreshold: formData.get("scoreThreshold") || 70,
  });

  const jdFile = formData.get("jdFile") as File | null;
  let jdFilePath: string | undefined;
  if (jdFile && jdFile.size > 0) {
    const saved = await saveUpload(jdFile, "jobs");
    jdFilePath = saved.filePath;
  }

  const job = await prisma.job.create({
    data: {
      ...data,
      jdFilePath,
      createdById: session.user.id,
    },
  });

  revalidatePath("/dashboard/jobs");
  return job;
}

export async function startScreeningAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  let jdText = ((formData.get("jdText") as string) || "").trim();
  const minExpRaw = formData.get("minExperience");
  const minExperience =
    minExpRaw != null && String(minExpRaw).trim() !== ""
      ? Math.max(0, Number(minExpRaw))
      : 0;
  const scoreThreshold = parseFloat(formData.get("scoreThreshold") as string) || 70;
  const mandatoryRequirements = ((formData.get("mandatoryRequirements") as string) || "").trim();
  const roleTag = ((formData.get("roleTag") as string) || "").trim() || null;

  const jdFile = formData.get("jdFile") as File | null;
  let jdFilePath: string | undefined;

  if (jdFile && jdFile.size > 0) {
    const saved = await saveUpload(jdFile, "jobs");
    jdFilePath = saved.filePath;
    const parsedFromFile = await parseJobDescriptionFile(saved.filePath, saved.fileName);
    jdText = parsedFromFile;
  }

  if (!jdText || jdText.length < 30) {
    throw new Error("Add a job description — paste text or upload a document (PDF, DOCX, TXT, etc.)");
  }

  const extracted = await parseJobDescription(jdText, title, minExperience);
  const finalMustHave = extracted.mustHaveSkills;
  const finalNiceToHave = extracted.niceToHaveSkills;
  const finalTitle = title?.trim() || extracted.title || "Untitled Role";

  if (finalMustHave.length === 0) {
    throw new Error(
      "No competencies or required skills found in the job description. Add a Competencies section or paste a clearer JD."
    );
  }

  const resumeFiles = formData.getAll("resumes") as File[];
  const validResumes = resumeFiles.filter((f) => f && f.size > 0);
  if (validResumes.length === 0) {
    throw new Error("Add at least one resume");
  }

  const scoringConfig: ProposedSkillsConfig = {
    proposedMustHave: finalMustHave,
    proposedNiceToHave: finalNiceToHave,
    skillsConfirmed: false,
  };

  const job = await prisma.job.create({
    data: {
      title: finalTitle,
      roleTag,
      jdText,
      jdFilePath,
      minExperience,
      mustHaveSkills: finalMustHave,
      niceToHaveSkills: finalNiceToHave,
      mandatoryRequirements: mandatoryRequirements || null,
      scoreThreshold,
      status: JobStatus.DRAFT,
      scoringConfig,
      createdById: session.user.id,
    },
  });

  for (const file of validResumes) {
    const saved = await saveUpload(file, `jobs/${job.id}`);
    await prisma.candidate.create({
      data: {
        jobId: job.id,
        resumePath: saved.filePath,
        resumeFileName: saved.fileName,
      },
    });
  }

  redirect(`/screening/${job.id}/skills`);
}

export async function confirmScreeningSkillsAction(jobId: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, createdById: true, status: true, scoringConfig: true },
  });
  if (!job) throw new Error("Job not found");
  if (job.createdById !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const mustHaveSkills = formData
    .getAll("mustHaveSkills")
    .map((s) => String(s).trim())
    .filter(Boolean);
  const niceToHaveSkills = formData
    .getAll("niceToHaveSkills")
    .map((s) => String(s).trim())
    .filter(Boolean);

  if (mustHaveSkills.length === 0) {
    throw new Error("Select at least one must-have skill to continue");
  }

  const proposed = parseProposedSkills(job.scoringConfig);
  const scoringConfig: ProposedSkillsConfig = {
    proposedMustHave: proposed?.proposedMustHave ?? mustHaveSkills,
    proposedNiceToHave: proposed?.proposedNiceToHave ?? niceToHaveSkills,
    skillsConfirmed: true,
  };

  await prisma.job.update({
    where: { id: jobId },
    data: {
      mustHaveSkills,
      niceToHaveSkills,
      scoringConfig,
      status: JobStatus.PROCESSING,
    },
  });

  await enqueueScreening(jobId);
  redirect(`/processing/${jobId}`);
}

export async function uploadResumesAction(jobId: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const files = formData.getAll("resumes") as File[];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const saved = await saveUpload(file, `jobs/${jobId}`);
    await prisma.candidate.create({
      data: {
        jobId,
        resumePath: saved.filePath,
        resumeFileName: saved.fileName,
      },
    });
  }

  await enqueueScreening(jobId);
  revalidatePath(`/processing/${jobId}`);
  redirect(`/processing/${jobId}`);
}

export async function generateReportAction(jobId: string, format: "pdf" | "xlsx") {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { generatePdfReport, generateExcelReport } = await import("@/services/report.service");
  const filePath =
    format === "pdf"
      ? await generatePdfReport(jobId)
      : await generateExcelReport(jobId);

  return filePath;
}
