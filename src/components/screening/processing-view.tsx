"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { GoodToCall } from "@prisma/client";
import { getVerdictThresholds, formatMinExperience } from "@/lib/constants";
import type { ProcessingStatus } from "@/types";

const STAGES = [
  { key: "parse", label: "Ingest & parse", icon: "⬇" },
  { key: "extract", label: "Field extraction", icon: "◎" },
  { key: "evaluate", label: "LLM evaluation", icon: "★" },
  { key: "rank", label: "Score & rank", icon: "≣" },
] as const;

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function verdictClass(
  score: number | null,
  goodToCall: GoodToCall | null | undefined,
  scoreThreshold: number
) {
  if (goodToCall === "YES") return "v-good";
  if (goodToCall === "MAYBE") return "v-ok";
  if (goodToCall === "NO") return "v-bad";
  if (goodToCall === "NEEDS_REVIEW") return "v-ok";
  const { good, maybeMin } = getVerdictThresholds(scoreThreshold);
  if (score == null) return "v-ok";
  if (score < maybeMin) return "v-bad";
  if (score >= good) return "v-good";
  return "v-ok";
}

function verdictLabel(
  score: number | null,
  goodToCall: GoodToCall | null | undefined,
  scoreThreshold: number
) {
  if (goodToCall === "YES") return "Good";
  if (goodToCall === "MAYBE") return "Maybe";
  if (goodToCall === "NO") return "Not now";
  if (goodToCall === "NEEDS_REVIEW") return "Review";
  if (score == null) return "…";
  const { good, maybeMin } = getVerdictThresholds(scoreThreshold);
  if (score >= good) return "Good";
  if (score >= maybeMin) return "Maybe";
  return "Not now";
}

