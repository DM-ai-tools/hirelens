"use client";

import { useEffect, useState } from "react";
import type { CompanyExperienceDetail, ExperienceIntelligenceResult } from "@/types";
import { resolveCurrentEmployer, sortCandidatesByExperienceIntelligenceScore } from "@/lib/experience-intelligence.utils";
import type { CandidateRow } from "@/components/candidates/candidates-table";
import { AgencyGoldBadge } from "@/components/report/agency-gold-badge";

export interface ExperienceIntelligenceRow extends CandidateRow {
  experienceIntelligenceRank: number | null;
  experienceIntelligenceScore: number | null;
  experienceIntelligence: ExperienceIntelligenceResult | null;
}

function expScoreClass(score: number | null) {
  if (score == null) return "";
  if (score >= 75) return "ei-score-high";
  if (score >= 55) return "ei-score-mid";
  if (score >= 35) return "ei-score-mid";
  return "ei-score-low";
}

function recommendationBadgeClass(value: string) {
  const v = value.toLowerCase();
  if (v.includes("strong")) return "ei-badge--rec-strong";
  if (v.includes("good")) return "ei-badge--rec-good";
  if (v.includes("consider")) return "ei-badge--rec-consider";
  return "ei-badge--rec-weak";
}

function ratingBadge(value: string, variant: "company" | "impact" | "rec") {
  if (variant === "rec") {
    return <span className={`ei-badge ${recommendationBadgeClass(value)}`}>{value}</span>;
  }
  return <span className={`ei-badge ei-badge--${variant}`}>{value}</span>;
}

