import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const candidate = await prisma.candidate.findFirst({
    where: { id, job: { createdById: session!.user.id } },
    include: { job: true, assessmentSends: { include: { assessment: true } } },
  });
  if (!candidate) notFound();

  const breakdown = candidate.scoreBreakdown as Record<string, number> | null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{candidate.name || "Candidate"}</h1>
          <p className="text-muted-foreground">{candidate.job.title}</p>
        </div>
        <Link href={`/report/${candidate.jobId}`}>
          <Button variant="outline">Back to Report</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6 text-center"><div className="text-3xl font-bold text-[#C8202A]">{candidate.score ?? "-"}</div><p className="text-xs text-muted-foreground">Score</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-3xl font-bold">#{candidate.rank ?? "-"}</div><p className="text-xs text-muted-foreground">Rank</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Badge className="text-base">{candidate.goodToCall || "-"}</Badge><p className="text-xs text-muted-foreground mt-2">Good to Call</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contact & Experience</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><b>Email:</b> {candidate.email || "-"}</p>
            <p><b>Phone:</b> {candidate.phone || "-"}</p>
            <p><b>Overall Experience:</b> {candidate.overallExperience ?? "-"} years</p>
            <p><b>Relevant Experience:</b> {candidate.relevantExperience ?? "-"} years</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Score Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {breakdown ? Object.entries(breakdown).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="capitalize">{k.replace(/Score$/, "").replace(/([A-Z])/g, " $1")}</span>
                <b>{v}</b>
              </div>
            )) : <p className="text-muted-foreground">Not yet evaluated</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Matched Skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {candidate.matchedSkills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Missing Skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {candidate.missingSkills.map((s) => <Badge key={s} variant="outline" className="text-destructive">{s}</Badge>)}
          </CardContent>
        </Card>
      </div>

      {candidate.aiRationale && (
        <Card>
          <CardHeader><CardTitle>AI Explanation</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-relaxed">{candidate.aiRationale}</p></CardContent>
        </Card>
      )}

      {candidate.rawText && (
        <Card>
          <CardHeader><CardTitle>Resume Text</CardTitle></CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto text-xs whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {candidate.rawText.slice(0, 3000)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
