import { auth } from "@/lib/auth";
import { fetchDashboardStats } from "@/features/admin/lib/fetch-dashboard";
import { AdminDashboardPageClient } from "@/features/admin/components/dashboard/admin-dashboard-page-client";

export default async function AdminDashboardPage() {
  const session = await auth();
  const stats = await fetchDashboardStats(session?.user?.name ?? "Admin");
  return <AdminDashboardPageClient stats={stats} />;
}
