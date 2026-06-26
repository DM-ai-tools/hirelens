import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assessmentMatchesJob, filterAssessmentsForJob, stringsLooselyMatch } from "./assessment-match";

describe("stringsLooselyMatch", () => {
  it("matches exact and substring pairs", () => {
    assert.equal(stringsLooselyMatch("Full Stack", "Full Stack Developer"), true);
    assert.equal(stringsLooselyMatch("Shopify Developer", "Shopify"), true);
  });

  it("matches despite minor title typos", () => {
    assert.equal(stringsLooselyMatch("Full Stack", "Full Stak Developer"), true);
    assert.equal(stringsLooselyMatch("Full Stack Developer", "Full Stak Developer"), true);
  });

  it("does not match unrelated roles", () => {
    assert.equal(stringsLooselyMatch("Shopify", "Full Stack Developer"), false);
    assert.equal(stringsLooselyMatch("React", "Full Stak Developer"), false);
  });
});

describe("assessmentMatchesJob", () => {
  const job = {
    title: "Full Stak Developer",
    department: null,
    roleTag: null,
  };

  it("includes assessments without a role tag", () => {
    assert.equal(assessmentMatchesJob({ roleTag: null }, job), true);
    assert.equal(assessmentMatchesJob({ roleTag: "  " }, job), true);
  });

  it("matches assessment role tag to job title", () => {
    assert.equal(assessmentMatchesJob({ roleTag: "Full Stack" }, job), true);
    assert.equal(assessmentMatchesJob({ roleTag: "Full Stack Developer" }, job), true);
  });

  it("matches assessment role tag to saved job role tag", () => {
    assert.equal(
      assessmentMatchesJob(
        { roleTag: "Full Stack" },
        { ...job, roleTag: "Full Stack", title: "Developer" }
      ),
      true
    );
  });

  it("rejects unrelated assessment tags", () => {
    assert.equal(assessmentMatchesJob({ roleTag: "Shopify" }, job), false);
  });
});

describe("filterAssessmentsForJob", () => {
  it("returns active matching assessments only", () => {
    const assessments = [
      { id: "1", roleTag: "Full Stack", active: true },
      { id: "2", roleTag: "Shopify", active: true },
      { id: "3", roleTag: null, active: true },
      { id: "4", roleTag: "Full Stack", active: false },
    ];

    const matched = filterAssessmentsForJob(assessments, {
      title: "Full Stak Developer",
      department: null,
      roleTag: null,
    });

    assert.deepEqual(
      matched.map((a) => a.id).sort(),
      ["1", "3"]
    );
  });
});
