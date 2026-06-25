"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlassCard } from "../shared/glass-card";
import type { RecruiterLeaderboardRow } from "@/features/admin/types";

export function RecruiterLeaderboard({
  rows,
  onSelect,
}: {
  rows: RecruiterLeaderboardRow[];
  onSelect: (row: RecruiterLeaderboardRow) => void;
}) {
  return (
    <GlassCard delay={0.2}>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#0B1E3B] dark:text-white">Recruiter Performance</h2>
        <p className="text-sm text-muted-foreground">Leaderboard by hiring activity & quality</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#E5E9F0] dark:border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] dark:bg-white/5">
              <TableHead>Recruiter</TableHead>
              <TableHead className="text-right">Jobs</TableHead>
              <TableHead className="text-right">Reviewed</TableHead>
              <TableHead className="text-right">Reports</TableHead>
              <TableHead className="text-right">Avg Score</TableHead>
              <TableHead className="text-right">Success</TableHead>
              <TableHead className="text-right">Completion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow
                key={row.id}
                className="cursor-pointer transition-colors hover:bg-[#FBE9EA]/30 dark:hover:bg-white/5"
                onClick={() => onSelect(row)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#0B1E3B] text-xs text-white">
                        {row.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.department}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{row.jobsCreated}</TableCell>
                <TableCell className="text-right">{row.candidatesReviewed}</TableCell>
                <TableCell className="text-right">{row.reportsGenerated}</TableCell>
                <TableCell className="text-right font-semibold text-[#1E9E5A]">
                  {row.avgCandidateScore}%
                </TableCell>
                <TableCell className="text-right">{row.hiringSuccess}%</TableCell>
                <TableCell className="text-right">{row.completionRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}
