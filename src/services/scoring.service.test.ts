import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GoodToCall } from "@prisma/client";
import { computeGoodToCall, resolveCandidateVerdict } from "./scoring.service";
import { getMustHaveStats } from "@/lib/constants";

const THRESHOLD = 70;

describe("computeGoodToCall (TDD)", () => {
  it("YES when score >= 70 and missing must-haves === 0", () => {
    assert.equal(computeGoodToCall(70, 0, THRESHOLD), GoodToCall.YES);
    assert.equal(computeGoodToCall(85, 0, THRESHOLD), GoodToCall.YES);
  });

  it("MAYBE when score is 55–69 and all must-haves matched", () => {
    assert.equal(computeGoodToCall(55, 0, THRESHOLD), GoodToCall.MAYBE);
    assert.equal(computeGoodToCall(69, 0, THRESHOLD), GoodToCall.MAYBE);
    assert.equal(computeGoodToCall(65, 0, THRESHOLD), GoodToCall.MAYBE);
  });

  it("MAYBE when exactly one must-have is missing (even if score >= 70)", () => {
    assert.equal(computeGoodToCall(75, 1, THRESHOLD), GoodToCall.MAYBE);
    assert.equal(computeGoodToCall(70, 1, THRESHOLD), GoodToCall.MAYBE);
  });

  it("NO when score < 55", () => {
    assert.equal(computeGoodToCall(54, 0, THRESHOLD), GoodToCall.NO);
    assert.equal(computeGoodToCall(40, 1, THRESHOLD), GoodToCall.NO);
  });

  it("NO when more than one must-have is missing", () => {
    assert.equal(computeGoodToCall(80, 2, THRESHOLD), GoodToCall.NO);
    assert.equal(computeGoodToCall(60, 2, THRESHOLD), GoodToCall.NO);
  });
});

describe("getMustHaveStats", () => {
  it("computes matched and missing from requirement rows", () => {
    const stats = getMustHaveStats(
      ["SQL", "React", "Python or Django"],
      ["SQL", "React"]
    );
    assert.equal(stats.totalMustHave, 3);
    assert.equal(stats.matchedMustHave, 2);
    assert.equal(stats.missingMustHave, 1);
  });
});

describe("resolveCandidateVerdict", () => {
  it("derives badge from score and must-have stats only", () => {
    const { stats, goodToCall } = resolveCandidateVerdict(73, ["A", "B"], THRESHOLD, {
      llmRaw: { matched_must_have: ["A", "B"] },
      hasIdentity: true,
    });
    assert.equal(stats.matchedMustHave, 2);
    assert.equal(stats.missingMustHave, 0);
    assert.equal(goodToCall, GoodToCall.YES);
  });
});
