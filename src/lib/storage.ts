import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { REPORT_DIR } from "./constants";

function resolveUploadDir() {
  const configured = process.env.UPLOAD_DIR || "./uploads";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

const UPLOAD_ROOT = resolveUploadDir();

export async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

export async function saveUpload(
  file: File,
  subdir: string
): Promise<{ filePath: string; fileName: string }> {
  const dir = path.join(UPLOAD_ROOT, subdir);
  await ensureDir(dir);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const filePath = path.join(dir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  return { filePath, fileName: safeName };
}

export async function saveBuffer(
  buffer: Buffer,
  subdir: string,
  fileName: string
): Promise<string> {
  const dir = path.join(REPORT_DIR, subdir);
  await ensureDir(dir);
  const filePath = path.join(dir, fileName);
  await writeFile(filePath, buffer);
  return filePath;
}

export async function readUploadFile(filePath: string): Promise<Buffer> {
  return readFile(filePath);
}

export function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
  };
  return map[ext] || "application/octet-stream";
}
