import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractLocationFromResume,
  isLikelyLocation,
  resolveCandidateLocation,
} from "./resume-location";

describe("isLikelyLocation", () => {
  it("accepts real city and region pairs", () => {
    assert.equal(isLikelyLocation("Hyderabad, India"), true);
    assert.equal(isLikelyLocation("Coimbatore, TN"), true);
    assert.equal(isLikelyLocation("San Francisco, CA"), true);
    assert.equal(isLikelyLocation("Pune, Maharashtra"), true);
  });

  it("rejects tech stack lines", () => {
    assert.equal(isLikelyLocation("Python, Hugging Face Transformers"), false);
    assert.equal(isLikelyLocation("React, TypeScript, Node.js"), false);
  });
});

describe("extractLocationFromResume", () => {
  it("reads labeled location lines", () => {
    const text = `Jane Doe
jane@example.com
Location: Bangalore, India

EXPERIENCE`;
    assert.equal(extractLocationFromResume(text), "Bangalore, India");
  });

  it("reads city and region from contact block", () => {
    const text = `John Smith
San Francisco, CA
john@email.com`;
    assert.equal(extractLocationFromResume(text), "San Francisco, CA");
  });

  it("handles markdown headings", () => {
    const text = `# Alex Lee
Based in: Hyderabad, Telangana
## Experience`;
    assert.equal(extractLocationFromResume(text), "Hyderabad, Telangana");
  });

  it("rejects skill lines in contact area", () => {
    const text = `Sohail Pathan
Python, Hugging Face Transformers
sohail@email.com`;
    assert.equal(extractLocationFromResume(text), undefined);
  });

  it("extracts location from pipe-separated contact lines", () => {
    const text = `# Siddhi Varshney
+91 8279962559| Bangalore, India | siddhi10022003@gmail.com

## Education`;
    assert.equal(extractLocationFromResume(text), "Bangalore, India");
  });

  it("extracts location before github suffix on same line", () => {
    const text = `Siddardha Raavi
Hyderabad, India § GitHub Profile
siddusiddardhraavi@gmail.com`;
    assert.equal(extractLocationFromResume(text), "Hyderabad, India");
  });

  it("extracts location from bullet contact line", () => {
    const text = `# Shubham Kharche
Software Engineer
- Pune, Maharashtra | shubhamkharche3005@gmail.com

## Summary`;
    assert.equal(extractLocationFromResume(text), "Pune, Maharashtra");
  });

  it("extracts location from title contact row", () => {
    const text = `# SOMRAJ MONDAL
Python Developer
Kolkata, India | somraj21mondal@gmail.com`;
    assert.equal(extractLocationFromResume(text), "Kolkata, India");
  });

  it("returns undefined when no location is found", () => {
    assert.equal(extractLocationFromResume("Name only\nno address"), undefined);
  });
});

describe("resolveCandidateLocation", () => {
  it("prefers valid LLM location over bad stored value", () => {
    const loc = resolveCandidateLocation({
      location: "Python, Hugging Face Transformers",
      llmRaw: { location: "Pune, Maharashtra" },
      rawText: "Name\nSkills",
    });
    assert.equal(loc, "Pune, Maharashtra");
  });

  it("reads location from experience intelligence data", () => {
    const loc = resolveCandidateLocation({
      experienceIntelligenceData: { candidateLocation: "Chennai, India" },
      rawText: "no location in text",
    });
    assert.equal(loc, "Chennai, India");
  });
});
