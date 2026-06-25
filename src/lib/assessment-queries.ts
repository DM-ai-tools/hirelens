import { prisma } from "@/lib/prisma";

type AssessmentRow = Awaited<ReturnType<typeof prisma.assessment.findMany>>[number];
type AssessmentFileRow = Awaited<ReturnType<typeof prisma.assessmentFile.findMany>>[number];

function attachFiles<T extends AssessmentRow>(assessments: T[], files: AssessmentFileRow[]) {
  const filesByAssessmentId = new Map<string, AssessmentFileRow[]>();
  for (const file of files) {
    const bucket = filesByAssessmentId.get(file.assessmentId) ?? [];
    bucket.push(file);
    filesByAssessmentId.set(file.assessmentId, bucket);
  }

  return assessments.map((assessment) => ({
    ...assessment,
    files: filesByAssessmentId.get(assessment.id) ?? [],
  }));
}

async function loadFilesForAssessments(assessmentIds: string[]) {
  if (assessmentIds.length === 0) return [];
  return prisma.assessmentFile.findMany({
    where: { assessmentId: { in: assessmentIds } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export type AssessmentWithFiles = AssessmentRow & { files: AssessmentFileRow[] };

/** Load assessments and files without nested include (avoids Prisma client validation issues). */
export async function loadAssessmentsWithFiles(options?: {
  where?: { active?: boolean };
}): Promise<AssessmentWithFiles[]> {
  const assessments = await prisma.assessment.findMany({
    where: options?.where,
    orderBy: { name: "asc" },
  });

  const files = await loadFilesForAssessments(assessments.map((a) => a.id));
  return attachFiles(assessments, files);
}

export async function loadAssessmentsWithFilesByIds(ids: string[]): Promise<AssessmentWithFiles[]> {
  if (ids.length === 0) return [];

  const assessments = await prisma.assessment.findMany({
    where: { id: { in: ids } },
  });

  const files = await loadFilesForAssessments(assessments.map((a) => a.id));
  return attachFiles(assessments, files);
}

export async function loadAssessmentWithFiles(id: string): Promise<AssessmentWithFiles | null> {
  const assessment = await prisma.assessment.findUnique({ where: { id } });
  if (!assessment) return null;

  const files = await loadFilesForAssessments([id]);
  return attachFiles([assessment], files)[0] ?? null;
}
