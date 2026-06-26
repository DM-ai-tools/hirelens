"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import type { CandidateRow } from "@/components/candidates/candidates-table";
import {
  ExperienceIntelligenceSection,
  ExperienceIntelligencePanel,
  type ExperienceIntelligenceRow,
} from "@/components/report/experience-intelligence-section";
import { AgencyGoldBadge } from "@/components/report/agency-gold-badge";
import type { ExperienceIntelligenceResult } from "@/types";
import { toggleCandidateSelection } from "@/actions/admin.actions";
import { SendAssessmentModal } from "@/components/report/send-assessment-modal";
import {
  AssessmentDeadlinePicker,
  type AssessmentDeadlineValue,
} from "@/components/report/assessment-deadline-picker";
import { defaultDeadlineParts } from "@/lib/assessment-email-templates";
import {
  AssessmentEmailActivity,
  type EmailActivityRow,
} from "@/components/report/assessment-email-activity";
import { AssessmentEmailDetailDrawer } from "@/components/report/assessment-email-detail-drawer";
import { toast } from "sonner";
import type { GoodToCall } from "@prisma/client";
import { getVerdictThresholds, formatMinExperience } from "@/lib/constants";

interface ReportClientProps {
  job: {
    id: string;
    title: string;
    minExperience: number;
    scoreThreshold: number;
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
    mandatoryRequirements?: string | null;
    modelName: string;
    completedAt: string | null;
    runtimeSeconds?: number | null;
    failedCount?: number;
    candidates: ExperienceIntelligenceRow[];
  };
  assessments: {
    id: string;
    name: string;
    type: string;
    url: string | null;
    roleTag: string | null;
    description: string | null;
    hasFile: boolean;
    files: Array<{ id: string; fileName: string; downloadUrl: string }>;
    primaryDownloadUrl?: string | null;
  }[];
  companyName: string;
  recruiterName: string;
  defaultAssessmentDays: number;
  emailTemplates: Array<{ id: string; name: string; subject: string; bodyHtml: string }>;
  emailActivity: EmailActivityRow[];
}

