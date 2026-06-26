import { readUploadFile } from "@/lib/storage";

type AssessmentFileContentSource = {
  filePath: string;
  fileData?: Buffer | Uint8Array | null;
};

/** Prefer database bytes (survives ephemeral containers); fall back to disk. */
export async function readAssessmentFileContent(
  file: AssessmentFileContentSource
): Promise<Buffer> {
  if (file.fileData && file.fileData.length > 0) {
    return Buffer.from(file.fileData);
  }
  return readUploadFile(file.filePath);
}
