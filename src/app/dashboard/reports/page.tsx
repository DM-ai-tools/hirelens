import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ReportsPage() {
  const session = await auth();
  const jobs = await prisma.job.findMany({
    where: { createdById: session!.user.id },
    include: {
      _count: { select: { candidates: true, reports: true } },
      reports: { orderBy: { generatedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-semibold">{job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {job._count.candidates} candidates · {job.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{job._count.reports} reports</Badge>
                <Link href={`/report/${job.id}`}>
                  <Button size="sm" className="bg-[#C8202A] hover:bg-[#E0353D]">View Report</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {jobs.length === 0 && <p className="text-muted-foreground">No screening runs yet.</p>}
      </div>
    </div>
  );
}
