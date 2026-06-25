import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mergeWebEnrichmentIntoCompanies,
  tryParseJsonArray,
} from "./company-enrichment.service";import type { CompanyExperienceDetail } from "@/types";

const baseCompany = (overrides: Partial<CompanyExperienceDetail> = {}): CompanyExperienceDetail => ({
  companyName: "DotMappers",
  industry: "—",
  companyDescription: "—",
  whatCompanyDoes: "—",
  role: "Developer",
  duration: "2 years",
  companyUrl: null,
  companyDomain: null,
  keyResponsibilities: ["Built APIs"],
  projects: [],
  technologies: ["Node.js"],
  businessImpact: "",
  achievements: [],
  leadershipResponsibilities: [],
  relevantSkillsGained: [],
  valueForHiringRole: "",
  ...overrides,
});

describe("mergeWebEnrichmentIntoCompanies", () => {
  it("merges web search fields while keeping resume-specific data", () => {
    const companies = [baseCompany()];
    const merged = mergeWebEnrichmentIntoCompanies(companies, [
      {
        index: 0,
        industry: "IT Services",
        companyDescription: "Software consultancy in Bangalore.",
        whatCompanyDoes: "Custom software and GIS solutions.",
        companyUrl: "https://dotmappers.in",
        companyDomain: "dotmappers.in",
      },
    ]);

    assert.equal(merged[0].industry, "IT Services");
    assert.equal(merged[0].companyDomain, "dotmappers.in");
    assert.equal(merged[0].companyUrl, "https://dotmappers.in");
    assert.equal(merged[0].role, "Developer");
    assert.deepEqual(merged[0].keyResponsibilities, ["Built APIs"]);
  });

  it("keeps original company when no enrichment row matches index", () => {
    const companies = [baseCompany({ industry: "Retail" })];
    const merged = mergeWebEnrichmentIntoCompanies(companies, []);
    assert.equal(merged[0].industry, "Retail");
  });
});

describe("tryParseJsonArray", () => {
  it("parses a bare JSON array", () => {
    const result = tryParseJsonArray('[{"index":0,"industry":"IT"}]');
    assert.equal(result.length, 1);
  });

  it("parses JSON inside a markdown fence", () => {
    const result = tryParseJsonArray('Here is data:\n```json\n[{"index":1}]\n```');
    assert.deepEqual(result, [{ index: 1 }]);
  });

  it("returns empty array for prose-only responses", () => {
    assert.deepEqual(tryParseJsonArray("I could not find reliable data."), []);
  });
});