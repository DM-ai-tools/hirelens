"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTimeUTC } from "@/lib/format-date";
import type { AdminCandidateRow } from "@/app/admin/candidates/candidates-client";
import { ExternalLink } from "lucide-react";

export function CandidateProfileDrawer({
  candidate,
  open,
  onOpenChange,
}: {
  candidate: AdminCandidateRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!candidate) return null;

  const ei = candidate.experienceIntelligence;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{candidate.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 px-1">
          <div className="flex flex-wrap gap-2">
            <Badge>{candidate.jobTitle}</Badge>
            <Badge variant="secondary">{candidate.status.replace(/_/g, " ")}</Badge>
            {candidate.goodToCall && (
              <Badge variant="outline">{candidate.goodToCall.replace(/_/g, " ")}</Badge>
            )}
          </div>
          <div className="space-y-1 text-sm">
            {candidate.email && <p>{candidate.email}</p>}
            {candidate.phone && <p className="text-muted-foreground">{candidate.phone}</p>}
          </div>

          <Link
            href={`/report/${candidate.jobId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open job report
          </Link>

          <Tabs defaultValue="Overview">
            <TabsList className="flex h-auto flex-wrap gap-1">
              {["Overview", "Resume", "AI Summary", "Experience", "Skills", "EI", "Assessments"].map(
                (t) => (
                  <TabsTrigger key={t} value={t} className="text-xs">
                    {t}
                  </TabsTrigger>
                )
              )}
            </TabsList>

            <TabsContent value="Overview" className="mt-4 space-y-3 text-sm">
              <Row label="AI Score" value={candidate.score != null ? `${Math.round(candidate.score)}%` : "—"} />
              <Row
                label="EI Score"
                value={
                  candidate.experienceIntelligenceScore != null
                    ? candidate.experienceIntelligenceScore.toFixed(1)
                    : "—"
                }
              />
              <Row label="Rank" value={candidate.rank != null ? String(candidate.rank) : "—"} />
              <Row label="Company" value={candidate.currentCompany ?? "—"} />
              <Row label="Role" value={candidate.currentRole ?? "—"} />
              <Row
                label="Experience"
                value={
                  candidate.overallExperience != null
                    ? `${candidate.overallExperience} years total${
                        candidate.relevantExperience != null
                          ? ` · ${candidate.relevantExperience}y relevant`
                          : ""
                      }`
                    : "—"
                }
              />
              <Row label="Resume file" value={candidate.resumeFileName} />
            </TabsContent>

            <TabsContent value="Resume" className="mt-4 space-y-3 text-sm">
              <p className="font-medium">{candidate.resumeFileName}</p>
              {candidate.resumePreview ? (
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-[#E5E9F0] bg-[#F6F8FB] p-3 text-xs leading-relaxed dark:border-white/10 dark:bg-white/5">
                  {candidate.resumePreview}
                  {candidate.resumePreview.length >= 2500 ? "\n\n…" : ""}
                </pre>
              ) : (
                <p className="text-muted-foreground">
                  Resume text is not available yet. Processing may still be in progress.
                </p>
              )}
            </TabsContent>

            <TabsContent value="AI Summary" className="mt-4 space-y-3 text-sm">
              {candidate.aiRationale ? (
                <p className="leading-relaxed text-[#3A4858] dark:text-white/80">{candidate.aiRationale}</p>
              ) : (
                <p className="text-muted-foreground">No AI evaluation summary yet.</p>
              )}
              {candidate.strengths.length > 0 && (
                <div>
                  <p className="mb-2 font-semibold">Strengths</p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.strengths.map((s) => (
                      <Badge key={s} className="bg-[#E8F8EF] text-[#1E9E5A]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="Experience" className="mt-4 space-y-3 text-sm">
              {ei?.companies?.length ? (
                ei.companies.slice(0, 6).map((co, i) => (
                  <div
                    key={`${co.companyName}-${i}`}
                    className="rounded-lg border border-[#E5E9F0] p-3 dark:border-white/10"
                  >
                    <p className="font-semibold">{co.companyName}</p>
                    <p className="text-muted-foreground">{co.role}</p>
                    {co.industry && (
                      <p className="mt-1 text-xs text-muted-foreground">{co.industry}</p>
                    )}
                  </div>
                ))
              ) : candidate.currentCompany || candidate.currentRole ? (
                <div className="rounded-lg border border-[#E5E9F0] p-3 dark:border-white/10">
                  <p className="font-semibold">{candidate.currentCompany ?? "—"}</p>
                  <p className="text-muted-foreground">{candidate.currentRole ?? "—"}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No experience data extracted yet.</p>
              )}
            </TabsContent>

            <TabsContent value="Skills" className="mt-4 space-y-4 text-sm">
              <SkillGroup title="Matched skills" items={candidate.matchedSkills} variant="matched" />
              <SkillGroup title="Missing skills" items={candidate.missingSkills} variant="missing" />
            </TabsContent>

            <TabsContent value="EI" className="mt-4 space-y-3 text-sm">
              {ei ? (
                <>
                  <Row label="EI Score" value={ei.score.toFixed(1)} />
                  {ei.scoreRationale && (
                    <p className="leading-relaxed text-muted-foreground">{ei.scoreRationale}</p>
                  )}
                  {ei.breakdown && (
                    <div className="space-y-2">
                      {Object.entries(ei.breakdown).map(([key, val]) => (
                        <Row
                          key={key}
                          label={key.replace(/([A-Z])/g, " $1").trim()}
                          value={typeof val === "number" ? val.toFixed(1) : String(val)}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Experience Intelligence has not been generated yet.</p>
              )}
            </TabsContent>

            <TabsContent value="Assessments" className="mt-4 space-y-3 text-sm">
              {candidate.assessmentHistory.length === 0 ? (
                <p className="text-muted-foreground">No assessments sent yet.</p>
              ) : (
                candidate.assessmentHistory.map((a, i) => (
                  <div
                    key={`${a.name}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-[#E5E9F0] px-3 py-2 dark:border-white/10"
                  >
                    <div>
                      <p className="font-medium">{a.name}</p>
                      {a.sentAt && (
                        <p className="text-xs text-muted-foreground">{formatDateTimeUTC(a.sentAt)}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{a.status.replace(/_/g, " ")}</Badge>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#E5E9F0] py-2 dark:border-white/10">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function SkillGroup({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "matched" | "missing";
}) {
  if (!items.length) {
    return (
      <div>
        <p className="mb-2 font-semibold">{title}</p>
        <p className="text-muted-foreground">—</p>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-2 font-semibold">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => (
          <Badge
            key={s}
            variant={variant === "missing" ? "destructive" : "secondary"}
            className={variant === "matched" ? "bg-[#E8F8EF] text-[#1E9E5A]" : undefined}
          >
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}
