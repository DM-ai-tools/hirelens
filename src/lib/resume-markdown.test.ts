import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isStructuredMarkdown,
  normalizeResumeMarkdown,
  plainTextToResumeMarkdown,
} from "./resume-markdown";

describe("plainTextToResumeMarkdown", () => {
  it("formats name, sections, and bullets", () => {
    const input = `Jane Doe
jane@example.com

EXPERIENCE
• Built React dashboards at Acme Corp
• Led team of 4 engineers

SKILLS
JavaScript, TypeScript, Node.js`;

    const md = plainTextToResumeMarkdown(input);
    assert.match(md, /^# Jane Doe/);
    assert.match(md, /## Experience/);
    assert.match(md, /- Built React dashboards at Acme Corp/);
    assert.match(md, /## Skills/);
    assert.doesNotMatch(md, /\n{3,}/);
  });

  it("collapses excessive whitespace", () => {
    const input = `John Smith


WORK EXPERIENCE


   Senior Developer   `;
    const md = plainTextToResumeMarkdown(input);
    assert.ok(!md.includes("   Senior"));
    assert.match(md, /## Work Experience/);
  });

  it("strips isolated page numbers", () => {
    const input = `Alex Lee
2
EXPERIENCE
Developer at Foo`;
    const md = plainTextToResumeMarkdown(input);
    assert.doesNotMatch(md, /^2$/m);
    assert.match(md, /## Experience/);
  });
});

describe("normalizeResumeMarkdown", () => {
  it("removes duplicate blank lines", () => {
    const input = "# Name\n\n\n\n## Skills\n\n- React";
    assert.equal(normalizeResumeMarkdown(input), "# Name\n\n## Skills\n\n- React");
  });
});

describe("isStructuredMarkdown", () => {
  it("detects headings and bullet lists", () => {
    assert.equal(isStructuredMarkdown("## Experience\n- item"), true);
    assert.equal(isStructuredMarkdown("plain text only"), false);
  });
});