function assessmentLabel(a: ReportClientProps["assessments"][number]) {
  const role = a.roleTag ? ` · ${a.roleTag}` : "";
  const kind = a.type === "LINK" ? "Link" : `${a.files.length || (a.hasFile ? 1 : 0)} file(s)`;
  return `${a.name} (${kind}${role})`;
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function goodToCallBadge(value: GoodToCall | null) {
  const map = {
    YES: { cls: "v-good", label: "Yes" },
    MAYBE: { cls: "v-ok", label: "Maybe" },
    NO: { cls: "v-bad", label: "No" },
    NEEDS_REVIEW: { cls: "v-ok", label: "Review" },
  };
  if (!value) return { cls: "v-ok", label: "—" };
  return map[value];
}

function scoreColor(score: number | null, goodToCall: GoodToCall | null, scoreThreshold: number) {
  if (goodToCall === "YES") return undefined;
  if (goodToCall === "MAYBE") return { color: "#B06E0A" };
  if (goodToCall === "NO") return { color: "var(--bad)" };
  if (score == null) return undefined;
  const { good, maybeMin } = getVerdictThresholds(scoreThreshold);
  if (score < maybeMin) return { color: "var(--bad)" };
  if (score < good) return { color: "#B06E0A" };
  return undefined;
}

function skillCell(has: boolean, partial?: boolean) {
  if (has) return <span className="cell c-y">✓</span>;
  if (partial) return <span className="cell c-p">~</span>;
  return <span className="cell c-n">✕</span>;
}

function MustHaveStatsDisplay({
  stats,
}: {
  stats: { totalMustHave: number; matchedMustHave: number; missingMustHave: number };
}) {
  return (
    <div className="must-have-stats">
      <span className="must-have-stats-matched">
        Matched: {stats.matchedMustHave} / {stats.totalMustHave}
      </span>
      <span
        className={`must-have-stats-missing${stats.missingMustHave > 0 ? " has-gap" : ""}`}
      >
        Missing: {stats.missingMustHave}
      </span>
    </div>
  );
}

function CandidateDetailModal({
  candidate: c,
  rankIndex,
  scoreThreshold,
  onClose,
}: {
  candidate: CandidateRow & { experienceIntelligence?: ExperienceIntelligenceResult | null };
  rankIndex: number;
  scoreThreshold: number;
  onClose: () => void;
}) {
  const badge = goodToCallBadge(c.goodToCall);
  const agencyLabel = c.experienceIntelligence?.agencyBadgeType ?? null;

  return (
    <div className="candidate-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="candidate-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="candidate-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="cmc-head">
          <div className="cmc-ava">{initials(c.name)}</div>
          <div className="cmc-head-text">
            <h2 id="candidate-modal-title">{c.name}</h2>
            <div className="cmc-head-badges">
              <span className={`vbadge ${badge.cls}`}>{badge.label}</span>
              {agencyLabel && <AgencyGoldBadge label={agencyLabel} compact />}
            </div>
          </div>
        </div>

        <div className="cmc-stats">
          <div className="cmc-stat">
            <span className="cmc-stat-label">Score</span>
            <span className="cmc-stat-value">{c.score ?? "—"}</span>
          </div>
          <div className="cmc-stat">
            <span className="cmc-stat-label">Rank</span>
            <span className="cmc-stat-value">{c.rank ?? rankIndex + 1}</span>
          </div>
          <div className="cmc-stat">
            <span className="cmc-stat-label">Overall exp</span>
            <span className="cmc-stat-value">{c.overallExperience ?? "—"} yrs</span>
          </div>
          <div className="cmc-stat">
            <span className="cmc-stat-label">Relevant exp</span>
            <span className="cmc-stat-value">{c.relevantExperience ?? "—"} yrs</span>
          </div>
        </div>

        {c.mustHaveStats && c.mustHaveStats.totalMustHave > 0 && (
          <div className="cmc-section cmc-section--must-have">
            <h3>Must-have skills</h3>
            <MustHaveStatsDisplay stats={c.mustHaveStats} />
          </div>
        )}

        {(c.email || c.phone) && (
          <div className="cmc-section">
            <h3>Contact</h3>
            {c.email && (
              <p className="cmc-line">
                <span>Email</span>
                <a href={`mailto:${c.email}`}>{c.email}</a>
              </p>
            )}
            {c.phone && (
              <p className="cmc-line">
                <span>Mobile</span>
                <a href={`tel:${c.phone}`}>{c.phone}</a>
              </p>
            )}
          </div>
        )}

        {c.strengths.length > 0 && (
          <div className="cmc-section">
            <h3>Strengths</h3>
            <div className="cmc-tags cmc-tags--skills">
              {c.strengths.map((s) => (
                <span key={s} className="cmc-skill-chip">{s}</span>
              ))}
            </div>
          </div>
        )}

        {c.missingSkills.length > 0 && (
          <div className="cmc-section">
            <h3>Missing must-haves</h3>
            <div className="cmc-tags cmc-tags--skills">
              {c.missingSkills.map((s) => (
                <span key={s} className="cmc-skill-chip miss">{s}</span>
              ))}
            </div>
          </div>
        )}

        {c.aiRationale && (
          <div className="cmc-section">
            <h3>Claude evaluation</h3>
            <p className="cmc-rationale">{c.aiRationale}</p>
          </div>
        )}

        <p className="cmc-foot">Shortlist threshold for this run: score ≥ {scoreThreshold}</p>
      </div>
    </div>
  );
}

function ShortlistMiniCard({
  candidate: c,
  index: i,
  onSelect,
  isActive,
}: {
  candidate: ExperienceIntelligenceRow;
  index: number;
  onSelect: () => void;
  isActive: boolean;
}) {
  const badge = goodToCallBadge(c.goodToCall);
  const agencyLabel = c.experienceIntelligence?.agencyBadgeType ?? null;
  return (
    <button
      type="button"
      className={`shortlist-mini${isActive ? " is-active" : ""}`}
      onClick={onSelect}
    >
      <span className="shortlist-mini-rank">{i + 1}</span>
      <span className="shortlist-mini-ava">{initials(c.name)}</span>
      <div className="shortlist-mini-body">
        <b>{c.name}</b>
        <span>
          Score {c.score ?? "—"} · Rank {c.rank ?? i + 1}
        </span>
        {agencyLabel && <AgencyGoldBadge label={agencyLabel} compact className="shortlist-agency" />}
      </div>
      <span className={`vbadge ${badge.cls}`}>{badge.label}</span>
    </button>
  );
}

function formatRuntime(seconds: number | null | undefined) {
  if (seconds == null || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds} sec`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m} min ${s} sec` : `${m} min`;
}

export function ReportClient({
  job,
  assessments,
  companyName,
  recruiterName,
  defaultAssessmentDays,
  emailTemplates,
  emailActivity,
}: ReportClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    job.candidates.filter((c) => c.goodToCall === "YES").map((c) => c.id)
  );
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>(
    assessments.length ? [assessments[0].id] : []
  );
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const deadlineDefaults = defaultDeadlineParts(defaultAssessmentDays, "Asia/Kolkata");
  const [assessmentDeadline, setAssessmentDeadline] = useState<AssessmentDeadlineValue>({
    date: deadlineDefaults.date,
    time: deadlineDefaults.time,
    timezone: deadlineDefaults.timezone,
  });
  const [emailDetail, setEmailDetail] = useState<EmailActivityRow | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState<{
    candidate: CandidateRow;
    rankIndex: number;
  } | null>(null);
  const [expIntelCandidate, setExpIntelCandidate] = useState<ExperienceIntelligenceRow | null>(null);

  useEffect(() => {
    if (!detailCandidate && !expIntelCandidate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetailCandidate(null);
        setExpIntelCandidate(null);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [detailCandidate, expIntelCandidate]);

  function openCandidateDetail(candidate: CandidateRow, rankIndex: number) {
    setExpIntelCandidate(null);
    setDetailCandidate({ candidate, rankIndex });
  }

  function openExpIntelDetail(candidate: ExperienceIntelligenceRow) {
    if (!candidate.experienceIntelligence) return;
    setDetailCandidate(null);
    setExpIntelCandidate(candidate);
  }

  const goodCount = job.candidates.filter((c) => c.goodToCall === "YES").length;
  const maybeCount = job.candidates.filter((c) => c.goodToCall === "MAYBE").length;
  const noCount = job.candidates.filter((c) => c.goodToCall === "NO").length;
  const avgScore =
    job.candidates.reduce((s, c) => s + (c.score ?? 0), 0) / Math.max(job.candidates.length, 1);
  const ringOffset = 226 - (avgScore / 100) * 226;

  const topCandidates =
    job.candidates.filter((c) => c.goodToCall === "YES").slice(0, 4).length > 0
      ? job.candidates.filter((c) => c.goodToCall === "YES").slice(0, 4)
      : job.candidates.slice(0, 4);
  const matrixCandidates = job.candidates.slice(0, 6);
  const skills = job.mustHaveSkills.slice(0, 4);
  const hasResults = job.candidates.length > 0;
  const showMustHaveColumn = job.mustHaveSkills.length > 0;

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
    void toggleCandidateSelection(id, checked);
  }

  function toggleAssessmentSelect(id: string, checked: boolean) {
    setSelectedAssessmentIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      const next = prev.filter((x) => x !== id);
      return next.length > 0 ? next : prev;
    });
  }

  function openSendModal() {
    if (!selectedIds.length) {
      toast.error("Select at least one candidate");
      return;
    }
    if (!assessments.length) {
      toast.error("No assessments configured for this role");
      return;
    }
    if (selectedAssessmentIds.length === 0) {
      toast.error("Select at least one assessment");
      return;
    }
    setSendModalOpen(true);
  }

  async function downloadReport(format: "pdf" | "xlsx") {
    setExportOpen(false);
    const res = await fetch(`/api/jobs/${job.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format }),
    });
    if (!res.ok) {
      toast.error("Report generation failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${job.id}.${format === "pdf" ? "pdf" : "xlsx"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${format.toUpperCase()} report downloaded`);
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${job.title} — HireLens Report`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Report link copied to clipboard");
    } catch {
      toast.error("Could not share report link");
    }
  }

  return (
    <div className="hirelens-page report-page">
      {detailCandidate && (
        <CandidateDetailModal
          candidate={detailCandidate.candidate}
          rankIndex={detailCandidate.rankIndex}
          scoreThreshold={job.scoreThreshold}
          onClose={() => setDetailCandidate(null)}
        />
      )}
      {expIntelCandidate && (
        <ExperienceIntelligencePanel
          candidate={expIntelCandidate}
          onClose={() => setExpIntelCandidate(null)}
        />
      )}
      <nav>
        <div className="nav-inner report-nav">
          <BrandLogo subtitle="SCREENING REPORT" />
          <div className="nav-center report-nav-title">
            Report for <b>{job.title}</b>
            {job.completedAt
              ? ` — generated ${new Date(job.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
              : ""}
          </div>
          <div className="nav-actions">
            <ThemeToggle variant="nav" />
            <button type="button" className="nav-btn" onClick={() => downloadReport("xlsx")}>
              ⤓ Excel
            </button>
            <button type="button" className="nav-btn" onClick={handleShare}>
              ↗ Share
            </button>
            <button type="button" className="nav-btn primary" onClick={() => downloadReport("pdf")}>
              ⬇ Download PDF
            </button>
          </div>
        </div>
      </nav>

      <div className="report-head">
        <div className="rh-left">
          <h1>
            {job.title} <span className="accent">— ranked shortlist</span>
          </h1>
          <div className="under-mark" />
          <p>
            {hasResults ? (
              <>
                {job.candidates.length} candidates evaluated by {job.modelName} against the job
                description. {goodCount} are recommended to advance now, {maybeCount} are worth a
                closer look.
                {job.failedCount ? ` ${job.failedCount} could not be evaluated.` : ""}
              </>
            ) : (
              <>
                Screening has not produced scored candidates yet. Return to processing to run Claude
                evaluation, or start a new screening from the landing page.
              </>
            )}
          </p>
          <div className="rh-meta">
            <div className="rh-meta-row">
              <div className="m">
                <span className="tag">RESUMES</span>
                <span>{job.candidates.length} evaluated</span>
              </div>
              <div className="m">
                <span className="tag">MIN EXP</span>
                <span>{formatMinExperience(job.minExperience)}</span>
              </div>
              <div className="m">
                <span className="tag">THRESHOLD</span>
                <span>score ≥ {job.scoreThreshold}</span>
              </div>
              <div className="m">
                <span className="tag">RUNTIME</span>
                <span>{formatRuntime(job.runtimeSeconds)}</span>
              </div>
            </div>
            {job.mustHaveSkills.length > 0 && (
              <div className="rh-meta-block">
                <span className="tag">MUST-HAVE</span>
                <div className="rh-meta-skills">
                  {job.mustHaveSkills.map((skill) => (
                    <span key={skill} className="rh-skill-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {job.mandatoryRequirements?.trim() && (
              <div className="rh-meta-block">
                <span className="tag">RECRUITER MUST</span>
                <p className="rh-meta-text">{job.mandatoryRequirements.trim()}</p>
              </div>
            )}
          </div>
        </div>
        <div className="rh-right">
          <svg className="ring-mini" width="84" height="84" viewBox="0 0 84 84" aria-hidden>
            <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="9" />
            <circle
              cx="42"
              cy="42"
              r="36"
              fill="none"
              stroke="#ff8a8f"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="226"
              strokeDashoffset={ringOffset}
              transform="rotate(-90 42 42)"
            />
            <text x="42" y="48" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800" fontFamily="Poppins">
              {avgScore.toFixed(0)}
            </text>
          </svg>
          <div className="ring-txt">
            <small>Pool fit index</small>
            <div className="score">
              {avgScore.toFixed(0)}
              <span style={{ fontSize: 16, color: "#9FC1CC" }}>/100</span>
            </div>
            <div className="delta">↑ {goodCount} strong matches in pool</div>
          </div>
        </div>
      </div>

      <div className="report-kpi-wrap">
        <div className="card report-kpi-card">
          <div className="kpi-grid report-kpi-grid">
            <div className="kpi green">
              <b>{goodCount}</b>
              <small>Good to Call</small>
            </div>
            <div className="kpi amber">
              <b>{maybeCount}</b>
              <small>Maybe</small>
            </div>
            <div className="kpi red">
              <b>{noCount}</b>
              <small>Not now</small>
            </div>
            <div className="kpi navy">
              <b>{hasResults ? avgScore.toFixed(0) : "—"}%</b>
              <small>Avg match score</small>
            </div>
          </div>
        </div>
      </div>

      <div className="main report-main report-main--full">
        {!hasResults && (
          <div className="card report-empty" style={{ padding: 24 }}>
            <p style={{ marginBottom: 12, color: "var(--body)" }}>
              No Claude-scored candidates yet for this job.
            </p>
            <Link href={`/processing/${job.id}`} className="btn-solid" style={{ display: "inline-block" }}>
              ← Return to processing
            </Link>
          </div>
        )}
        {hasResults && (
          <div className="card report-table-card">
            <div className="card-header">
              <div>
                <b>Ranked candidates</b>
                <p className="report-table-sub">Click a name for full strengths, gaps, and AI rationale</p>
              </div>
              <span className="meta">{job.candidates.length} evaluated · sorted by score</span>
            </div>
            <div className="report-table-wrap">
              <table className="report-table report-table--spread">
                <thead>
                  <tr>
                    <th className="col-check" />
                    <th className="col-num">#</th>
                    <th className="col-cand">Candidate</th>
                    <th className="col-email">Email</th>
                    <th className="col-phone">Mobile</th>
                    <th className="col-exp-combined">Experience</th>
                    {showMustHaveColumn && (
                      <th className="col-must-have">Must-haves</th>
                    )}
                    <th className="col-score">Score</th>
                    <th className="col-rank">Rank</th>
                    <th className="col-verdict">Good to Call</th>
                  </tr>
                </thead>
                <tbody>
                  {job.candidates.map((c, i) => {
                    const badge = goodToCallBadge(c.goodToCall);
                    const checked = selectedIds.includes(c.id);
                    return (
                      <tr key={c.id} className="report-table-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleSelect(c.id, e.target.checked)}
                          />
                        </td>
                        <td className="col-num-cell">{i + 1}</td>
                        <td className="cand">
                          <div className="report-cand-cell">
                            <button
                              type="button"
                              className="cand-link"
                              onClick={() => openCandidateDetail(c, i)}
                            >
                              {c.name}
                            </button>
                            {c.experienceIntelligence?.agencyBadgeType && (
                              <AgencyGoldBadge
                                label={c.experienceIntelligence.agencyBadgeType}
                                compact
                              />
                            )}
                          </div>
                        </td>
                        <td className="cell-contact">{c.email || "—"}</td>
                        <td className="cell-contact">{c.phone || "—"}</td>
                        <td className="cell-exp">
                          <div className="exp-stack">
                            <span>{c.overallExperience != null ? `${c.overallExperience}y` : "—"} total</span>
                            <span className="exp-sub">
                              {c.relevantExperience != null ? `${c.relevantExperience}y` : "—"} relevant
                            </span>
                          </div>
                        </td>
                        {showMustHaveColumn && (
                          <td className="col-must-have">
                            {c.mustHaveStats ? (
                              <MustHaveStatsDisplay stats={c.mustHaveStats} />
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                        <td>
                          <span
                            className="sc"
                            style={scoreColor(c.score, c.goodToCall, job.scoreThreshold)}
                          >
                            {c.score ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span className={`rnk ${(c.rank ?? i + 1) <= 2 ? "t" : ""}`}>
                            {c.rank ?? i + 1}
                          </span>
                        </td>
                        <td>
                          <span className={`vbadge ${badge.cls}`}>{badge.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {assessments.length > 0 && (
              <div className="report-assessments-panel" style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
                  Assessments for this role — select one or more to send
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {assessments.map((a) => {
                    const selected = selectedAssessmentIds.includes(a.id);
                    return (
                    <label
                      key={a.id}
                      style={{
                        border: `1px solid ${selected ? "var(--red)" : "var(--line)"}`,
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        background: selected ? "rgba(200,32,42,.06)" : "#fff",
                        cursor: "pointer",
                        display: "block",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => toggleAssessmentSelect(a.id, e.target.checked)}
                        style={{ marginRight: 8 }}
                      />
                      <strong>{a.name}</strong>
                      <span style={{ color: "var(--muted)", marginLeft: 6 }}>
                        {a.type === "LINK" ? "Link" : `${a.files.length || (a.hasFile ? 1 : 0)} file(s)`}
                        {a.roleTag ? ` · ${a.roleTag}` : ""}
                      </span>
                      <div style={{ marginTop: 4, marginLeft: 22 }}>
                        {a.type === "LINK" && a.url ? (
                          <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--red)" }} onClick={(e) => e.stopPropagation()}>
                            Open assessment link
                          </a>
                        ) : a.files.length > 0 ? (
                          a.files.map((f) => (
                            <a
                              key={f.id}
                              href={`${f.downloadUrl}&download=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--red)", display: "block" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {f.fileName}
                            </a>
                          ))
                        ) : a.hasFile && a.primaryDownloadUrl ? (
                          <a
                            href={`${a.primaryDownloadUrl}&download=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--red)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Preview document
                          </a>
                        ) : null}
                      </div>
                    </label>
                  )})}
                </div>
              </div>
            )}
            <div className="toolbar report-toolbar">
              <span className="sel">{selectedIds.length} selected</span>
              <span className="sel">{selectedAssessmentIds.length} assessment(s)</span>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="btn-x"
                  onClick={() => setExportOpen((o) => !o)}
                >
                  Export ▾
                </button>
                {exportOpen && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      right: 0,
                      marginBottom: 4,
                      background: "#fff",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                      zIndex: 10,
                      minWidth: 140,
                    }}
                  >
                    <button
                      type="button"
                      className="nav-btn"
                      style={{ width: "100%", border: "none", borderRadius: 0 }}
                      onClick={() => downloadReport("xlsx")}
                    >
                      ⤓ Excel
                    </button>
                    <button
                      type="button"
                      className="nav-btn"
                      style={{ width: "100%", border: "none", borderRadius: 0 }}
                      onClick={() => downloadReport("pdf")}
                    >
                      ⬇ PDF
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-send"
                onClick={openSendModal}
                disabled={assessments.length === 0}
              >
                ✉ Send Assessment
              </button>
            </div>
          </div>
        )}
      </div>

      {hasResults && (
        <div className="report-bottom report-shortlist-wrap">
          <div className="card report-shortlist-strip">
            <div className="card-header">
              <b>Top shortlist</b>
              <span className="meta">Quick picks · click to open full profile</span>
            </div>
            {topCandidates.length === 0 ? (
              <p className="report-shortlist-empty">
                No candidates met the shortlist threshold (≥ {job.scoreThreshold}).
              </p>
            ) : (
              <div className="shortlist-mini-grid">
                {topCandidates.map((c, i) => (
                  <ShortlistMiniCard
                    key={c.id}
                    candidate={c}
                    index={i}
                    isActive={detailCandidate?.candidate.id === c.id}
                    onSelect={() => openCandidateDetail(c, i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {hasResults && (
        <ExperienceIntelligenceSection
          candidates={job.candidates}
          activeId={expIntelCandidate?.id ?? null}
          onSelect={openExpIntelDetail}
        />
      )}

      {hasResults && skills.length > 0 && (
        <div className="report-bottom">
          <div className="card report-matrix-card">
            <div className="card-header">
              <b>Skill coverage matrix</b>
              <span className="meta">must-have skills</span>
            </div>
            <div className="matrix">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    {skills.map((s) => (
                      <th key={s}>{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixCandidates.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      {skills.map((skill) => {
                        const matched = c.matchedSkills.some(
                          (m) => m.toLowerCase() === skill.toLowerCase()
                        );
                        const missing = c.missingSkills.some(
                          (m) => m.toLowerCase() === skill.toLowerCase()
                        );
                        return (
                          <td key={skill}>
                            {skillCell(matched, !matched && !missing)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {hasResults && (
        <div className="report-bottom report-cta-wrap">
          <div className="cta-card">
            <h3>Send assessments to your shortlist</h3>
            <p>
              {selectedIds.length} candidates selected.
              {assessments.length === 0
                ? " Add assessments in the admin portal (with a matching role tag) to enable sending."
                : " Set the deadline below, then review and personalize each email before sending."}
            </p>
            {assessments.length > 0 && (
              <AssessmentDeadlinePicker
                variant="report"
                value={assessmentDeadline}
                onChange={setAssessmentDeadline}
              />
            )}
            <button
              type="button"
              className="btn-w"
              onClick={openSendModal}
              disabled={assessments.length === 0}
            >
              Send Assessment to {selectedIds.length} Candidates
            </button>
            <p className="sub">Powered by HireLens · {new Date().getFullYear()}</p>
          </div>
        </div>
      )}

      <AssessmentEmailActivity rows={emailActivity} onSelect={setEmailDetail} />

      <SendAssessmentModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        jobId={job.id}
        jobTitle={job.title}
        companyName={companyName}
        recruiterName={recruiterName}
        defaultAssessmentDays={defaultAssessmentDays}
        candidates={job.candidates}
        selectedIds={selectedIds}
        assessments={assessments}
        dbTemplates={emailTemplates}
        initialAssessmentIds={selectedAssessmentIds}
        initialDeadline={assessmentDeadline}
        onSent={() => router.refresh()}
      />

      <AssessmentEmailDetailDrawer
        row={emailDetail}
        companyName={companyName}
        open={!!emailDetail}
        onOpenChange={(open) => !open && setEmailDetail(null)}
      />

      <div className="footer-nav">
        <Link href={`/processing/${job.id}`}>← Processing</Link>
        <Link href="/">Back to landing</Link>
      </div>
    </div>
  );
}