export function ProcessingView({
  jobId,
  initialJob,
}: {
  jobId: string;
  initialJob: { title: string; minExperience: number; scoreThreshold: number };
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const redirectingRef = useRef(false);
  const lastFinishedRef = useRef(-1);
  const lastProgressAtRef = useRef(Date.now());

  useEffect(() => {
    let active = true;

    async function kickOff() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/process`, {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        const reason = json.data?.reason ?? json.reason;
        if (reason === "awaiting_skills") {
          router.replace(`/screening/${jobId}/skills`);
        }
      } catch {
        /* polling will surface errors */
      }
    }

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/status`, { credentials: "include" });
        const json = await res.json();
        if (!active) return;

        if (!res.ok || json.success === false) {
          if (json.reason === "awaiting_skills") {
            router.replace(`/screening/${jobId}/skills`);
            return;
          }
          setError(
            json.error ||
              json.message ||
              "Unable to load screening status. Please sign in and try again."
          );
          return;
        }

        const data = (json.data ?? json) as ProcessingStatus;
        setError(null);
        setStatus(data);

        const finishedNow = data.finished ?? data.evaluated ?? 0;
        if (finishedNow !== lastFinishedRef.current) {
          lastFinishedRef.current = finishedNow;
          lastProgressAtRef.current = Date.now();
        } else if (
          !data.isComplete &&
          data.total > 0 &&
          Date.now() - lastProgressAtRef.current > 12000
        ) {
          lastProgressAtRef.current = Date.now();
          void kickOff();
        }

        const done =
          data.isComplete ||
          (data.total > 0 && (data.finished ?? 0) >= data.total);

        if (done && !redirectingRef.current) {
          redirectingRef.current = true;
          setTimeout(() => router.push(`/report/${jobId}`), 1500);
        }
      } catch {
        if (active) setError("Connection lost — retrying…");
      }
    }

    void kickOff();
    void poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [jobId, router]);

  const scoreThreshold = status?.scoreThreshold ?? initialJob.scoreThreshold;
  const modelName = status?.modelName ?? "…";
  const jobTitle = status?.title || initialJob.title;
  const minExp = status?.minExperience ?? initialJob.minExperience;
  const total = status?.total ?? 0;
  const evaluated = status?.evaluated ?? 0;
  const parsed = status?.parsed ?? 0;
  const failed = status?.failed ?? 0;
  const finished = status?.finished ?? evaluated + failed;
  const progress = total > 0 ? Math.round((evaluated / total) * 100) : 0;
  const stage = status?.currentStage ?? "parse";
  const isComplete = !!status?.isComplete;
  const isRunning = !isComplete && (status?.currentStage !== "complete" || finished < total);

  const ranked = [...(status?.candidates ?? [])]
    .filter((c) => c.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const evaluating = status?.candidates.find((c) => c.status === "EVALUATING");
  const queued =
    status?.candidates.filter((c) =>
      ["UPLOADED", "PARSED", "PARSING"].includes(c.status)
    ).length ?? Math.max(0, total - finished);

  function stageState(key: string) {
    if (isComplete) return "done";
    if (key === "parse") {
      if (parsed >= total && total > 0) return "done";
      if (stage === "parse" || stage === "ingest") return "running";
      return "done";
    }
    if (key === "extract") {
      if (parsed >= total && total > 0 && (stage === "evaluate" || stage === "rank" || stage === "complete"))
        return "done";
      if (stage === "extract") return "running";
      if (parsed >= total && total > 0) return "done";
      return "pending";
    }
    if (key === "evaluate") {
      if (evaluated + failed >= total && total > 0) return "done";
      if (stage === "evaluate") return "running";
      if (parsed >= total && total > 0) return "running";
      return "pending";
    }
    if (key === "rank") {
      if (isComplete) return "done";
      if (stage === "rank") return "running";
      return "pending";
    }
    return "pending";
  }

  function stagePct(key: string) {
    const state = stageState(key);
    if (state === "done") return 100;
    if (key === "parse") return total ? Math.round((parsed / total) * 100) : 0;
    if (key === "extract") return total && parsed >= total ? 100 : state === "running" ? 60 : 8;
    if (key === "evaluate") return total ? Math.round((evaluated / total) * 100) : 0;
    return state === "running" ? 15 : 8;
  }

  function stageStat(key: string) {
    const state = stageState(key);
    if (key === "parse") {
      return state === "done" ? `✓ ${parsed} / ${total}` : `⟳ ${parsed} / ${total}`;
    }
    if (key === "extract") {
      return state === "done" ? `✓ ${total} / ${total}` : state === "running" ? `⟳ ${parsed} / ${total}` : "queued";
    }
    if (key === "evaluate") {
      return state === "done"
        ? `✓ ${evaluated} / ${total}`
        : state !== "pending"
          ? `⟳ ${evaluated} / ${total}`
          : "queued";
    }
    if (key === "rank") {
      return state === "done" ? `✓ ${evaluated} / ${total}` : state === "running" ? "⟳ ranking" : "queued";
    }
    return "queued";
  }

  return (
    <div className="hirelens-page">
      <nav>
        <div className="nav-inner">
          <BrandLogo subtitle="SCREENING · LIVE RUN" />
          <div className="nav-right">
            <ThemeToggle variant="nav" />
            <span className="status-pill">
              <span className="sp-dot" />
              {isComplete ? "SCREENING COMPLETE" : isRunning ? "SCREENING IN PROGRESS" : "STARTING…"}
            </span>
            <span style={{ color: "var(--mute)", fontWeight: 500 }}>{jobTitle}</span>
          </div>
        </div>
      </nav>

      <div className="page">
        {error && (
          <p
            style={{
              gridColumn: "1 / -1",
              marginBottom: 12,
              padding: "12px 16px",
              borderRadius: 10,
              background: "#FBE9EA",
              color: "#C8202A",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {error}
          </p>
        )}
        <div className="panel">
          <div className="panel-header">
            <h2>Screening {total || "…"} candidates</h2>
            <div className="under-mark" />
            <p className="panel-sub">
              Each resume is parsed, matched against the JD and scored across 10 signals. The ranked
              shortlist fills in on the right as candidates resolve.
            </p>
          </div>

          <div className="scan-chips">
            <div className="sc-item">
              <span className="tag">ROLE</span>
              <b>{jobTitle}</b>
            </div>
            <div className="sc-item">
              <span className="tag">RESUMES</span>
              <b>{total}</b>
            </div>
            <div className="sc-item">
              <span className="tag">MIN EXP</span>
              <b>{formatMinExperience(minExp, true)}</b>
            </div>
            <div className="sc-item">
              <span className="tag">THRESHOLD</span>
              <b>≥ {scoreThreshold}</b>
            </div>
            <div className="sc-item">
              <span className="tag">MODEL</span>
              <b>{modelName}</b>
            </div>
            <div className="sc-item">
              <span className="tag">ETA</span>
              <b>{status?.etaSeconds ? `~${status.etaSeconds} sec` : "…"}</b>
            </div>
          </div>

          <div className="overall">
            <div className="overall-top">
              <b>Overall progress</b>
              <span>
                {evaluated} of {total} candidates scored
                {failed > 0 ? ` · ${failed} failed` : ""}
              </span>
            </div>
            <div className="pbar">
              <div className="pbar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="stage-section">
            <div className="ks-title">Pipeline stages</div>
            <div className="kw-grid">
              {STAGES.map((s) => {
                const state = stageState(s.key);
                const pct = stagePct(s.key);
                const fillColor =
                  state === "done" ? "var(--green)" : state === "running" ? "var(--red)" : "var(--mute)";
                return (
                  <div key={s.key} className={`kw-row ${state}`}>
                    <div
                      className="kw-icon"
                      style={{
                        background:
                          state === "done"
                            ? "var(--green)"
                            : state === "running"
                              ? "var(--red)"
                              : "var(--mute)",
                      }}
                    >
                      {s.icon}
                    </div>
                    <div className="kw-flex">
                      <div className="kw-line1">
                        <span className="kname">{s.label}</span>
                        <span
                          className="kstat"
                          style={
                            state === "done"
                              ? { color: "var(--green)", fontWeight: 700 }
                              : state === "running"
                                ? { color: "var(--red)", fontWeight: 700 }
                                : undefined
                          }
                        >
                          {stageStat(s.key)}
                        </span>
                      </div>
                      <div className="kw-pbar">
                        <div
                          className="kw-pbar-fill"
                          style={{ width: `${pct}%`, background: fillColor }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ticker">
            <div className="ticker-head">
              <b>Candidate stream</b>
              <span>
                {evaluated} scored · {evaluating ? "1 evaluating" : "0 evaluating"} · {Math.max(queued, 0)}{" "}
                queued
              </span>
            </div>
            <div className="chips">
              {status?.candidates.map((c) => (
                <span
                  key={c.id}
                  className={`chip-s ${
                    c.status === "EVALUATED"
                      ? "cs-done"
                      : c.status === "EVALUATING"
                        ? "cs-doing"
                        : c.status === "FAILED"
                          ? "cs-wait"
                          : "cs-wait"
                  }`}
                  style={c.status === "FAILED" ? { opacity: 0.65, textDecoration: "line-through" } : undefined}
                >
                  {c.name || "Parsing…"}
                  {c.status === "EVALUATED"
                    ? " ✓"
                    : c.status === "EVALUATING"
                      ? " ⟳"
                      : c.status === "FAILED"
                        ? " ✕"
                        : ""}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11.5, color: "var(--mute)", marginTop: 12 }}>
              Your ranked shortlist is building on the right → top candidates rise as scores resolve
            </p>
          </div>
        </div>

        <div className="lead-wrap">
          <div className="lead-head">
            <b>
              Live Ranking<small>· TOP CANDIDATES</small>
            </b>
            <span className="live">LIVE</span>
          </div>
          <div className="lead-body lead-body--ranked">
            {ranked.slice(0, 8).map((c, i) => (
              <article
                key={c.id}
                className={`lrow-card ${c.status === "EVALUATING" ? "is-new" : i < 3 ? "is-ranked" : ""}`}
              >
                <div className="lrow-card__rank-col">
                  <div className={`lrank ${i < 2 ? "t" : ""}`}>{i + 1}</div>
                  <div className="lava">{initials(c.name)}</div>
                </div>
                <div className="lrow-card__main">
                  <div className="lrow-card__header">
                    <b className="lrow-card__name">{c.name}</b>
                    <div className="lrow-card__score">
                      <span className="n">{c.score ?? "—"}</span>
                      <span className={`v ${verdictClass(c.score, c.goodToCall, scoreThreshold)}`}>
                        {verdictLabel(c.score, c.goodToCall, scoreThreshold)}
                      </span>
                    </div>
                  </div>
                  <p className="lrow-card__meta">
                    {c.score != null ? `Score ${c.score}` : "Scoring…"}
                    {c.relevantExperience != null ? ` · ${c.relevantExperience}y relevant` : ""}
                  </p>
                  {c.aiRationale && (
                    <p className="lrow-card__rationale">{c.aiRationale}</p>
                  )}
                </div>
              </article>
            ))}
            {ranked.length === 0 && (
              <p style={{ padding: 16, fontSize: 13, color: "var(--mute)" }}>
                Scores will appear as candidates are evaluated…
              </p>
            )}
            {evaluated < total && (
              <>
                <div className="lpending">
                  <div className="skel" />
                  <div className="ph" />
                </div>
                <div className="lpending">
                  <div className="skel" />
                  <div className="ph" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="footer-nav">
        <Link href="/">← Landing</Link>
        {isComplete ? (
          <Link href={`/report/${jobId}`}>Next: Report →</Link>
        ) : (
          <span style={{ color: "var(--mute)" }}>Next: Report →</span>
        )}
      </div>
    </div>
  );
}
