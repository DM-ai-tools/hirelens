"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { AdminDataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { formatDateUTC } from "@/lib/format-date";

type JobRow = {
  id: string;
  title: string;
  department: string | null;
  status: string;
  candidateCount: number;
  recruiterName: string;
  createdAt: string;
};

function statusVariant(status: string) {
  if (status === "COMPLETED") return "completed" as const;
  if (status === "PROCESSING") return "processing" as const;
  if (status === "FAILED") return "failed" as const;
  if (status === "DRAFT") return "inactive" as const;
  return "pending" as const;
}

export default function JobsClient({ jobs }: { jobs: JobRow[] }) {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AdminPageHeader
        title="Jobs"
        description="All screening jobs across recruiters — open the report to review candidates and send assessments."
      />

      <AdminDataTable
        data={jobs}
        searchPlaceholder="Search jobs…"
        searchFilter={(row, q) =>
          row.title.toLowerCase().includes(q) ||
          (row.department?.toLowerCase().includes(q) ?? false) ||
          row.recruiterName.toLowerCase().includes(q)
        }
        columns={[
          {
            key: "title",
            header: "Job Title",
            cell: (j) => <span className="font-medium whitespace-nowrap">{j.title}</span>,
          },
          { key: "dept", header: "Department", cell: (j) => j.department || "—" },
          {
            key: "recruiter",
            header: "Recruiter",
            cell: (j) => j.recruiterName,
          },
          {
            key: "status",
            header: "Status",
            cell: (j) => (
              <StatusBadge variant={statusVariant(j.status)}>{j.status}</StatusBadge>
            ),
          },
          { key: "candidates", header: "Candidates", cell: (j) => j.candidateCount },
          {
            key: "created",
            header: "Created",
            cell: (j) => <span className="whitespace-nowrap">{formatDateUTC(j.createdAt)}</span>,
          },
          {
            key: "actions",
            header: "Actions",
            className: "sticky right-0 bg-white dark:bg-[#0B1E3B]",
            cell: (j) =>
              j.status === "DRAFT" ? (
                <span className="text-xs text-muted-foreground whitespace-nowrap">Awaiting skills</span>
              ) : (
                <Link
                  href={`/report/${j.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "whitespace-nowrap")}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Report
                </Link>
              ),
          },
        ]}
      />
    </div>
  );
}
