import { prisma } from "@/lib/prisma";

export type JobDescriptionRecord = {
  id: string;
  title: string;
  roleTag: string | null;
  jdText: string;
  fileName: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const selectFields = {
  id: true,
  title: true,
  roleTag: true,
  jdText: true,
  fileName: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function loadJobDescriptions(): Promise<JobDescriptionRecord[]> {
  return prisma.jobDescription.findMany({
    orderBy: [{ active: "desc" }, { title: "asc" }],
    select: selectFields,
  });
}

export async function loadActiveJobDescriptions(): Promise<JobDescriptionRecord[]> {
  return prisma.jobDescription.findMany({
    where: { active: true },
    orderBy: { title: "asc" },
    select: selectFields,
  });
}
