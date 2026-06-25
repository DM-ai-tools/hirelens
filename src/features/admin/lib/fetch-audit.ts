import { prisma } from "@/lib/prisma";
import { formatDateTimeUTC } from "@/lib/format-date";
import type { NotificationItem } from "@/features/admin/types";

export type AuditLogRow = {
  id: string;
  type: string;
  message: string;
  user: string;
  time: string;
  level: "info" | "success" | "error";
};

function inferLevel(action: string): AuditLogRow["level"] {
  const a = action.toLowerCase();
  if (a.includes("fail") || a.includes("error")) return "error";
  if (a.includes("complete") || a.includes("created") || a.includes("generated")) return "success";
  return "info";
}

function inferNotificationType(action: string): NotificationItem["type"] {
  const a = action.toLowerCase();
  if (a.includes("fail") || a.includes("error")) return "error";
  if (a.includes("warn") || a.includes("bounce")) return "warning";
  if (a.includes("complete") || a.includes("generated") || a.includes("created")) return "success";
  return "info";
}

function inferLogType(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("resume") || a.includes("upload")) return "resume";
  if (a.includes("screen") || a.includes("evaluat") || a.includes("claude")) return "ai";
  if (a.includes("email") || a.includes("assessment")) return "email";
  if (a.includes("report") || a.includes("pdf")) return "pdf";
  if (a.includes("login")) return "login";
  if (a.includes("setting")) return "settings";
  if (a.includes("recruiter") || a.includes("user")) return "recruiter";
  if (a.includes("fail") || a.includes("error")) return "error";
  return "info";
}

export async function fetchAuditLogs(limit = 50): Promise<AuditLogRow[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });

  return logs.map((log) => ({
    id: log.id,
    type: inferLogType(log.action),
    message: log.entity ? `${log.action} — ${log.entity}` : log.action,
    user: log.user?.name ?? "System",
    time: formatDateTimeUTC(log.createdAt),
    level: inferLevel(log.action),
  }));
}

export async function fetchRecentNotifications(limit = 8): Promise<NotificationItem[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });

  return logs.map((log) => ({
    id: log.id,
    type: inferNotificationType(log.action),
    title: log.action,
    message: log.entity
      ? `${log.entity}${log.user?.name ? ` by ${log.user.name}` : ""}`
      : log.user?.name
        ? `Activity by ${log.user.name}`
        : "Platform activity",
    time: formatDateTimeUTC(log.createdAt),
    read: false,
  }));
}
