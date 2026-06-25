import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { DotMappersLogo } from "@/components/brand/dotmappers-logo";
import { LandingNavAuth } from "@/components/auth/landing-nav-auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function BrandLogo({
  subtitle = "AI CANDIDATE SCREENING",
  href = "/",
}: {
  subtitle?: string;
  href?: string;
}) {
  return (
    <Link href={href} className="brand">
      <DotMappersLogo height={38} priority />
      <div className="divider" />
      <div className="product">
        Hire<em>Lens</em>
        <small>{subtitle}</small>
      </div>
    </Link>
  );
}

export function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-inner">
        <span>Bangalore &amp; Melbourne · Talent Acquisition automation by DOTMappers</span>
        <span>
          <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
          <a href={`tel:${BRAND.phone.replace(/-/g, "")}`}>{BRAND.phone}</a>
        </span>
      </div>
    </div>
  );
}

export function SiteNav() {
  return (
    <nav>
      <div className="nav-inner">
        <BrandLogo />
        <div className="nav-links">
          <a href="#how">Overview</a>
          <a href="#how">How it works</a>
          <a href="#legend">Scoring</a>
          <a href="#proof">Pricing</a>
        </div>
        <div className="nav-right">
          <ThemeToggle variant="nav" />
          <div className="nav-phone">
            <span className="ring">☏</span>
            {BRAND.phone}
          </div>
          <LandingNavAuth />
          <a href="#screening-form" className="btn-cta">
            Start Screening ↗
          </a>
        </div>
      </div>
    </nav>
  );
}

export function CompactNav({
  subtitle,
  right,
}: {
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <nav>
      <div className="nav-inner">
        <BrandLogo subtitle={subtitle} />
        {right}
      </div>
    </nav>
  );
}
