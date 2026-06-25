"use client";

import { getVerdictThresholds } from "@/lib/constants";

export function ScoringLegend({ scoreThreshold }: { scoreThreshold: number }) {
  const { good, maybeMin, maybeMax } = getVerdictThresholds(scoreThreshold);

  return (
    <section id="legend" className="block legend-section">
      <div className="block-inner text-center">
        <span className="eyebrow">The scoring system</span>
        <h2>
          What the <span className="accent">verdicts</span> mean
        </h2>
        <div className="under-mark center" />
        <p className="section-lead mx-auto" style={{ marginBottom: 24 }}>
          Shortlist threshold for this run: <b>score ≥ {good}</b>
        </p>
        <div className="legend-grid">
          <div className="legend-card">
            <div className="swatch" style={{ background: "linear-gradient(135deg,#1E9E5A,#3FBF7C)" }}>
              ✓
            </div>
            <h4>Good to Call</h4>
            <p>
              Score ≥ {good} <b>and</b> all must-have skills are present. Advance now.
            </p>
          </div>
          <div className="legend-card">
            <div className="swatch" style={{ background: "linear-gradient(135deg,#E0A106,#F2C04A)" }}>
              ~
            </div>
            <h4>Maybe</h4>
            <p>
              Score between {maybeMin} and {maybeMax}, <b>or</b> one must-have skill is missing.
              Worth a closer look.
            </p>
          </div>
          <div className="legend-card">
            <div className="swatch" style={{ background: "linear-gradient(135deg,#E24B4A,#F0807F)" }}>
              ✕
            </div>
            <h4>Not now</h4>
            <p>
              Score &lt; {maybeMin}, <b>or</b> more than one must-have skill is missing. Park for
              later.
            </p>
          </div>
          <div className="legend-card">
            <div className="swatch" style={{ background: "linear-gradient(135deg,#9AA7B6,#C2CCD7)" }}>
              ?
            </div>
            <h4>Needs review</h4>
            <p>Resume unparseable or contact missing — flagged for a manual check.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
