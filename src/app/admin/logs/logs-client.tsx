"use client";

import { AdminPageHeader } from "@/features/admin/components/shared/admin-page-header";
import { GlassCard } from "@/features/admin/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import type { AuditLogRow } from "@/features/admin/lib/fetch-audit";

const levelStyle = {
  info: "bg-[#F6F8FB] text-[#0B1E3B]",
  success: "bg-[#E8F8EF] text-[#1E9E5A]",
  error: "bg-[#FBE9EA] text-[#C8202A]",
};

export function LogsClient({ logs }: { logs: AuditLogRow[] }) {
  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      <AdminPageHeader
        title="System Logs"
        description="Complete audit trail of platform activity, AI processing, and security events."
      />
      <GlassCard>
        {logs.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No activity logged yet.</p>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-[#E5E9F0] dark:bg-white/10" />
            {logs.map((log) => (
              <div key={log.id} className="relative flex gap-4 py-4">
                <div className="z-10 mt-1 h-3 w-3 shrink-0 rounded-full bg-[#C8202A] ring-4 ring-white dark:ring-[#0B1E3B]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#0B1E3B] dark:text-white">{log.message}</p>
                    <Badge className={levelStyle[log.level]}>{log.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {log.user} · {log.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
