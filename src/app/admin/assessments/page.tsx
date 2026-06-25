import AdminAssessmentsClient from "./assessments-client";
import { loadAssessmentsWithFiles } from "@/lib/assessment-queries";

export default async function AdminAssessmentsPage() {
  const assessments = await loadAssessmentsWithFiles();
  return <AdminAssessmentsClient assessments={assessments} />;
}
