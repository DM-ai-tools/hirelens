"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronRight } from "lucide-react";
import { useState } from "react";
import { GlobalSearch } from "@/components/search/global-search";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminSidebar } from "./admin-sidebar";
import { NotificationCenter } from "../notifications/notification-center";

import type { NotificationItem } from "@/features/admin/types";

const breadcrumbLabels: Record<string, string> = {
  admin: "Dashboard",
  recruiters: "Recruiters",
  jobs: "Jobs",
  candidates: "Candidates",
  assessments: "Assessments",
  reports: "Reports",
  analytics: "AI Analytics",
  templates: "Email Templates",
  settings: "Company Settings",
  logs: "System Logs",
  billing: "Billing",
  profile: "Profile",
};

export function AdminAppLayout({
  children,
  user,
  storageUsedPct = 0,
  apiUsagePct = 0,
  currentPlan = "Starter",
  appVersion = "0.1.0",
  notifications = [],
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  storageUsedPct?: number;
  apiUsagePct?: number;
  currentPlan?: string;
  appVersion?: string;
  notifications?: NotificationItem[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: breadcrumbLabels[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#F6F8FB] dark:bg-[#050d1a]">
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onLogout={() => signOut({ callbackUrl: "/login" })}
        storageUsedPct={storageUsedPct}
        apiUsagePct={apiUsagePct}
        currentPlan={currentPlan}
        appVersion={appVersion}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#E5E9F0]/80 bg-white/90 px-6 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1E3B]/90">
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-1">
                {c.href !== crumbs[0].href && <ChevronRight className="h-3.5 w-3.5" />}
                {c.last ? (
                  <span className="font-semibold text-[#0B1E3B] dark:text-white">{c.label}</span>
                ) : (
                  <Link href={c.href} className="hover:text-[#C8202A]">
                    {c.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          <div className="flex flex-1 justify-end gap-2 md:max-w-xl md:justify-center">
            <GlobalSearch />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {notifications.some((n) => !n.read) && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C8202A] ring-2 ring-white dark:ring-[#0B1E3B]" />
            )}
          </Button>
          <ThemeToggle variant="icon" />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-transparent p-1 transition-colors hover:border-[#E5E9F0] hover:bg-muted/50 dark:hover:border-white/10"
                >
                  <Avatar className="h-9 w-9 border-2 border-[#C8202A]/25">
                    <AvatarFallback className="bg-gradient-to-br from-[#0B1E3B] to-[#16294a] text-xs font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-semibold leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>
                <Link href="/admin/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/admin/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/admin/billing">Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>

      <NotificationCenter
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
      />
    </div>
  );
}
