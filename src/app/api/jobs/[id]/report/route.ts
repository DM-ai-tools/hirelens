import { auth } from "@/lib/auth";
import { handleApiError, AppError } from "@/lib/api-error";
import { generatePdfReport, generateExcelReport } from "@/services/report.service";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new AppError("Unauthorized", 401);

    const { id } = await params;
    const { format } = await request.json();

    const filePath =
      format === "xlsx"
        ? await generateExcelReport(id)
        : await generatePdfReport(id);

    const buffer = await readFile(filePath);
    const fileName = path.basename(filePath);
    const contentType =
      format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
