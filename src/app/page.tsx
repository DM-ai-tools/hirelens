import Link from "next/link";
import "@/styles/hirelens-design.css";
import { TopBar, SiteNav } from "@/components/brand/brand-logo";
import { DotMappersLogo } from "@/components/brand/dotmappers-logo";
import { LandingHero } from "@/components/screening/landing-hero";
import { BRAND } from "@/lib/constants";
import { loadActiveJobDescriptions } from "@/lib/job-description-queries";

export default async function LandingPage() {
  const savedJobDescriptions = await loadActiveJobDescriptions();

  return (
    <div className="hirelens-page">
      <TopBar />
      <SiteNav />

      <LandingHero savedJobDescriptions={savedJobDescriptions} />

      <section id="how" className="block">
        <div className="block-inner text-center">
          <span className="eyebrow">How it works</span>
          <h2>
            From a stack of resumes to a <span className="accent">ranked shortlist</span> — in 3 steps
          </h2>
          <div className="under-mark center" />
          <p className="section-lead mx-auto">
            Upload your JD and resumes, let HireLens score every candidate in parallel, then review the
            ranked table and send assessments in one click.
          </p>
          <div className="how-grid">
            <div className="how-card">
              <div className="how-num">01</div>
              <h3>Add the role &amp; resumes</h3>
              <p>
                Upload or paste the JD (PDF, DOCX, TXT, and more), confirm must-have &amp; good-to-have
                skills, then drag in up to <b>200 resumes</b> (PDF or DOCX).
              </p>
              <div className="dash" />
            </div>
            <div className="how-card">
              <div className="how-num">02</div>
              <h3>We screen &amp; score</h3>
              <p>
                Each resume is parsed and evaluated against the JD across <b>10 weighted signals</b> —
                skills, relevant experience, domain and seniority. A typical batch finishes in{" "}
                <b>~90 seconds</b>.
              </p>
              <div className="dash" />
            </div>
            <div className="how-card">
              <div className="how-num">03</div>
              <h3>Rank, select &amp; send</h3>
              <p>
                See a ranked table with strengths, skill gaps and a <b>Good-to-Call</b> call. Select
                candidates and <b>send assessments</b> to their inbox — in one click.
              </p>
              <div className="dash" />
            </div>
          </div>
        </div>
      </section>

      <section id="proof" className="block proof">
        <div className="block-inner">
          <h2>
            Recruiters spend <span className="hi">23 hours</span> screening for a single hire
          </h2>
          <p>
            HireLens cuts first-pass screening to under 90 seconds — so your team spends time on the
            candidates who actually fit.
          </p>
          <div className="proof-ctas">
            <a href="#screening-form" className="btn-solid">
              Start Screening — Free
            </a>
            <Link href="/login" className="btn-ghost">
              Sign In
            </Link>
            <a href={`mailto:${BRAND.email}`} className="btn-ghost">
              Book a Demo
            </a>
          </div>
        </div>
      </section>

      <footer className="site">
        <div className="foot-inner">
          <div>
            <div className="foot-brand">
              <DotMappersLogo height={36} className="foot-brand__logo" />
            </div>
            <p>
              HireLens is an AI candidate-screening tool by {BRAND.company}. We help TA teams screen,
              rank and advance candidates faster.
            </p>
            <p style={{ marginTop: 12 }}>
              <b style={{ color: "#fff" }}>{BRAND.phone}</b>
              <br />
              <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            </p>
          </div>
          <div>
            <h5>Product</h5>
            <a href="#how">How it works</a>
            <a href="#legend">Scoring</a>
            <a href="#screening-form">Start screening</a>
          </div>
          <div>
            <h5>Services</h5>
            <a href={`mailto:${BRAND.email}`}>TA automation</a>
            <a href={`mailto:${BRAND.email}`}>Assessment design</a>
            <a href={`mailto:${BRAND.email}`}>Implementation</a>
          </div>
          <div>
            <h5>Company</h5>
            <Link href="/login">Sign in</Link>
            <a href={`mailto:${BRAND.email}`}>Contact</a>
          </div>
        </div>
        <div className="foot-bottom">
          © {new Date().getFullYear()} {BRAND.company}. All rights reserved. ·{" "}
          <a href={`mailto:${BRAND.email}?subject=Privacy%20Policy`}>Privacy</a> ·{" "}
          <a href={`mailto:${BRAND.email}?subject=Terms%20of%20Use`}>Terms</a>
        </div>
      </footer>
    </div>
  );
}
