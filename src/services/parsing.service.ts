import { readFile } from "fs/promises";
import path from "path";
import type { ParsedResume } from "@/types";

/** Extract plain text from a job description or resume document. */
export async function parseDocumentToText(
  filePath: string,
  fileName: string
): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".pdf") {
    let rawText = await parsePdf(filePath);
    if (rawText.trim().length < 100) {
      rawText = await parsePdfOcr(filePath);
    }
    return rawText.trim();
  }

  if (ext === ".docx" || ext === ".doc" || ext === ".odt") {
    return (await parseDocx(filePath)).trim();
  }

  if (ext === ".txt" || ext === ".md" || ext === ".rtf" || ext === ".html" || ext === ".htm") {
    const buffer = await readFile(filePath);
    return buffer.toString("utf-8").trim();
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export async function parseJobDescriptionFile(
  filePath: string,
  fileName: string
): Promise<string> {
  const text = await parseDocumentToText(filePath, fileName);
  if (text.length < 30) {
    throw new Error(
      "Could not extract enough text from the job description file. Try pasting the JD or use PDF/DOCX."
    );
  }
  return text;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4,6}/g;

export async function parseResumeFile(
  filePath: string,
  fileName: string
): Promise<ParsedResume> {
  const ext = path.extname(fileName).toLowerCase();
  let rawText = "";

  if (ext === ".pdf") {
    rawText = await parsePdf(filePath);
    if (rawText.trim().length < 100) {
      rawText = await parsePdfOcr(filePath);
    }
  } else if (ext === ".docx" || ext === ".doc" || ext === ".odt") {
    rawText = await parseDocx(filePath);
  } else if (ext === ".txt" || ext === ".md" || ext === ".rtf") {
    const buffer = await readFile(filePath);
    rawText = buffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  return extractFields(rawText);
}

async function parsePdf(filePath: string): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const buffer = await readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text || "";
}

async function parsePdfOcr(filePath: string): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const buffer = await readFile(filePath);
    const { data } = await worker.recognize(buffer);
    await worker.terminate();
    return data.text || "";
  } catch {
    return "";
  }
}

async function parseDocx(filePath: string): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

function extractFields(rawText: string): ParsedResume {
  const emails = rawText.match(EMAIL_REGEX) || [];
  const phones = rawText.match(PHONE_REGEX) || [];
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const name = lines[0]?.length < 60 ? lines[0] : undefined;

  return {
    name,
    email: emails[0],
    phone: phones[0],
    skills: extractSkillsFromResume(rawText),
    experience: extractExperience(rawText),
    education: extractEducation(rawText),
    projects: extractProjects(rawText),
    rawText,
  };
}

function extractSkillsFromResume(text: string): string[] {
  const skills = [
    "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java", "C++",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "REST", "GraphQL",
    "PostgreSQL", "MongoDB", "Redis", "Kafka", "Next.js", "Vue", "Angular",
    "SQL", "NoSQL", "Git", "Agile", "Scrum", "TensorFlow", "PyTorch",
    "HTML", "CSS", "Tailwind", "Spring", "Django", "Flask", "FastAPI",
    "Microservices", "Terraform", "Jenkins", "Linux", "Go", "Rust", "Swift",
  ];
  const lower = text.toLowerCase();
  return [...new Set(skills.filter((s) => lower.includes(s.toLowerCase())))];
}

function extractExperience(text: string): ParsedResume["experience"] {
  const experience: ParsedResume["experience"] = [];
  const patterns = [
    /(?:at|@)\s+([A-Z][A-Za-z0-9\s&.,]+?)(?:\s*[-–|]\s*|\s+)([A-Za-z\s]+?)(?:\s*[-–|]\s*|\s+)(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      experience.push({
        company: match[1].trim(),
        role: match[2].trim(),
        years: match[4].toLowerCase().includes("present")
          ? new Date().getFullYear() - parseInt(match[3])
          : parseInt(match[4]) - parseInt(match[3]),
      });
    }
  }
  return experience.slice(0, 10);
}

function extractEducation(text: string): ParsedResume["education"] {
  const education: ParsedResume["education"] = [];
  const degreePattern = /(B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc|MBA|Ph\.?D|Bachelor|Master)[^.\n]*(?:from|at|,)\s*([A-Z][A-Za-z\s&]+)/gi;
  let match;
  while ((match = degreePattern.exec(text)) !== null) {
    education.push({ degree: match[1].trim(), institution: match[2].trim() });
  }
  return education.slice(0, 5);
}

function extractProjects(text: string): string[] {
  const projects: string[] = [];
  const projectSection = text.match(/projects?:?\s*([\s\S]*?)(?:education|experience|skills|$)/i);
  if (projectSection) {
    const lines = projectSection[1].split("\n").filter((l) => l.trim().length > 10);
    projects.push(...lines.slice(0, 5).map((l) => l.trim()));
  }
  return projects;
}

import { extractJobRequirementsFromJd } from "./ai.service";

export async function parseJobDescription(
  text: string,
  title?: string,
  userMinExperience?: number
) {
  return extractJobRequirementsFromJd(text, title, userMinExperience);
}
