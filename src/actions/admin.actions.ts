"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  userSchema,
  assessmentSchema,
  emailTemplateSchema,
  settingsSchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveUpload, getMimeType } from "@/lib/storage";
import { unlink } from "fs/promises";
import { collectFilesFromFormData, getAssessmentFiles } from "@/lib/assessment-files";
import { loadAssessmentWithFiles } from "@/lib/assessment-queries";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

async function audit(userId: string, action: string, entity: string, metadata?: object) {
  await prisma.auditLog.create({
    data: { userId, action, entity, metadata: metadata ?? {} },
  });
}

// ——— Recruiters ———

export async function createRecruiter(formData: FormData) {
  const session = await requireAdmin();
  const data = userSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "RECRUITER",
    active: formData.get("active") !== "false",
  });
  if (!data.password) throw new Error("Password required");

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      active: data.active,
    },
  });
  await audit(session.user.id, "CREATE_RECRUITER", "User", { email: data.email });
  revalidatePath("/admin/recruiters");
}

export async function updateRecruiter(id: string, formData: FormData) {
  const session = await requireAdmin();
  const data = userSchema.partial().parse({
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    role: formData.get("role") || undefined,
    active: formData.has("active") ? formData.get("active") !== "false" : undefined,
  });
  const password = formData.get("password") as string | null;

  await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.role && { role: data.role }),
      ...(data.active !== undefined && { active: data.active }),
      ...(password && password.length >= 8 && { passwordHash: await hashPassword(password) }),
    },
  });
  await audit(session.user.id, "UPDATE_RECRUITER", "User", { id });
  revalidatePath("/admin/recruiters");
}

export async function toggleRecruiterActive(id: string, active: boolean) {
  const session = await requireAdmin();
  await prisma.user.update({ where: { id }, data: { active } });
  await audit(session.user.id, active ? "ENABLE_RECRUITER" : "DISABLE_RECRUITER", "User", { id });
  revalidatePath("/admin/recruiters");
}

export async function deleteRecruiter(id: string) {
  const session = await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role === "ADMIN") throw new Error("Cannot delete this user");
  await prisma.user.delete({ where: { id } });
  await audit(session.user.id, "DELETE_RECRUITER", "User", { id });
  revalidatePath("/admin/recruiters");
}

// ——— Assessments ———

async function saveAssessmentFiles(assessmentId: string, files: File[], startOrder = 0) {
  for (const [offset, file] of files.entries()) {
    const saved = await saveUpload(file, "assessments");
    await prisma.assessmentFile.create({
      data: {
        assessmentId,
        filePath: saved.filePath,
        fileName: saved.fileName,
        mimeType: getMimeType(saved.fileName),
        sizeBytes: file.size,
        sortOrder: startOrder + offset,
      },
    });
  }
}

export async function createAssessmentAction(formData: FormData) {
  const session = await requireAdmin();
  const type = (formData.get("type") as string) || "LINK";
  const uploadedFiles = collectFilesFromFormData(formData);

  let filePath: string | null = null;
  let url = ((formData.get("url") as string) || "").trim();

  if (type === "ATTACHMENT") {
    if (uploadedFiles.length === 0) throw new Error("Please upload at least one assessment file");
    url = "";
  }

  const data = assessmentSchema.parse({
    name: formData.get("name"),
    type,
    url,
    roleTag: formData.get("roleTag") || undefined,
    description: formData.get("description") || undefined,
    active: formData.get("active") !== "false",
  });

  const assessment = await prisma.assessment.create({
    data: {
      name: data.name,
      type: data.type,
      url: data.type === "LINK" ? data.url || null : null,
      filePath,
      roleTag: data.roleTag,
      description: data.description,
      active: data.active,
    },
  });

  if (type === "ATTACHMENT") {
    await saveAssessmentFiles(assessment.id, uploadedFiles);
  }

  await audit(session.user.id, "CREATE_ASSESSMENT", "Assessment", { name: data.name });
  revalidatePath("/admin/assessments");
  revalidatePath("/report");
}

export async function updateAssessment(id: string, formData: FormData) {
  const session = await requireAdmin();
  const existing = await loadAssessmentWithFiles(id);
  if (!existing) throw new Error("Assessment not found");

  const type = (formData.get("type") as string) || existing.type;
  const uploadedFiles = collectFilesFromFormData(formData);
  const removeFileIds = formData
    .getAll("removeFileIds")
    .map((v) => String(v))
    .filter(Boolean);

  let filePath = existing.filePath;
  let url = ((formData.get("url") as string) || "").trim();

  if (type === "ATTACHMENT") {
    for (const fileId of removeFileIds) {
      const file = existing.files.find((f) => f.id === fileId);
      if (file) {
        await unlink(file.filePath).catch(() => {});
        await prisma.assessmentFile.delete({ where: { id: fileId } });
      }
    }

    const remainingFiles = existing.files.filter((f) => !removeFileIds.includes(f.id));
    if (uploadedFiles.length > 0) {
      await saveAssessmentFiles(id, uploadedFiles, remainingFiles.length);
    }

    const refreshed = await loadAssessmentWithFiles(id);
    const totalFiles = getAssessmentFiles(refreshed ?? existing).length;
    if (totalFiles === 0 && uploadedFiles.length === 0) {
      throw new Error("Please keep or upload at least one assessment file");
    }
    url = "";
  } else {
    for (const file of existing.files) {
      await unlink(file.filePath).catch(() => {});
    }
    await prisma.assessmentFile.deleteMany({ where: { assessmentId: id } });
    if (existing.filePath) {
      await unlink(existing.filePath).catch(() => {});
    }
    filePath = null;
  }

  const data = assessmentSchema.parse({
    name: formData.get("name"),
    type,
    url,
    roleTag: formData.get("roleTag") || undefined,
    description: formData.get("description") || undefined,
    active: formData.get("active") !== "false",
  });

  await prisma.assessment.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      url: data.type === "LINK" ? data.url || null : null,
      filePath: data.type === "ATTACHMENT" ? filePath : null,
      roleTag: data.roleTag,
      description: data.description,
      active: data.active,
    },
  });
  await audit(session.user.id, "UPDATE_ASSESSMENT", "Assessment", { id });
  revalidatePath("/admin/assessments");
  revalidatePath("/report");
}

