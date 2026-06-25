import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { fetchPlatformMetrics } from "@/features/admin/lib/fetch-platform-metrics";
import { fetchRecentNotifications } from "@/features/admin/lib/fetch-audit";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [metrics, notifications] = await Promise.all([
    fetchPlatformMetrics(),
    fetchRecentNotifications(8),
  ]);

  return (
    <AdminShell
      user={{
        name: session.user.name ?? "Admin",
        email: session.user.email ?? "",
      }}
      storageUsedPct={metrics.storageUsedPct}
      apiUsagePct={metrics.apiUsagePct}
      currentPlan={metrics.currentPlan}
      appVersion={metrics.appVersion}
      notifications={notifications}
    >
      {children}
    </AdminShell>
  );
}
