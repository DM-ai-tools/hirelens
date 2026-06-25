import { prisma } from "@/lib/prisma";
import CandidatesClient from "./candidates-client";
import { mapAdminCandidateRow } from "@/features/admin/lib/map-admin-candidate";

export default async function AdminCandidatesPage() {
  const candidates = await prisma.candidate.findMany({
    orderBy: [{ updatedAt: "desc" }, { score: "desc" }],
    take: 500,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          mustHaveSkills: true,
          scoreThreshold: true,
        },
      },
      assessmentSends: {
        orderBy: { sentAt: "desc" },
        take: 5,
        include: { assessment: { select: { name: true } } },
      },
    },
  });

  const rows = candidates.map(mapAdminCandidateRow);

  return <CandidatesClient candidates={rows} />;
}
