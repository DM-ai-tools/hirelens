"use client";

import { useState } from "react";
import { ScreeningForm } from "@/components/screening/screening-form";
import { ScoringLegend } from "@/components/screening/scoring-legend";

export function LandingHero() {
  const [scoreThreshold, setScoreThreshold] = useState("70");

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="badge">
              <span className="pulse" />
              UPLOAD A JD · DROP RESUMES · RANKED IN ~90s
            </div>
            <h1>
              Screen every resume against the <span className="accent">job</span> — in seconds, not days.
            </h1>
            <div className="under-mark" />
            <p className="hero-sub">
              HireLens reads each candidate against your job description, scores fit, surfaces strengths
              and skill gaps, and ranks the shortlist. Pick who to advance and send assessments — straight
              from the report.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <b>200</b>
                <span>RESUMES / BATCH</span>
              </div>
              <div className="hero-stat">
                <b>10</b>
                <span>SIGNALS SCORED</span>
              </div>
              <div className="hero-stat">
                <b>~90s</b>
                <span>TYPICAL RUN</span>
              </div>
              <div className="hero-stat">
                <b>1-click</b>
                <span>ASSESSMENT SEND</span>
              </div>
            </div>
          </div>
          <ScreeningForm
            scoreThreshold={scoreThreshold}
            onScoreThresholdChange={setScoreThreshold}
          />
        </div>
      </section>
      <ScoringLegend scoreThreshold={parseFloat(scoreThreshold) || 70} />
    </>
  );
}
