"use client";

import { AdminAppLayout } from "@/features/admin/components/layout/admin-app-layout";
import type { NotificationItem } from "@/features/admin/types";

export function AdminShell({
  children,
  user,
  storageUsedPct,
  apiUsagePct,
  currentPlan,
  appVersion,
  notifications,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  storageUsedPct: number;
  apiUsagePct: number;
  currentPlan: string;
  appVersion: string;
  notifications: NotificationItem[];
}) {
  return (
    <AdminAppLayout
      user={user}
      storageUsedPct={storageUsedPct}
      apiUsagePct={apiUsagePct}
      currentPlan={currentPlan}
      appVersion={appVersion}
      notifications={notifications}
    >
      {children}
    </AdminAppLayout>
  );
}
