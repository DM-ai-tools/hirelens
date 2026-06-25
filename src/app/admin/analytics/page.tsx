import { fetchAnalyticsData } from "@/features/admin/lib/fetch-analytics";
import { AnalyticsClient } from "./analytics-client";

export default async function AdminAnalyticsPage() {
  const data = await fetchAnalyticsData();
  return <AnalyticsClient data={data} />;
}
