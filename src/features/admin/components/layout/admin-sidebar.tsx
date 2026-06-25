"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Zap,
} from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/features/admin/config/nav-items";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const navItems = ADMIN_NAV_ITEMS;

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  onLogout,
  storageUsedPct,
  apiUsagePct,
  currentPlan,
  appVersion,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  storageUsedPct: number;
  apiUsagePct: number;
  currentPlan: string;
  appVersion: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-white/10 bg-gradient-to-b from-[#0B1E3B] to-[#071428] text-white transition-all duration-300",
        collapsed ? "w-[76px]" : "w-[272px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#C8202A] to-[#E0353D] text-sm font-bold shadow-lg shadow-[#C8202A]/30">
          HL
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-tight">
              Hire<span className="text-[#ff8a8f]">Lens</span>
            </div>
            <div className="text-[10px] font-semibold tracking-[0.2em] text-white/45">
              TALENT OS
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
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
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-white" : "text-white/65 hover:bg-white/8 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-active"
                  className="absolute inset-0 rounded-xl bg-[#C8202A] shadow-lg shadow-[#C8202A]/25"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              {!collapsed && <span className="relative z-10">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
              <HardDrive className="h-3.5 w-3.5" />
              Storage
            </div>
            <Progress value={storageUsedPct} className="h-1.5 bg-white/10" />
            <p className="mt-1 text-[10px] text-white/50">{storageUsedPct}% used</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
              <Zap className="h-3.5 w-3.5" />
              Claude API
            </div>
            <Progress value={apiUsagePct} className="h-1.5 bg-white/10" />
            <p className="mt-1 text-[10px] text-white/50">{apiUsagePct}% of monthly quota</p>
          </div>
          <div className="flex items-center justify-between text-[10px] text-white/45">
            <span>{currentPlan}</span>
            <span>v{appVersion}</span>
          </div>
        </div>
      )}

      <div className="border-t border-white/10 p-3 space-y-1">
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
