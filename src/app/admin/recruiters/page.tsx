import { prisma } from "@/lib/prisma";
import RecruitersClient from "./recruiters-client";

export default async function RecruitersPage() {
  const recruiters = await prisma.user.findMany({
    where: { role: "RECRUITER" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return <RecruitersClient recruiters={recruiters} />;
}