export async function toggleAssessmentActive(id: string, active: boolean) {
  const session = await requireAdmin();
  await prisma.assessment.update({ where: { id }, data: { active } });
  await audit(session.user.id, active ? "ENABLE_ASSESSMENT" : "DISABLE_ASSESSMENT", "Assessment", { id });
  revalidatePath("/admin/assessments");
}

export async function deleteAssessment(id: string) {
  const session = await requireAdmin();
  const existing = await loadAssessmentWithFiles(id);
  if (existing?.filePath) {
    await unlink(existing.filePath).catch(() => {});
  }
  for (const file of existing?.files ?? []) {
    await unlink(file.filePath).catch(() => {});
  }
  await prisma.assessment.delete({ where: { id } });
  await audit(session.user.id, "DELETE_ASSESSMENT", "Assessment", { id });
  revalidatePath("/admin/assessments");
}

// ——— Email templates ———

export async function createEmailTemplate(formData: FormData) {
  const session = await requireAdmin();
  const data = emailTemplateSchema.parse({
    name: formData.get("name"),
    subject: formData.get("subject"),
    bodyHtml: formData.get("bodyHtml"),
    active: formData.get("active") !== "false",
  });

  await prisma.emailTemplate.create({ data });
  await audit(session.user.id, "CREATE_EMAIL_TEMPLATE", "EmailTemplate", { name: data.name });
  revalidatePath("/admin/templates");
}

export async function updateEmailTemplate(id: string, formData: FormData) {
  const session = await requireAdmin();
  const data = emailTemplateSchema.parse({
    name: formData.get("name"),
    subject: formData.get("subject"),
    bodyHtml: formData.get("bodyHtml"),
    active: formData.get("active") !== "false",
  });

  await prisma.emailTemplate.update({ where: { id }, data });
  await audit(session.user.id, "UPDATE_EMAIL_TEMPLATE", "EmailTemplate", { id });
  revalidatePath("/admin/templates");
}

export async function deleteEmailTemplate(id: string) {
  const session = await requireAdmin();
  await prisma.emailTemplate.delete({ where: { id } });
  await audit(session.user.id, "DELETE_EMAIL_TEMPLATE", "EmailTemplate", { id });
  revalidatePath("/admin/templates");
}

// ——— Settings ———

export async function updateSettings(formData: FormData) {
  const session = await requireAdmin();
  const data = settingsSchema.parse({
    companyName: formData.get("companyName"),
    companyLogo: formData.get("companyLogo") || undefined,
    primaryColor: formData.get("primaryColor"),
    anthropicApiKey: formData.get("anthropicApiKey") || undefined,
    resendApiKey: formData.get("resendApiKey") || undefined,
    defaultAssessmentDays: formData.get("defaultAssessmentDays"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
  });

  const existing = await prisma.settings.findUnique({ where: { id: "default" } });

  await prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: {
      ...data,
      anthropicApiKey: data.anthropicApiKey || existing?.anthropicApiKey,
      resendApiKey: data.resendApiKey || existing?.resendApiKey,
    },
  });
  await audit(session.user.id, "UPDATE_SETTINGS", "Settings");
  revalidatePath("/admin/settings");
}

// ——— Profile ———

const profileSchema = z.object({
  name: z.string().min(2),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function updateAdminProfile(formData: FormData) {
  const session = await requireAdmin();
  const data = profileSchema.parse({ name: formData.get("name") });
  await prisma.user.update({ where: { id: session.user.id }, data: { name: data.name } });
  await audit(session.user.id, "UPDATE_PROFILE", "User");
  revalidatePath("/admin/profile");
}

export async function changeAdminPassword(formData: FormData) {
  const session = await requireAdmin();
  const data = passwordSchema.parse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  const valid = await verifyPassword(data.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
  await audit(session.user.id, "CHANGE_PASSWORD", "User");
  revalidatePath("/admin/profile");
}

// ——— Used by report flow (unchanged) ———

export async function toggleCandidateSelection(candidateId: string, selected: boolean) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  await prisma.candidate.update({ where: { id: candidateId }, data: { selected } });
  revalidatePath("/report");
  revalidatePath("/dashboard/candidates");
}

export async function sendAssessmentsAction(
  candidateIds: string[],
  assessmentId: string,
  deadline?: string
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { sendBulkAssessments } = await import("@/services/email.service");
  const deadlineDate = deadline ? new Date(deadline) : undefined;
  const results = await sendBulkAssessments(candidateIds, assessmentId, deadlineDate);
  await audit(session.user.id, "SEND_ASSESSMENTS", "AssessmentSend", {
    candidateIds,
    assessmentId,
    count: results.length,
  });
  revalidatePath("/dashboard/assessments");
  return results;
}
