"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmailHtmlEditor } from "@/components/report/email-html-editor";
import { AssessmentEmailPreview } from "@/components/report/assessment-email-preview";
import {
  AssessmentDeadlinePicker,
  type AssessmentDeadlineValue,
} from "@/components/report/assessment-deadline-picker";
import {
  BUILTIN_EMAIL_TEMPLATES,
  defaultDeadlineParts,
  defaultSubject,
  replaceTemplateVars,
  deadlineFromParts,
  formatDeadlineDisplay,
  type EmailTemplateVars,
} from "@/lib/assessment-email-templates";
import {
  generateAssessmentEmailAction,
  sendConfiguredAssessmentsAction,
} from "@/actions/assessment-send.actions";
import { toast } from "sonner";
import { Loader2, Mail, Sparkles, Users } from "lucide-react";
import type { ExperienceIntelligenceRow } from "@/components/report/experience-intelligence-section";

export type SendAssessmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  defaultAssessmentDays: number;
  candidates: ExperienceIntelligenceRow[];
  selectedIds: string[];
  assessments: Array<{
    id: string;
    name: string;
    type: string;
    url: string | null;
    hasFile: boolean;
    files: Array<{ id: string; fileName: string; downloadUrl: string }>;
    primaryDownloadUrl?: string | null;
  }>;
  dbTemplates: Array<{ id: string; name: string; subject: string; bodyHtml: string }>;
  initialAssessmentIds?: string[];
  initialDeadline?: AssessmentDeadlineValue;
  onSent: () => void;
};

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function companyFor(c: ExperienceIntelligenceRow): string | null {
  const ei = c.experienceIntelligence;
  return ei?.currentCompany ?? ei?.companies?.[0]?.companyName ?? null;
}

function ensureDeadlinePlaceholder(bodyHtml: string): string {
  if (/\{\{\s*deadline\s*\}\}/i.test(bodyHtml)) return bodyHtml;
  return `${bodyHtml}<p style="margin-top:16px"><strong>Deadline:</strong> {{deadline}}</p>`;
}

