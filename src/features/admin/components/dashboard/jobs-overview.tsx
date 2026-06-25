"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatDateUTC } from "@/lib/format-date";
import { GlassCard } from "../shared/glass-card";
import type { JobCard } from "@/features/admin/types";
const statusVariant: Record<string, string> = {
  COMPLETED: "bg-[#E8F8EF] text-[#1E9E5A]",
  PROCESSING: "bg-[#FFF8E6] text-[#B06E0A]",
  DRAFT: "bg-[#F6F8FB] text-[#7A8798]",
  FAILED: "bg-[#FBE9EA] text-[#C8202A]",
};

export function JobsOverview({ jobs }: { jobs: JobCard[] }) {
  return (
    <GlassCard delay={0.15}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0B1E3B] dark:text-white">Jobs Overview</h2>
          <p className="text-sm text-muted-foreground">Active hiring pipelines</p>
        </div>
        <Link href="/admin/jobs" className="text-sm font-semibold text-[#C8202A] hover:underline">
          View all
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/admin/jobs?highlight=${job.id}`}
              className="block rounded-xl border border-[#E5E9F0] bg-gradient-to-br from-white to-[#FAFBFD] p-4 transition-all hover:-translate-y-0.5 hover:border-[#C8202A]/30 hover:shadow-lg dark:border-white/10 dark:from-[#0B1E3B] dark:to-[#071428]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-[#0B1E3B] dark:text-white">{job.title}</h3>
                <Badge className={statusVariant[job.status] ?? statusVariant.DRAFT}>
                  {job.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{job.department ?? "General"}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{job.applicants}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Applicants</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1E9E5A]">{job.goodCandidates}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Good</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{job.avgScore}%</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Avg Score</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {job.createdBy} · {formatDateUTC(job.createdAt)}
              </p>            </Link>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
