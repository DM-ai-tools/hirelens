import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyAgencyFromCompanyDescription,
  cleanCompanyProfileText,
  deriveExperienceRecommendation,
  detectAgencyTypeFromCompanyProfile,
  detectAgencyTypeFromText,
  extractCompanyDomain,
  finalizeExperienceIntelligenceResult,
  hasFetchedCompanyProfile,
  normalizeAgencyBadgeType,
  resolveAgencyFromEnrichedCompanies,
  sortCandidatesByExperienceIntelligenceScore,
} from "./experience-intelligence.utils";
import type { ExperienceIntelligenceResult } from "@/types";

describe("deriveExperienceRecommendation", () => {
  it("maps score bands consistently", () => {
    assert.equal(deriveExperienceRecommendation(80), "Strong hire");
    assert.equal(deriveExperienceRecommendation(60), "Good potential");
    assert.equal(deriveExperienceRecommendation(40), "Consider");
    assert.equal(deriveExperienceRecommendation(25.2), "Weak fit");
    assert.equal(deriveExperienceRecommendation(20.7), "Weak fit");
  });
});

describe("sortCandidatesByExperienceIntelligenceScore", () => {
  it("orders highest EI score first", () => {
    const sorted = sortCandidatesByExperienceIntelligenceScore([
      { id: "a", experienceIntelligenceScore: 19.1 },
      { id: "b", experienceIntelligenceScore: 25.2 },
      { id: "c", experienceIntelligenceScore: 20.7 },
    ]);
    assert.equal(sorted[0].id, "b");
    assert.equal(sorted[1].id, "c");
    assert.equal(sorted[2].id, "a");
  });
});

describe("finalizeExperienceIntelligenceResult", () => {
  it("overrides LLM recommendation with score-derived label", () => {
    const base: ExperienceIntelligenceResult = {
      score: 25.2,
      breakdown: {
        relevantRoleExperience: 30,
        businessImpact: 20,
        technicalComplexity: 25,
        leadershipOwnership: 10,
        companyRelevance: 20,
        yearsExperience: 15,
      },
      scoreRationale: "",
      currentCompany: "Dot Mappers",
      currentRole: "Intern",
      industry: "Tech",
      experienceLevel: "Junior",
      companyRating: "Unknown",
      impactRating: "Low",
      hasAgencyExperience: false,
      agencyBadgeType: null,
      overallRecommendation: "Consider",
      aiExperienceSummary: "",
      hiringValue: {
        whyValuable: "",
        experienceTransfer: "",
        businessValue: "",
        technicalStrengths: [],
        potentialRisks: [],
        interviewFocus: [],
      },
      agencyExperience: null,
      companies: [],
      previousRolesTimeline: [],
    };
    const out = finalizeExperienceIntelligenceResult(base);
    assert.equal(out.overallRecommendation, "Weak fit");
  });

  it("does not badge from employer name alone before description is fetched", () => {
    const base: ExperienceIntelligenceResult = {
      score: 50,
      breakdown: {
        relevantRoleExperience: 50,
        businessImpact: 50,
        technicalComplexity: 50,
        leadershipOwnership: 50,
        companyRelevance: 50,
        yearsExperience: 50,
      },
      scoreRationale: "",
      currentCompany: "Acme Performance Marketing Agency",
      currentRole: "Specialist",
      industry: "Marketing",
      experienceLevel: "Mid",
      companyRating: "Moderate",
      impactRating: "Medium",
      hasAgencyExperience: false,
      agencyBadgeType: null,
      overallRecommendation: "Consider",
      aiExperienceSummary: "",
      hiringValue: {
        whyValuable: "",
        experienceTransfer: "",
        businessValue: "",
        technicalStrengths: [],
        potentialRisks: [],
        interviewFocus: [],
      },
      agencyExperience: null,
      companies: [
        {
          companyName: "Acme Performance Marketing Agency",
          industry: "Marketing",
          companyDescription: "—",
          whatCompanyDoes: "—",
          role: "Specialist",
          duration: "2 years",
          keyResponsibilities: [],
          projects: [],
          technologies: [],
          businessImpact: "",
          achievements: [],
          leadershipResponsibilities: [],
          relevantSkillsGained: [],
          valueForHiringRole: "",
        },
      ],
      previousRolesTimeline: [],
    };
    const out = finalizeExperienceIntelligenceResult(base);
    assert.equal(out.agencyBadgeType, null);
    assert.equal(out.hasAgencyExperience, false);
  });

  it("badges after fetched description confirms digital marketing agency", () => {
    const out = finalizeExperienceIntelligenceResult({
      score: 50,
      breakdown: {
        relevantRoleExperience: 50,
        businessImpact: 50,
        technicalComplexity: 50,
        leadershipOwnership: 50,
        companyRelevance: 50,
        yearsExperience: 50,
      },
      scoreRationale: "",
      currentCompany: "DotMappers",
      currentRole: "Intern",
      industry: "Marketing",
      experienceLevel: "Junior",
      companyRating: "Moderate",
      impactRating: "Medium",
      hasAgencyExperience: false,
      agencyBadgeType: null,
      overallRecommendation: "Consider",
      aiExperienceSummary: "",
      hiringValue: {
        whyValuable: "",
        experienceTransfer: "",
        businessValue: "",
        technicalStrengths: [],
        potentialRisks: [],
        interviewFocus: [],
      },
      agencyExperience: null,
      companies: [
        {
          companyName: "DotMappers",
          industry: "Digital Marketing",
          companyDescription:
            "DotMappers IT Pvt Ltd is a Bangalore based Digital Advertising Agency.",
          whatCompanyDoes: "Provides SEO, PPC, and paid media services.",
          role: "Intern",
          duration: "1 year",
          keyResponsibilities: [],
          projects: [],
          technologies: [],
          businessImpact: "",
          achievements: [],
          leadershipResponsibilities: [],
          relevantSkillsGained: [],
          valueForHiringRole: "",
        },
      ],
      previousRolesTimeline: [],
    });
    assert.equal(out.agencyBadgeType, "Digital Marketing Agency");
    assert.equal(out.hasAgencyExperience, true);
  });
});

