"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";
import { confirmScreeningSkillsAction } from "@/actions/job.actions";

function SkillTiles({
  skills,
  selected,
  onChange,
  variant,
}: {
  skills: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  variant: "must" | "nice";
}) {
  function toggle(skill: string) {
    const next = new Set(selected);
    if (next.has(skill)) next.delete(skill);
    else next.add(skill);
    onChange(next);
  }

  return (
    <div className="skills-tile-grid" role="group">
      {skills.map((skill) => {
        const isOn = selected.has(skill);
        return (
          <button
            key={skill}
            type="button"
            className={`skill-tile skill-tile--${variant}${isOn ? " skill-tile--selected" : ""}`}
            aria-pressed={isOn}
            onClick={() => toggle(skill)}
          >
            <div className="skill-tile-top">
              <span className="skill-tile-badge">
                {variant === "must" ? "Must-have" : "Good-to-have"}
              </span>
              <span className="skill-tile-check" aria-hidden>
                {isOn ? "✓" : ""}
              </span>
            </div>
            <span className="skill-tile-label">{skill}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SkillsSelectionForm({
  jobId,
  jobTitle,
  mustHaveSkills,
  niceToHaveSkills,
  resumeCount,
}: {
  jobId: string;
  jobTitle: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  resumeCount: number;
}) {
  const router = useRouter();
  const [selectedMust, setSelectedMust] = useState<Set<string>>(new Set(mustHaveSkills));
  const [selectedNice, setSelectedNice] = useState<Set<string>>(new Set(niceToHaveSkills));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedMust.size === 0) {
      toast.error("Select at least one must-have skill");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    selectedMust.forEach((s) => formData.append("mustHaveSkills", s));
    selectedNice.forEach((s) => formData.append("niceToHaveSkills", s));

    try {
      await confirmScreeningSkillsAction(jobId, formData);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      toast.error(err instanceof Error ? err.message : "Could not start screening");
      setLoading(false);
    }
  }

  const totalSelected = selectedMust.size + selectedNice.size;

  return (
    <form className="skills-layout" onSubmit={handleSubmit}>
      <header className="skills-hero">
        <div className="skills-hero-glow" aria-hidden />
        <span className="skills-step-pill">Step 2 of 2 · Skill selection</span>
        <h1 className="skills-hero-title">
          Choose the skills to <span className="accent">screen against</span>
        </h1>
        <p className="skills-hero-lead">
          We analyzed your job description and mapped competencies to must-have requirements. Tap
          tiles to include or exclude skills — candidate gaps on the report use your selected
          must-haves only.
        </p>
      </header>

      <div className="skills-summary-row">
        <div className="skills-summary-card">
          <span className="skills-summary-label">Role</span>
          <strong className="skills-summary-value">{jobTitle}</strong>
        </div>
        <div className="skills-summary-card">
          <span className="skills-summary-label">Resumes queued</span>
          <strong className="skills-summary-value">{resumeCount}</strong>
        </div>
        <div className="skills-summary-card skills-summary-card--accent">
          <span className="skills-summary-label">Skills selected</span>
          <strong className="skills-summary-value">
            {totalSelected}
            <span className="skills-summary-sub">
              {selectedMust.size} must · {selectedNice.size} nice
            </span>
          </strong>
        </div>
      </div>

      <section className="skills-panel">
        <div className="skills-panel-head">
          <div className="skills-panel-icon skills-panel-icon--must" aria-hidden>
            ★
          </div>
          <div className="skills-panel-copy">
            <h2>Must-have skills</h2>
            <p>From Competencies and required sections in your JD — used for gap analysis</p>
          </div>
          <div className="skills-panel-tools">
            <span className="skills-count-badge">
              {selectedMust.size}/{mustHaveSkills.length} selected
            </span>
            <button
              type="button"
              className="skills-tool-btn"
              onClick={() => setSelectedMust(new Set(mustHaveSkills))}
            >
              Select all
            </button>
            <button type="button" className="skills-tool-btn" onClick={() => setSelectedMust(new Set())}>
              Clear
            </button>
          </div>
        </div>
        <SkillTiles
          skills={mustHaveSkills}
          selected={selectedMust}
          onChange={setSelectedMust}
          variant="must"
        />
      </section>

      {niceToHaveSkills.length > 0 && (
        <section className="skills-panel">
          <div className="skills-panel-head">
            <div className="skills-panel-icon skills-panel-icon--nice" aria-hidden>
              ◆
            </div>
            <div className="skills-panel-copy">
              <h2>Good-to-have skills</h2>
              <p>Preferred capabilities inferred from your JD — boosts scoring when matched</p>
            </div>
            <div className="skills-panel-tools">
              <span className="skills-count-badge skills-count-badge--nice">
                {selectedNice.size}/{niceToHaveSkills.length} selected
              </span>
              <button
                type="button"
                className="skills-tool-btn"
                onClick={() => setSelectedNice(new Set(niceToHaveSkills))}
              >
                Select all
              </button>
              <button type="button" className="skills-tool-btn" onClick={() => setSelectedNice(new Set())}>
                Clear
              </button>
            </div>
          </div>
          <SkillTiles
            skills={niceToHaveSkills}
            selected={selectedNice}
            onChange={setSelectedNice}
            variant="nice"
          />
        </section>
      )}

      <footer className="skills-footer">
        <button
          type="button"
          className="btn-ghost skills-footer-back"
          onClick={() => router.push("/")}
          disabled={loading}
        >
          ← Back
        </button>
        <div className="skills-footer-note">
          <span className="check">✓</span> Missing skills on the report = unselected must-haves only
        </div>
        <button type="submit" className="btn-submit skills-footer-cta" disabled={loading || selectedMust.size === 0}>
          {loading ? "Starting screening…" : `Screen ${resumeCount} candidate${resumeCount === 1 ? "" : "s"} →`}
        </button>
      </footer>
    </form>
  );
}
