import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readAssessmentFileContent } from "./assessment-file-content";

describe("readAssessmentFileContent", () => {
  it("returns database bytes when present", async () => {
    const content = await readAssessmentFileContent({
      filePath: "/missing/on/disk.pdf",
      fileData: Buffer.from("pdf-bytes"),
    });
    assert.equal(content.toString(), "pdf-bytes");
  });
});
