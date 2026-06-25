"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MetricCard } from "@/features/admin/components/shared/metric-card";
import { HiringPipeline } from "@/features/admin/components/dashboard/hiring-pipeline";
import { HiringAnalytics } from "@/features/admin/components/dashboard/hiring-analytics";
import { RecruiterLeaderboard } from "@/features/admin/components/dashboard/recruiter-leaderboard";
import { RecruiterProfileDrawer } from "@/features/admin/components/dashboard/recruiter-profile-drawer";
import { ActivityTimeline } from "@/features/admin/components/dashboard/activity-timeline";
import { JobsOverview } from "@/features/admin/components/dashboard/jobs-overview";
import type { DashboardStats, RecruiterLeaderboardRow } from "@/features/admin/types";

export function AdminDashboardClient({ stats }: { stats: DashboardStats }) {
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterLeaderboardRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[#E5E9F0] bg-gradient-to-br from-[#0B1E3B] via-[#16294a] to-[#0B1E3B] p-8 text-white shadow-xl dark:border-white/10"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#C8202A]/20 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70">Welcome back,</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{stats.adminName}</h1>
          <p className="mt-2 max-w-xl text-white/75">
            Today&apos;s Hiring Overview — AI-powered screening, assessments, and executive analytics
            across your talent pipeline.
          </p>
        </div>
      </motion.section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Key metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.kpis.map((kpi, i) => (
            <MetricCard key={kpi.id} kpi={kpi} index={i} />
          ))}
        </div>
      </section>

      <HiringPipeline stages={stats.pipeline} />

      <section>
        <h2 className="mb-4 text-lg font-bold text-[#0B1E3B] dark:text-white">Hiring Analytics</h2>
        <HiringAnalytics data={stats.analytics} />
      </section>

      <JobsOverview jobs={stats.jobs} />

      <RecruiterLeaderboard
        rows={stats.recruiters}
        onSelect={(row) => {
          setSelectedRecruiter(row);
          setDrawerOpen(true);
        }}
      />

      <ActivityTimeline items={stats.activity} />

      <RecruiterProfileDrawer
        recruiter={selectedRecruiter}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