function CompanyDetailBlock({ co }: { co: CompanyExperienceDetail }) {
  return (
    <section className="ei-section ei-company-card">
      <h3 className="ei-company-name">{co.companyName}</h3>
      <dl className="ei-company-dl">
        <div className="ei-company-dl-row">
          <dt>Company Industry</dt>
          <dd>{co.industry || "—"}</dd>
        </div>
        <div className="ei-company-dl-row">
          <dt>Company Description</dt>
          <dd>{co.companyDescription || "—"}</dd>
        </div>
        <div className="ei-company-dl-row">
          <dt>What the company does</dt>
          <dd>{co.whatCompanyDoes || "—"}</dd>
        </div>
        <div className="ei-company-dl-row">
          <dt>Candidate Role</dt>
          <dd>{co.role || "—"}</dd>
        </div>
        <div className="ei-company-dl-row">
          <dt>Duration</dt>
          <dd>{co.duration || "—"}</dd>
        </div>
        <div className="ei-company-dl-row">
          <dt>Company Domain</dt>
          <dd>
            {co.companyDomain ? (
              co.companyUrl ? (
                <a
                  href={co.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ei-company-url"
                >
                  {co.companyDomain}
                </a>
              ) : (
                co.companyDomain
              )
            ) : co.companyUrl ? (
              <a
                href={co.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ei-company-url"
              >
                {co.companyUrl.replace(/^https?:\/\//i, "")}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        {co.companyUrl && co.companyDomain && (
          <div className="ei-company-dl-row">
            <dt>Company URL</dt>
            <dd>
              <a
                href={co.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ei-company-url"
              >
                {co.companyUrl}
              </a>
            </dd>
          </div>
        )}
      </dl>
      {co.keyResponsibilities.length > 0 && (
        <>
          <h4>Key responsibilities</h4>
          <ul className="ei-list">
            {co.keyResponsibilities.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}
      {co.projects.length > 0 && (
        <>
          <h4>Projects</h4>
          <ul className="ei-list">
            {co.projects.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </>
      )}
      {co.technologies.length > 0 && (
        <div className="ei-chips">
          {co.technologies.map((t) => (
            <span key={t} className="tag2">
              {t}
            </span>
          ))}
        </div>
      )}
      {co.businessImpact && (
        <>
          <h4>Business impact</h4>
          <p className="ei-prose">{co.businessImpact}</p>
        </>
      )}
      {co.achievements.length > 0 && (
        <>
          <h4>Achievements</h4>
          <ul className="ei-list">
            {co.achievements.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}
      {co.valueForHiringRole && (
        <p className="ei-value-callout">
          <strong>Value for this role:</strong> {co.valueForHiringRole}
        </p>
      )}
    </section>
  );
}

export function ExperienceIntelligenceSection({
  candidates,
  onSelect,
  activeId,
}: {
  candidates: ExperienceIntelligenceRow[];
  onSelect: (row: ExperienceIntelligenceRow) => void;
  activeId: string | null;
}) {
  const sorted = sortCandidatesByExperienceIntelligenceScore(
    candidates.filter((c) => c.experienceIntelligenceScore != null)
  );

  if (sorted.length === 0) return null;

  const hasData = sorted.some((c) => c.experienceIntelligence != null);

  return (
    <div className="report-bottom report-exp-intel-wrap">
      <div className="card report-exp-intel-card">
        <div className="card-header">
          <div>
            <b>Experience Intelligence Ranking</b>
            <p className="ei-subtitle">
              Candidates ranked by EI score (highest first) — agency candidates are not auto-ranked
              first. Gold badges mark digital marketing agency experience. Recommendation: Strong hire
              ≥75 · Good potential ≥55 · Consider ≥35 · Weak fit &lt;35.
            </p>
          </div>
          <span className="meta">Separate from AI candidate score</span>
        </div>

        {!hasData ? (
          <p className="ei-empty">
            Experience intelligence data is being generated. Re-open this report after screening
            completes, or start a new screening run.
          </p>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table ei-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Location</th>
                  <th>EI Score</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Industry</th>
                  <th>Level</th>
                  <th>Co. Rating</th>
                  <th>Impact</th>
                  <th>Agency</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, index) => {
                  const ei = c.experienceIntelligence;
                  const employer = ei ? resolveCurrentEmployer(ei) : null;
                  const displayRank = index + 1;
                  const displayScore = c.experienceIntelligenceScore ?? ei?.score ?? null;
                  const isActive = activeId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={`ei-row${isActive ? " is-active" : ""}`}
                      onClick={() => onSelect(c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(c);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View experience profile for ${c.name}`}
                    >
                      <td>
                        <span className={`rnk ${displayRank <= 2 ? "t" : ""}`}>
                          {displayRank}
                        </span>
                      </td>
                      <td className="cand">
                        <span className="cand-link ei-cand-name">{c.name}</span>
                        {ei?.agencyBadgeType && (
                          <AgencyGoldBadge label={ei.agencyBadgeType} />
                        )}
                      </td>
                      <td className="tiny">{c.location?.trim() || "—"}</td>
                      <td>
                        <span className={`sc ei-score ${expScoreClass(displayScore)}`}>
                          {displayScore?.toFixed(1) ?? "—"}
                        </span>
                      </td>
                      <td className="cell-contact">{employer?.company ?? "—"}</td>
                      <td className="tiny">{employer?.role ?? "—"}</td>
                      <td className="tiny">{ei?.industry ?? "—"}</td>
                      <td className="tiny">{ei?.experienceLevel ?? "—"}</td>
                      <td>{ei ? ratingBadge(ei.companyRating, "company") : "—"}</td>
                      <td>{ei ? ratingBadge(ei.impactRating, "impact") : "—"}</td>
                      <td>
                        {ei?.agencyBadgeType ? (
                          <AgencyGoldBadge label={ei.agencyBadgeType} compact />
                        ) : (
                          <span className="ei-muted">—</span>
                        )}
                      </td>
                      <td>
                        {ei ? ratingBadge(ei.overallRecommendation, "rec") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function ExperienceIntelligencePanel({
  candidate,
  onClose,
}: {
  candidate: ExperienceIntelligenceRow;
  onClose: () => void;
}) {
  const ei = candidate.experienceIntelligence;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!ei) return null;

  const employer = resolveCurrentEmployer(ei);
  const breakdownItems = [
    { label: "Relevant role experience", value: ei.breakdown.relevantRoleExperience, weight: "35%" },
    { label: "Business impact", value: ei.breakdown.businessImpact, weight: "20%" },
    { label: "Technical complexity", value: ei.breakdown.technicalComplexity, weight: "15%" },
    { label: "Leadership / ownership", value: ei.breakdown.leadershipOwnership, weight: "10%" },
    { label: "Company relevance", value: ei.breakdown.companyRelevance, weight: "10%" },
    { label: "Years of experience", value: ei.breakdown.yearsExperience, weight: "10%" },
  ];

  return (
    <>
      <div
        className={`ei-panel-backdrop${visible ? " is-open" : ""}`}
        onClick={onClose}
        role="presentation"
      />
      <aside
        className={`ei-panel${visible ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ei-panel-title"
      >
        <header className="ei-panel-head">
          <div>
            <h2 id="ei-panel-title">{candidate.name}</h2>
            <p className="ei-panel-role">
              {employer.role} · {employer.company}
            </p>
          </div>
          <button type="button" className="ei-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="ei-panel-body">
          <section className="ei-section ei-score-hero">
            <div className="ei-score-ring">
              <span className="ei-score-num">{ei.score.toFixed(1)}</span>
              <span className="ei-score-label">EI Score</span>
            </div>
            <div className="ei-score-meta">
              <p className="ei-rationale">{ei.scoreRationale}</p>
              <div className="ei-chips">
                <span className="tag2">{ei.experienceLevel}</span>
                <span className="tag2">{ei.industry}</span>
                {ei.agencyBadgeType && (
                  <AgencyGoldBadge label={ei.agencyBadgeType} />
                )}
              </div>
            </div>
          </section>

          <section className="ei-section">
            <h3>Score breakdown</h3>
            <div className="ei-breakdown">
              {breakdownItems.map((item) => (
                <div key={item.label} className="ei-breakdown-row">
                  <div className="ei-breakdown-top">
                    <span>{item.label}</span>
                    <span>
                      <strong>{item.value.toFixed(0)}</strong>
                      <small> ({item.weight})</small>
                    </span>
                  </div>
                  <div className="ei-breakdown-bar">
                    <div className="ei-breakdown-fill" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ei-section">
            <h3>AI experience summary</h3>
            <p className="ei-prose">{ei.aiExperienceSummary}</p>
          </section>

          <section className="ei-section">
            <h3>Professional career timeline</h3>
            <div className="ei-timeline">
              {ei.previousRolesTimeline.length > 0 ? (
                ei.previousRolesTimeline.map((t, i) => (
                  <div key={`${t.company}-${i}`} className="ei-timeline-item">
                    <div className="ei-timeline-dot" />
                    <div>
                      <b>{t.role}</b>
                      <span>
                        {t.company} · {t.duration}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="ei-muted">No structured timeline available.</p>
              )}
            </div>
          </section>

          {ei.companies.length > 0 ? (
            <>
              <h3 className="ei-companies-heading">Employer profiles</h3>
              {ei.companies.map((co, i) => (
                <CompanyDetailBlock key={`${co.companyName}-${i}`} co={co} />
              ))}
            </>
          ) : (
            <section className="ei-section">
              <h3>Employer profiles</h3>
              <p className="ei-muted">No professional employer details available.</p>
            </section>
          )}

          <section className="ei-section ei-value-card">
            <h3>Why this candidate is valuable</h3>
            <p className="ei-prose">{ei.hiringValue.whyValuable}</p>
            <h4>How experience transfers</h4>
            <p className="ei-prose">{ei.hiringValue.experienceTransfer}</p>
            <h4>Business value</h4>
            <p className="ei-prose">{ei.hiringValue.businessValue}</p>
            {ei.hiringValue.technicalStrengths.length > 0 && (
              <>
                <h4>Technical strengths</h4>
                <div className="ei-chips">
                  {ei.hiringValue.technicalStrengths.map((s) => (
                    <span key={s} className="tag2">
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}
            {ei.hiringValue.potentialRisks.length > 0 && (
              <>
                <h4>Potential risks</h4>
                <ul className="ei-list ei-list--risk">
                  {ei.hiringValue.potentialRisks.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            )}
            {ei.hiringValue.interviewFocus.length > 0 && (
              <>
                <h4>Recommended interview focus</h4>
                <ul className="ei-list">
                  {ei.hiringValue.interviewFocus.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {ei.agencyBadgeType && (
            <section className="ei-section ei-agency-card">
              <h3>Digital marketing agency experience</h3>
              <p className="ei-company-meta">
                <AgencyGoldBadge label={ei.agencyBadgeType} />
                {ei.agencyExperience?.agencyName ? (
                  <> · {ei.agencyExperience.agencyName}</>
                ) : null}
              </p>
              {ei.agencyRelevantToJd ? (
                <p className="ei-agency-jd-note ei-agency-jd-note--positive">
                  Positive signal for this role — agency experience aligns with the job description
                  (modest boost to company relevance and role fit; does not override overall EI
                  ranking).
                </p>
              ) : (
                <p className="ei-agency-jd-note">
                  Agency experience highlighted for visibility. No score boost applied — this job
                  description is not marketing-focused.
                </p>
              )}
              {ei.agencyExperience ? (
                <>
                  <p className="ei-prose">
                    <strong>Role:</strong> {ei.agencyExperience.role}
                  </p>
                  {ei.agencyExperience.responsibilities.length > 0 && (
                    <>
                      <h4>Responsibilities</h4>
                      <ul className="ei-list">
                        {ei.agencyExperience.responsibilities.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {ei.agencyExperience.campaignTypes.length > 0 && (
                    <>
                      <h4>Campaign types</h4>
                      <div className="ei-chips">
                        {ei.agencyExperience.campaignTypes.map((c) => (
                          <span key={c} className="tag2">
                            {c}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {ei.agencyExperience.platforms.length > 0 && (
                    <>
                      <h4>Platforms &amp; tools</h4>
                      <div className="ei-chips">
                        {ei.agencyExperience.platforms.map((p) => (
                          <span key={p} className="tag2">
                            {p}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {ei.agencyExperience.benefitsForRole && (
                    <p className="ei-value-callout">{ei.agencyExperience.benefitsForRole}</p>
                  )}
                </>
              ) : (
                <p className="ei-prose ei-muted">
                  Resume indicates work at a {ei.agencyBadgeType.toLowerCase()}. Open employer
                  profiles below for role details.
                </p>
              )}
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
