import AdminAssessmentsClient from "./assessments-client";
import { buildAssessmentFileDownloadUrl, getAppBaseUrl } from "@/lib/assessment-download";
import { loadAssessmentsWithFiles } from "@/lib/assessment-queries";

export default async function AdminAssessmentsPage() {
  const assessments = await loadAssessmentsWithFiles();
  const baseUrl = getAppBaseUrl();

  return (
    <AdminAssessmentsClient
      assessments={assessments.map((a) => ({
        ...a,
        files: a.files.map((f) => ({
          ...f,
          downloadUrl: buildAssessmentFileDownloadUrl(baseUrl, a.id, f.id),
        })),
        primaryDownloadUrl: a.files[0]
          ? buildAssessmentFileDownloadUrl(baseUrl, a.id, a.files[0].id)
          : a.filePath
            ? buildAssessmentFileDownloadUrl(baseUrl, a.id)
            : null,
      }))}
    />
  );
}