describe("agency classification from company profile", () => {
  it("requires fetched description before classifying", () => {
    assert.equal(
      detectAgencyTypeFromCompanyProfile({
        companyName: "SEO Agency Ltd",
        industry: "—",
        companyDescription: "—",
        whatCompanyDoes: "—",
        role: "Analyst",
        duration: "1y",
        keyResponsibilities: [],
        projects: [],
        technologies: [],
        businessImpact: "",
        achievements: [],
        leadershipResponsibilities: [],
        relevantSkillsGained: [],
        valueForHiringRole: "",
      }),
      null
    );
    assert.equal(hasFetchedCompanyProfile({
      companyName: "X",
      industry: "—",
      companyDescription: "Short",
      whatCompanyDoes: "—",
      role: "R",
      duration: "1y",
      keyResponsibilities: [],
      projects: [],
      technologies: [],
      businessImpact: "",
      achievements: [],
      leadershipResponsibilities: [],
      relevantSkillsGained: [],
      valueForHiringRole: "",
    }), false);
  });

  it("maps known agency labels from description text", () => {
    assert.equal(
      classifyAgencyFromCompanyDescription("A full-service performance marketing agency serving B2B clients."),
      "Performance Marketing Agency"
    );
    assert.equal(detectAgencyTypeFromText("Worked at a SEO Agency"), "SEO Agency");
    assert.equal(normalizeAgencyBadgeType("performance marketing agency"), "Performance Marketing Agency");
    const match = resolveAgencyFromEnrichedCompanies([
      {
        companyName: "Growth Co",
        industry: "Marketing",
        companyDescription: "—",
        whatCompanyDoes: "A growth marketing agency focused on paid acquisition.",
        role: "Analyst",
        duration: "1y",
        keyResponsibilities: [],
        projects: [],
        technologies: [],
        businessImpact: "",
        achievements: [],
        leadershipResponsibilities: [],
        relevantSkillsGained: [],
        valueForHiringRole: "",
      },
    ]);
    assert.equal(match?.badgeType, "Growth Marketing Agency");
  });
});

describe("extractCompanyDomain", () => {
  it("parses domain from URL", () => {
    assert.equal(extractCompanyDomain("https://www.dotmappers.in/about"), "dotmappers.in");
  });
});

describe("cleanCompanyProfileText", () => {
  it("strips web search cite tags from employer descriptions", () => {
    const raw =
      '<cite index="1-1">DotMappers IT Pvt Ltd is a Bangalore based Digital Advertising Agency, with its headquarters located in Melbourne, Australia.</cite>';
    const cleaned = cleanCompanyProfileText(raw);
    assert.equal(
      cleaned,
      "DotMappers IT Pvt Ltd is a Bangalore based Digital Advertising Agency, with its headquarters located in Melbourne, Australia."
    );
  });

  it("cleans cite tags and confirms agency badge from description", () => {
    const out = finalizeExperienceIntelligenceResult({
      score: 50,
      breakdown: {
        relevantRoleExperience: 50,
        businessImpact: 50,
        technicalComplexity: 50,
        leadershipOwnership: 50,
        companyRelevance: 50,
        yearsExperience: 50,
      },
      scoreRationale: "",
      currentCompany: "DotMappers",
      currentRole: "Intern",
      industry: "Marketing",
      experienceLevel: "Junior",
      companyRating: "Moderate",
      impactRating: "Medium",
      hasAgencyExperience: false,
      agencyBadgeType: null,
      overallRecommendation: "Consider",
      aiExperienceSummary: "",
      hiringValue: {
        whyValuable: "",
        experienceTransfer: "",
        businessValue: "",
        technicalStrengths: [],
        potentialRisks: [],
        interviewFocus: [],
      },
      agencyExperience: null,
      companies: [
        {
          companyName: "DotMappers",
          industry: "Marketing",
          companyDescription:
            '<cite index="1-1">DotMappers IT Pvt Ltd is a Bangalore based Digital Advertising Agency.</cite>',
          whatCompanyDoes:
            '<cite index="2-4">The company specializes in SEO, PPC, and web development.</cite>',
          role: "Intern",
          duration: "1 year",
          keyResponsibilities: [],
          projects: [],
          technologies: [],
          businessImpact: "",
          achievements: [],
          leadershipResponsibilities: [],
          relevantSkillsGained: [],
          valueForHiringRole: "",
        },
      ],
      previousRolesTimeline: [],
    });
    assert.equal(
      out.companies[0].companyDescription,
      "DotMappers IT Pvt Ltd is a Bangalore based Digital Advertising Agency."
    );
    assert.equal(out.companies[0].whatCompanyDoes, "The company specializes in SEO, PPC, and web development.");
    assert.equal(out.agencyBadgeType, "Digital Marketing Agency");
  });
});
