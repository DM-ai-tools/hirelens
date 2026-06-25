import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, ClipboardList, Upload, ArrowRight } from "lucide-react";

export default async function RecruiterDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const [jobs, candidates, pendingSends, recentJobs] = await Promise.all([
    prisma.job.count({ where: { createdById: userId } }),
    prisma.candidate.count({ where: { job: { createdById: userId } } }),
    prisma.assessmentSend.count({
      where: { status: "QUEUED", candidate: { job: { createdById: userId } } },
    }),
    prisma.job.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { candidates: true } } },
    }),
  ]);

  const recentCandidates = await prisma.candidate.findMany({
    where: { job: { createdById: userId } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { job: { select: { title: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {session!.user.name}</h1>
        <p className="text-muted-foreground">Your recruiting dashboard overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Jobs", value: jobs, icon: Briefcase },
          { label: "Candidates", value: candidates, icon: Users },
          { label: "Pending Assessments", value: pendingSends, icon: ClipboardList },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-[#C8202A] text-white border-0">
          <CardContent className="pt-6">
            <p className="text-sm opacity-90 mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Link href="/dashboard/jobs/new">
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  <Upload className="mr-2 h-3 w-3" /> New Screening
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job._count.candidates} candidates · {job.status}</p>
                </div>
                <Link href={`/report/${job.id}`}>
                  <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                </Link>
              </div>
            ))}
            {recentJobs.length === 0 && <p className="text-sm text-muted-foreground">No jobs yet. Start a screening!</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Candidates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCandidates.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{c.name || "Parsing..."}</p>
                  <p className="text-xs text-muted-foreground">{c.job.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.score != null && <Badge variant="secondary">{c.score}</Badge>}
                  <Badge variant="outline">{c.goodToCall || c.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
