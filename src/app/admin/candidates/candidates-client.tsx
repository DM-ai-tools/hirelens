"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { AdminDataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { CandidateProfileDrawer } from "@/features/admin/components/candidates/candidate-profile-drawer";
import type { ExperienceIntelligenceResult } from "@/types";

export type AdminCandidateRow = {
  id: string;
  jobId: string;
  name: string;
  email: string | null;
  phone: string | null;
  resumeFileName: string;
  score: number | null;
  rank: number | null;
  status: string;
  goodToCall: string | null;
  jobTitle: string;
  currentCompany: string | null;
  currentRole: string | null;
  overallExperience: number | null;
  relevantExperience: number | null;
  experienceIntelligenceScore: number | null;
  assessmentStatus: string;
  strengths: string[];
  missingSkills: string[];
  matchedSkills: string[];
  aiRationale: string | null;
  resumePreview: string | null;
  experienceIntelligence: ExperienceIntelligenceResult | null;
  assessmentHistory: Array<{ name: string; status: string; sentAt: string | null }>;
};

function gtcVariant(v: string | null) {
  if (v === "YES") return "yes" as const;
  if (v === "MAYBE") return "maybe" as const;
  if (v === "NO") return "no" as const;
  return "review" as const;
}

function formatAssessmentStatus(status: string) {
  if (status === "Not sent") return status;
  return status.replace(/_/g, " ");
}

export default function CandidatesClient({ candidates }: { candidates: AdminCandidateRow[] }) {
  const [selected, setSelected] = useState<AdminCandidateRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <AdminPageHeader
        title="Candidates"
        description="Enterprise candidate intelligence — AI scores, experience intelligence, and assessment status."
      />

      <AdminDataTable
        data={candidates}
        searchPlaceholder="Search candidates, companies, roles…"
        searchFilter={(row, q) => {
          const lower = q.toLowerCase();
          return (
            row.name.toLowerCase().includes(lower) ||
            (row.email?.toLowerCase().includes(lower) ?? false) ||
            row.jobTitle.toLowerCase().includes(lower) ||
            (row.currentCompany?.toLowerCase().includes(lower) ?? false) ||
            (row.currentRole?.toLowerCase().includes(lower) ?? false) ||
            row.resumeFileName.toLowerCase().includes(lower)
          );
        }}
        columns={[
          {
            key: "name",
            header: "Candidate",
            cell: (c) => (
              <div>
                <span className="font-semibold text-[#0B1E3B] dark:text-white">{c.name}</span>
                {c.email && (
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                )}
              </div>
            ),
          },
          { key: "job", header: "Job", cell: (c) => c.jobTitle },
          { key: "company", header: "Current Company", cell: (c) => c.currentCompany || "—" },
          { key: "role", header: "Current Role", cell: (c) => c.currentRole || "—" },
          {
            key: "exp",
            header: "Experience",
            cell: (c) =>
              c.overallExperience != null
                ? `${c.overallExperience}y${c.relevantExperience != null ? ` / ${c.relevantExperience}y rel` : ""}`
                : "—",
          },
          {
            key: "score",
            header: "AI Score",
            cell: (c) => (
              <span className="font-bold text-[#0B1E3B] dark:text-white">
                {c.score != null ? Math.round(c.score) : c.status === "EVALUATED" ? "—" : "Pending"}
              </span>
            ),
          },
          {
            key: "ei",
            header: "Experience Intelligence",
            cell: (c) =>
              c.experienceIntelligenceScore != null
                ? c.experienceIntelligenceScore.toFixed(1)
                : "—",
          },
          {
            key: "gtc",
            header: "Good To Call",
            cell: (c) => (
              <StatusBadge variant={gtcVariant(c.goodToCall)}>
                {c.goodToCall?.replace(/_/g, " ") || "—"}
              </StatusBadge>
            ),
          },
          {
            key: "assessment",
            header: "Assessment",
            cell: (c) => (
              <StatusBadge variant={c.assessmentStatus === "Not sent" ? "inactive" : "processing"}>
                {formatAssessmentStatus(c.assessmentStatus)}
              </StatusBadge>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            className: "sticky right-0 bg-white dark:bg-[#0B1E3B]",
            cell: (c) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(c);
                  setDrawerOpen(true);
                }}
              >
                Profile
              </Button>
            ),
          },
        ]}
      />

      <CandidateProfileDrawer
        candidate={selected}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
