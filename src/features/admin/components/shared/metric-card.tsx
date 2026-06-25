"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardKpi } from "@/features/admin/types";

const accentMap = {
  navy: "from-[#0B1E3B] to-[#16294a]",
  red: "from-[#C8202A] to-[#E0353D]",
  green: "from-[#1E9E5A] to-[#2bb86f]",
  amber: "from-[#E0A106] to-[#f0b820]",
  neutral: "from-[#7A8798] to-[#9aa8b8]",
};

export function MetricCard({ kpi, index }: { kpi: DashboardKpi; index: number }) {
  const TrendIcon =
    kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group relative overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-[#0B1E3B]"
    >
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity group-hover:opacity-20",
          accentMap[kpi.accent]
        )}
      />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {kpi.label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[#0B1E3B] dark:text-white">
        {kpi.value}
      </p>
      {kpi.change && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <TrendIcon
            className={cn(
              "h-3.5 w-3.5",
              kpi.trend === "up" && "text-[#1E9E5A]",
              kpi.trend === "down" && "text-[#C8202A]"
            )}
          />
          {kpi.change}
        </p>
      )}
    </motion.div>
  );
}
