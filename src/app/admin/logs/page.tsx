import { fetchAuditLogs } from "@/features/admin/lib/fetch-audit";
import { LogsClient } from "./logs-client";

export default async function AdminLogsPage() {
  const logs = await fetchAuditLogs(50);
  return <LogsClient logs={logs} />;
}
