"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { RecruiterLeaderboardRow } from "@/features/admin/types";

const PERF_DATA = [
  { w: "W1", score: 68 },
  { w: "W2", score: 72 },
  { w: "W3", score: 75 },
  { w: "W4", score: 71 },
];

export function RecruiterProfileDrawer({
  recruiter,
  open,
  onOpenChange,
}: {
  recruiter: RecruiterLeaderboardRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!recruiter) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Recruiter Profile</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6 px-1">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-[#0B1E3B] text-lg text-white">
                {recruiter.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">{recruiter.name}</h3>
              <p className="text-sm text-muted-foreground">{recruiter.designation}</p>
              <Badge variant="secondary" className="mt-1">
                {recruiter.department}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{recruiter.email}</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Jobs Created", value: recruiter.jobsCreated },
              { label: "Candidates Reviewed", value: recruiter.candidatesReviewed },
              { label: "Avg Review Time", value: "4.2 hrs" },
              { label: "Avg Candidate Score", value: `${recruiter.avgCandidateScore}%` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[#E5E9F0] bg-[#F6F8FB] p-3 dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="performance">
            <TabsList className="w-full">
              <TabsTrigger value="performance" className="flex-1">
                Performance
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">
                Activity
              </TabsTrigger>
            </TabsList>
            <TabsContent value="performance" className="mt-4">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERF_DATA}>
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#C8202A"
                      fill="#C8202A30"
                    />
                    <Tooltip />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="activity" className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Created job &quot;Senior React Developer&quot; — 2 days ago</p>
              <p>Generated screening report — 3 days ago</p>
              <p>Sent 12 assessments — 5 days ago</p>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
