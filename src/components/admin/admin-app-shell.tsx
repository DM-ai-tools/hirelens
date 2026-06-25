"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  ClipboardList,
  Mail,
  FileBarChart,
  Settings,
  User,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useState } from "react";
import { GlobalSearch } from "@/components/search/global-search";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Recruiters", href: "/admin/recruiters", icon: Users },
  { title: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { title: "Candidates", href: "/admin/candidates", icon: UserCheck },
  { title: "Assessments", href: "/admin/assessments", icon: ClipboardList },
  { title: "Email Templates", href: "/admin/templates", icon: Mail },
  { title: "Reports", href: "/admin/reports", icon: FileBarChart },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "Profile", href: "/admin/profile", icon: User },
];

export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "AD";

  return (
    <div className="flex min-h-screen bg-[#F6F8FB] dark:bg-[#050d1a]">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-white/10 bg-[#0B1E3B] text-white transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C8202A] text-sm font-bold">
            HL
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">
                Hire<span className="text-[#ff8a8f]">Lens</span>
              </div>
              <div className="text-[10px] font-semibold tracking-widest text-white/50">ADMIN PANEL</div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#C8202A] text-white shadow-lg shadow-[#C8202A]/25"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white",
              collapsed && "justify-center"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#E5E9F0] bg-white/95 px-6 backdrop-blur dark:border-white/10 dark:bg-[#0B1E3B]/95">
          <div className="flex-1 max-w-xl">
            <GlobalSearch />
          </div>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C8202A]" />
          </Button>
          <ThemeToggle variant="icon" />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button type="button" className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted">
                  <Avatar className="h-9 w-9 border-2 border-[#C8202A]/30">
                    <AvatarFallback className="bg-[#0B1E3B] text-xs font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-semibold leading-none">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem render={<Link href="/admin/profile" />}>Profile</DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/admin/settings" />}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
