import { fetchPlatformMetrics } from "@/features/admin/lib/fetch-platform-metrics";
import { BillingClient } from "./billing-client";

export default async function AdminBillingPage() {
  const metrics = await fetchPlatformMetrics();
  return <BillingClient metrics={metrics} />;
}
