import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CandidatesPage() {
  const session = await auth();
  const candidates = await prisma.candidate.findMany({
    where: { job: { createdById: session!.user.id } },
    orderBy: [{ score: "desc" }],
    include: { job: { select: { title: true, id: true } } },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Candidates</h1>
      <Card>
        <CardHeader><CardTitle>All Candidates</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{c.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{c.job.title} · {c.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.score != null && <Badge>{c.score}</Badge>}
                  <Badge variant="outline">{c.goodToCall || c.status}</Badge>
                  <Link href={`/dashboard/candidates/${c.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            ))}
            {candidates.length === 0 && <p className="text-muted-foreground text-sm">No candidates yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
