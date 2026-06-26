import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  createAssessmentDownloadToken,
  verifyAssessmentDownloadToken,
} from "./assessment-download-token";

describe("assessment download tokens", () => {
  const previous = process.env.AUTH_SECRET;

  before(() => {
    process.env.AUTH_SECRET = "test-secret";
  });

  after(() => {
    if (previous === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = previous;
  });

  it("creates and verifies a legacy file token", () => {
    const token = createAssessmentDownloadToken("assessment-1");
    assert.equal(verifyAssessmentDownloadToken(token, "assessment-1"), true);
    assert.equal(verifyAssessmentDownloadToken(token, "assessment-2"), false);
  });

  it("creates and verifies a specific file token", () => {
    const token = createAssessmentDownloadToken("assessment-1", "file-9");
    assert.equal(verifyAssessmentDownloadToken(token, "assessment-1", "file-9"), true);
    assert.equal(verifyAssessmentDownloadToken(token, "assessment-1", "file-8"), false);
  });
});
