"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { GlassCard } from "@/features/admin/components/shared/glass-card";
import { AdminDataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Download, FileBarChart, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateTimeUTC } from "@/lib/format-date";

type ReportRow = {
  id: string;
  jobId: string;
  jobTitle: string;
  format: string;
  generatedAt: Date;
};

const REPORT_CATEGORIES = [
  { title: "Candidate Reports", desc: "Per-job screening results", icon: FileBarChart },
  { title: "Monthly Reports", desc: "Hiring velocity summaries", icon: FileBarChart },
  { title: "Hiring Reports", desc: "Pipeline & funnel analytics", icon: FileBarChart },
  { title: "Recruiter Reports", desc: "Team performance exports", icon: FileBarChart },
  { title: "AI Reports", desc: "Claude insights & skill trends", icon: FileBarChart },
];

export default function ReportsClient({ reports }: { reports: ReportRow[] }) {
  async function download(jobId: string, format: "pdf" | "xlsx") {
    try {
      const res = await fetch(`/api/jobs/${jobId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${jobId}.${format === "pdf" ? "pdf" : "xlsx"}`;
      a.click();
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch {
      toast.error("Download failed");
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <AdminPageHeader
        title="Reports"
        description="Professional report center — preview, export, and share hiring intelligence."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {REPORT_CATEGORIES.map((cat) => (
          <GlassCard key={cat.title} className="!p-4">
            <cat.icon className="mb-2 h-5 w-5 text-[#C8202A]" />
            <h3 className="font-bold text-sm">{cat.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{cat.desc}</p>
          </GlassCard>
        ))}
      </div>

      <AdminDataTable
        data={reports}
        searchPlaceholder="Search reports…"
        searchFilter={(row, q) => row.jobTitle.toLowerCase().includes(q)}
        columns={[
          { key: "job", header: "Job", cell: (r) => <span className="font-semibold">{r.jobTitle}</span> },
          {
            key: "format",
            header: "Format",
            cell: (r) => <StatusBadge variant="completed">{r.format}</StatusBadge>,
          },
          {
            key: "date",
            header: "Created",
            cell: (r) => formatDateTimeUTC(r.generatedAt),
          },
          {
            key: "actions",
            header: "Actions",
            cell: (r) => (
              <div className="flex flex-wrap gap-1">
                <Link href={`/report/${r.jobId}`}>
                  <Button variant="ghost" size="sm">
                    Preview
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => download(r.jobId, r.format === "PDF" ? "pdf" : "xlsx")}
                >
                  <Download className="mr-1 h-3 w-3" />
                  {r.format}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toast.success("Share link copied")}>
                  <Share2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toast.message("Delete scheduled")}>
                  <Trash2 className="h-3 w-3 text-[#C8202A]" />
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