export function SendAssessmentModal({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  companyName,
  recruiterName,
  defaultAssessmentDays,
  candidates,
  selectedIds,
  assessments,
  dbTemplates,
  initialAssessmentIds,
  initialDeadline,
  onSent,
}: SendAssessmentModalProps) {
  const selected = useMemo(
    () => candidates.filter((c) => selectedIds.includes(c.id)),
    [candidates, selectedIds]
  );

  const missingEmail = useMemo(
    () => selected.filter((c) => !c.email?.trim()),
    [selected]
  );

  const canSend = selected.length > 0 && missingEmail.length === 0;

  const templateOptions = useMemo(
    () => [
      ...BUILTIN_EMAIL_TEMPLATES,
      ...dbTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        bodyHtml: t.bodyHtml,
        builtIn: false,
      })),
      {
        id: "custom",
        name: "Custom Template",
        subject: defaultSubject(jobTitle, "assessment-invitation"),
        bodyHtml: BUILTIN_EMAIL_TEMPLATES[0].bodyHtml,
        builtIn: false,
      },
    ],
    [dbTemplates, jobTitle]
  );

  const defaults = defaultDeadlineParts(defaultAssessmentDays, "Asia/Kolkata");

  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>(
    initialAssessmentIds?.length ? initialAssessmentIds : assessments[0]?.id ? [assessments[0].id] : []
  );
  const [templateKey, setTemplateKey] = useState("assessment-invitation");
  const [deadline, setDeadline] = useState<AssessmentDeadlineValue>({
    date: defaults.date,
    time: defaults.time,
    timezone: defaults.timezone,
  });
  const { date: deadlineDate, time: deadlineTime, timezone } = deadline;
  const [subject, setSubject] = useState(defaultSubject(jobTitle, "assessment-invitation"));
  const [bodyHtml, setBodyHtml] = useState(BUILTIN_EMAIL_TEMPLATES[0].bodyHtml);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedAssessments = useMemo(
    () => assessments.filter((a) => selectedAssessmentIds.includes(a.id)),
    [assessments, selectedAssessmentIds]
  );
  const primaryAssessment = selectedAssessments[0];
  const previewCandidate = selected[0] ?? candidates[0];

  const formattedDeadline = useMemo(() => {
    if (!deadlineDate || !deadlineTime) return "";
    const deadline = deadlineFromParts(deadlineDate, deadlineTime, timezone);
    return formatDeadlineDisplay(deadline, timezone);
  }, [deadlineDate, deadlineTime, timezone]);

  const applyTemplate = useCallback(
    (key: string) => {
      const tpl = templateOptions.find((t) => t.id === key);
      if (!tpl) return;
      setTemplateKey(key);
      setSubject(tpl.subject.includes("{{") ? tpl.subject : defaultSubject(jobTitle, key));
      setBodyHtml(tpl.bodyHtml);
      setAiGenerated(false);
    },
    [templateOptions, jobTitle]
  );

  useEffect(() => {
    if (open) {
      const d = initialDeadline ?? defaultDeadlineParts(defaultAssessmentDays, "Asia/Kolkata");
      setDeadline({ date: d.date, time: d.time, timezone: d.timezone });
      setSelectedAssessmentIds(
        initialAssessmentIds?.length
          ? initialAssessmentIds
          : assessments[0]?.id
            ? [assessments[0].id]
            : []
      );
      applyTemplate("assessment-invitation");
    }
  }, [open, defaultAssessmentDays, assessments, applyTemplate, initialAssessmentIds, initialDeadline]);

  const previewVars = useMemo((): EmailTemplateVars | null => {
    if (!previewCandidate) return null;
    const deadline = deadlineFromParts(deadlineDate, deadlineTime, timezone);
    const primary = selectedAssessments[0];
    const link =
      selectedAssessments.length === 1 && primary?.type === "LINK" && primary.url
        ? primary.url
        : selectedAssessments.length === 1 && primary
          ? primary.primaryDownloadUrl ||
            primary.files[0]?.downloadUrl ||
            "{{assessment_link}}"
          : "{{assessment_link}}";

    return {
      candidate_name: previewCandidate.name || "Candidate",
      job_title: jobTitle,
      company_name: companyName,
      assessment_name:
        selectedAssessments.length > 0
          ? selectedAssessments.map((a) => a.name).join(", ")
          : "{{assessment_name}}",
      assessment_link: link,
      deadline: formattedDeadline || formatDeadlineDisplay(deadline, timezone),
      recruiter_name: recruiterName,
    };
  }, [
    previewCandidate,
    selectedAssessments,
    deadlineDate,
    deadlineTime,
    timezone,
    formattedDeadline,
    jobTitle,
    companyName,
    recruiterName,
  ]);

  const previewSubject = previewVars ? replaceTemplateVars(subject, previewVars) : subject;
  const previewBody = previewVars ? replaceTemplateVars(bodyHtml, previewVars) : bodyHtml;

  async function handleGenerateAi() {
    if (!previewCandidate || selectedAssessmentIds.length === 0) {
      toast.error("Select candidates and at least one assessment first");
      return;
    }
    setGenerating(true);
    try {
      const result = await generateAssessmentEmailAction({
        jobId,
        candidateId: previewCandidate.id,
        assessmentIds: selectedAssessmentIds,
        deadlineDate,
        deadlineTime,
        timezone,
        templateName: templateOptions.find((t) => t.id === templateKey)?.name ?? "Assessment",
        currentSubject: subject,
        currentBodyHtml: bodyHtml,
      });
      setSubject(result.subject);
      setBodyHtml(ensureDeadlinePlaceholder(result.bodyHtml));
      setAiGenerated(true);
      toast.success("AI email generated — review before sending");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!selectedIds.length) {
      toast.error("Select at least one candidate");
      return;
    }
    if (missingEmail.length > 0) {
      toast.error(
        `Cannot send — missing email for: ${missingEmail.map((c) => c.name || "Candidate").join(", ")}`
      );
      return;
    }
    if (selectedAssessmentIds.length === 0) {
      toast.error("Select at least one assessment");
      return;
    }
    if (!deadlineDate || !deadlineTime) {
      toast.error("Set a deadline");
      return;
    }

    setSending(true);
    try {
      const tpl = templateOptions.find((t) => t.id === templateKey);
      const result = await sendConfiguredAssessmentsAction({
        jobId,
        candidateIds: selectedIds,
        assessmentIds: selectedAssessmentIds,
        deadlineDate,
        deadlineTime,
        timezone,
        subject,
        bodyHtml,
        templateId: tpl && !tpl.builtIn && tpl.id !== "custom" ? tpl.id : undefined,
        templateName: tpl?.name ?? "Custom",
        aiGenerated,
      });
      toast.success(
        `Assessment sent to ${result.sent} recipient${result.sent === 1 ? "" : "s"} at their registered email address${result.sent === 1 ? "" : "es"}`
      );
      if (result.failed > 0) toast.warning(`${result.failed} failed to send`);
      onSent();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5 text-[#C8202A]" />
            Send Assessment
          </DialogTitle>
          <DialogDescription>
            Configure the assessment, preview personalized emails, then send to your shortlist.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 px-6 py-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <Card className="p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-[#C8202A]" />
                  Selected Candidates ({selected.length})
                </div>
                {selected.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No candidates selected on the report.</p>
                ) : (
                  <>
                    <div className="max-h-36 space-y-2 overflow-y-auto">
                      {selected.map((c) => {
                        const hasEmail = !!c.email?.trim();
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center gap-3 rounded-lg border p-2 ${
                              hasEmail
                                ? "border-[#E5E9F0] dark:border-white/10"
                                : "border-amber-300 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-950/30"
                            }`}
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-[#0B1E3B] text-xs text-white">
                                {initials(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{c.name || "Candidate"}</p>
                              <p
                                className={`truncate text-xs ${
                                  hasEmail ? "text-muted-foreground" : "font-medium text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {hasEmail ? c.email : "No email on file — cannot send"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {companyFor(c) || "—"} · Score {c.score != null ? Math.round(c.score) : "—"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {missingEmail.length > 0 ? (
                      <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                        {missingEmail.length} candidate{missingEmail.length === 1 ? "" : "s"} missing an email
                        address. Add emails in candidate profiles before sending.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Each personalized email will be delivered to the address shown above.
                      </p>
                    )}
                  </>
                )}
              </Card>

              <Card className="space-y-4 p-4">
                <div>
                  <Label>Assessments to send</Label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Select one or more assessments. All files and links are included in one email per candidate.
                  </p>
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-[#E5E9F0] p-2 dark:border-white/10">
                    {assessments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No assessments available</p>
                    ) : (
                      assessments.map((a) => (
                        <label
                          key={a.id}
                          className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-[#F6F8FB] dark:hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssessmentIds.includes(a.id)}
                            onChange={(e) => {
                              setSelectedAssessmentIds((prev) => {
                                if (e.target.checked) {
                                  return prev.includes(a.id) ? prev : [...prev, a.id];
                                }
                                const next = prev.filter((id) => id !== a.id);
                                return next.length > 0 ? next : prev;
                              });
                            }}
                            className="mt-1"
                          />
                          <span className="min-w-0 text-sm">
                            <strong className="block">{a.name}</strong>
                            <span className="text-xs text-muted-foreground">
                              {a.type === "LINK"
                                ? "External link"
                                : `${a.files.length || (a.hasFile ? 1 : 0)} file(s)`}
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <Label>Email template</Label>
                  <select
                    value={templateKey}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {templateOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Variables auto-replaced per candidate when sending.
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <Label className="mb-2 block">Email body</Label>
                <EmailHtmlEditor value={bodyHtml} onChange={setBodyHtml} />
                {aiGenerated && (
                  <p className="mt-2 text-xs text-[#1E9E5A]">✨ AI-enhanced — editable before send</p>
                )}
              </Card>
            </div>

            <div className="flex min-h-0 flex-col space-y-3 lg:max-h-[calc(92vh-10rem)]">
              <div className="flex shrink-0 items-center justify-between">
                <Label className="text-base font-semibold">Live preview</Label>
                <Tabs
                  value={previewMode}
                  onValueChange={(v) => setPreviewMode(v as "desktop" | "mobile")}
                >
                  <TabsList>
                    <TabsTrigger value="desktop">Desktop</TabsTrigger>
                    <TabsTrigger value="mobile">Mobile</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {previewCandidate && (
                <p className="shrink-0 text-xs text-muted-foreground">
                  Previewing for <strong>{previewCandidate.name || "Candidate"}</strong>
                  {previewCandidate.email?.trim() ? (
                    <>
                      {" "}
                      at <strong>{previewCandidate.email}</strong>
                    </>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400"> (no email on file)</span>
                  )}
                  {selected.length > 1
                    ? ` — ${selected.length - 1} more recipient${selected.length === 2 ? "" : "s"} with their own addresses`
                    : ""}
                </p>
              )}
              <div className="min-h-[240px] flex-1 overflow-y-auto rounded-xl border border-[#E5E9F0] bg-[#F6F8FB] p-3 dark:border-white/10">
                <AssessmentEmailPreview
                  mode={previewMode}
                  subject={previewSubject}
                  bodyHtml={previewBody}
                  companyName={companyName}
                  toEmail={previewCandidate?.email}
                  deadline={formattedDeadline || undefined}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t border-[#E5E9F0] bg-[#F6F8FB] px-6 py-3 dark:border-white/10 dark:bg-white/5">
          <AssessmentDeadlinePicker
            value={deadline}
            onChange={setDeadline}
            variant="modal-strip"
          />
        </div>

        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleGenerateAi} disabled={generating || sending}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate AI Email
          </Button>
          <Button
            className="bg-[#C8202A] hover:bg-[#E0353D]"
            onClick={handleSend}
            disabled={sending || generating || selectedAssessmentIds.length === 0 || !canSend}
            title={
              missingEmail.length > 0
                ? "Some selected candidates are missing email addresses"
                : undefined
            }
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Send to {selected.length} recipient{selected.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
