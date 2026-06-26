import JobDescriptionsClient from "./job-descriptions-client";
import { loadJobDescriptions } from "@/lib/job-description-queries";

export default async function AdminJobDescriptionsPage() {
  const jobDescriptions = await loadJobDescriptions();
  return <JobDescriptionsClient jobDescriptions={jobDescriptions} />;
}
