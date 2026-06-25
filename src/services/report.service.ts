import ExcelJS from "exceljs";
import puppeteer from "puppeteer";
import { CandidateStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { saveBuffer } from "@/lib/storage";
import { ReportFormat } from "@prisma/client";
import path from "path";
import { getModelDisplayName, formatMinExperience } from "@/lib/constants";

function evaluatedCandidates<T extends { status: CandidateStatus }>(candidates: T[]) {
  return candidates.filter((c) => c.status === CandidateStatus.EVALUATED);
}

export async function generateExcelReport(jobId: string): Promise<string> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      candidates: { orderBy: { rank: "asc" } },
      reports: true,
    },
  });
  if (!job) throw new Error("Job not found");

  const candidates = evaluatedCandidates(job.candidates);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HireLens";
  const sheet = workbook.addWorksheet("Candidate Rankings");

  sheet.columns = [
    { header: "Rank", key: "rank", width: 8 },
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Overall Exp", key: "overallExp", width: 12 },
    { header: "Relevant Exp", key: "relevantExp", width: 12 },
    { header: "Score", key: "score", width: 10 },
    { header: "Good to Call", key: "goodToCall", width: 14 },
    { header: "Strengths", key: "strengths", width: 40 },
    { header: "Missing Skills", key: "missingSkills", width: 40 },
    { header: "AI Rationale", key: "aiRationale", width: 50 },
    { header: "Selected", key: "selected", width: 10 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0B1E3B" },
  };

  for (const c of candidates) {
    sheet.addRow({
      rank: c.rank,
      name: c.name,
      email: c.email,
      phone: c.phone,
      overallExp: c.overallExperience,
      relevantExp: c.relevantExperience,
      score: c.score,
      goodToCall: c.goodToCall,
      strengths: c.strengths.join(", "),
      missingSkills: c.missingSkills.join(", "),
      aiRationale: c.aiRationale || "",
      selected: c.selected ? "Yes" : "No",
    });
  }

  const summary = workbook.addWorksheet("Summary");
  summary.addRow(["Job Title", job.title]);
  summary.addRow(["Model", getModelDisplayName()]);
  summary.addRow(["Score Threshold", job.scoreThreshold]);
  summary.addRow(["Min Experience", formatMinExperience(job.minExperience)]);
  summary.addRow(["Total Candidates", candidates.length]);
  summary.addRow([
    "Good to Call",
    candidates.filter((c) => c.goodToCall === "YES").length,
  ]);
  summary.addRow([
    "Average Score",
    (
      candidates.reduce((s, c) => s + (c.score ?? 0), 0) /
      Math.max(candidates.length, 1)
    ).toFixed(1),
  ]);

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const fileName = `report-${jobId}-${Date.now()}.xlsx`;
  const filePath = await saveBuffer(buffer, "excel", fileName);

  await prisma.report.create({
    data: { jobId, filePath, format: ReportFormat.XLSX },
  });

  return filePath;
}

export async function generatePdfReport(jobId: string): Promise<string> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      candidates: { orderBy: { rank: "asc" } },
    },
  });
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  if (!job) throw new Error("Job not found");

  const candidates = evaluatedCandidates(job.candidates);

  const sends = await prisma.assessmentSend.findMany({
    where: { candidate: { jobId } },
    include: { assessment: true, candidate: true },
  });

  const avgScore =
    candidates.reduce((s, c) => s + (c.score ?? 0), 0) /
    Math.max(candidates.length, 1);
  const goodCount = candidates.filter((c) => c.goodToCall === "YES").length;
  const maybeCount = candidates.filter((c) => c.goodToCall === "MAYBE").length;
  const noCount = candidates.filter((c) => c.goodToCall === "NO").length;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Poppins, sans-serif; color: #3A4858; padding: 40px; }
    .header { border-bottom: 3px solid #C8202A; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #0B1E3B; font-size: 28px; }
    .header p { color: #7A8798; margin-top: 8px; }
    .kpis { display: flex; gap: 16px; margin-bottom: 30px; }
    .kpi { flex: 1; background: #F6F8FB; border-radius: 12px; padding: 20px; text-align: center; }
    .kpi b { display: block; font-size: 32px; color: #0B1E3B; }
    .kpi small { color: #7A8798; font-size: 12px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
    th { background: #0B1E3B; color: white; padding: 10px 8px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #E5E9F0; }
    tr:nth-child(even) { background: #F6F8FB; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .yes { background: #E8F8EF; color: #1E9E5A; }
    .maybe { background: #FFF8E6; color: #B06E0A; }
    .no { background: #FDECEC; color: #E24B4A; }
    .footer { margin-top: 40px; text-align: center; color: #7A8798; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${job.title} — Screening Report</h1>
    <p>${settings?.companyName || "DOTMappers"} · ${getModelDisplayName()} · Generated ${new Date().toLocaleDateString()}</p>
    <p style="margin-top:6px;color:#7A8798">Threshold ≥ ${job.scoreThreshold} · Min experience ${formatMinExperience(job.minExperience)}</p>
  </div>
  <div class="kpis">
    <div class="kpi"><b>${candidates.length}</b><small>Evaluated</small></div>
    <div class="kpi"><b>${goodCount}</b><small>Good to Call</small></div>
    <div class="kpi"><b>${maybeCount}</b><small>Maybe</small></div>
    <div class="kpi"><b>${avgScore.toFixed(0)}%</b><small>Avg Score</small></div>
  </div>
  <h2 style="color:#0B1E3B;margin-bottom:12px;">Ranked Candidates</h2>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Name</th><th>Email</th><th>Score</th><th>Rank</th><th>Good to Call</th><th>Strengths</th><th>AI Rationale</th>
      </tr>
    </thead>
    <tbody>
      ${candidates
        .map(
          (c) => `<tr>
        <td>${c.rank ?? "-"}</td>
        <td>${c.name || "-"}</td>
        <td>${c.email || "-"}</td>
        <td><b>${c.score ?? "-"}</b></td>
        <td>${c.rank ?? "-"}</td>
        <td><span class="badge ${c.goodToCall === "YES" ? "yes" : c.goodToCall === "MAYBE" ? "maybe" : "no"}">${c.goodToCall || "-"}</span></td>
        <td>${c.strengths.slice(0, 3).join(", ")}</td>
        <td>${(c.aiRationale || "-").slice(0, 120)}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>
  ${
    sends.length > 0
      ? `<h2 style="color:#0B1E3B;margin:30px 0 12px;">Assessment Emails</h2>
  <table>
    <thead><tr><th>Candidate</th><th>Assessment</th><th>Status</th><th>Sent</th></tr></thead>
    <tbody>${sends
      .map(
        (s) => `<tr>
      <td>${s.candidate.name}</td>
      <td>${s.assessment.name}</td>
      <td>${s.status}</td>
      <td>${s.sentAt ? new Date(s.sentAt).toLocaleString() : "-"}</td>
    </tr>`
      )
      .join("")}</tbody>
  </table>`
      : ""
  }
  <div class="footer">Generated by HireLens · ${settings?.companyName}</div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
  });
  await browser.close();

  const fileName = `report-${jobId}-${Date.now()}.pdf`;
  const filePath = await saveBuffer(Buffer.from(pdfBuffer), "pdf", fileName);

  await prisma.report.create({
    data: { jobId, filePath, format: ReportFormat.PDF },
  });

  return filePath;
}

export function getReportFileName(filePath: string) {
  return path.basename(filePath);
}
