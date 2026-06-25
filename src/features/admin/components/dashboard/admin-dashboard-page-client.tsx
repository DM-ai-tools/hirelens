"use client";

import dynamic from "next/dynamic";
import type { DashboardStats } from "@/features/admin/types";

const AdminDashboardClient = dynamic(
  () =>
    import("@/features/admin/components/dashboard/admin-dashboard-client").then(
      (mod) => mod.AdminDashboardClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
        <div className="h-40 rounded-2xl bg-muted/50" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/50" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-muted/50" />
      </div>
    ),
  }
);

export function AdminDashboardPageClient({ stats }: { stats: DashboardStats }) {
  return <AdminDashboardClient stats={stats} />;
}
