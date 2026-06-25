import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AssessmentsPage() {
  const session = await auth();
  const [assessments, sends] = await Promise.all([
    prisma.assessment.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.assessmentSend.findMany({
      where: { candidate: { job: { createdById: session!.user.id } } },
      include: { candidate: true, assessment: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assessments</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Available Assessments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {assessments.map((a) => (
              <div key={a.id} className="rounded-lg border p-3">
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.roleTag} · {a.type}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Email Send History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {sends.map((s) => (
              <div key={s.id} className="flex justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{s.candidate.name}</p>
                  <p className="text-xs text-muted-foreground">{s.assessment.name}</p>
                </div>
                <Badge variant={s.status === "SENT" || s.status === "DELIVERED" ? "default" : "destructive"}>
                  {s.status}
                </Badge>
              </div>
            ))}
            {sends.length === 0 && <p className="text-sm text-muted-foreground">No assessments sent yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
