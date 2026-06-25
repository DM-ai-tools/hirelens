"use client";

import { motion } from "framer-motion";
import type { PipelineStage } from "@/features/admin/types";
import { GlassCard } from "../shared/glass-card";
import { ArrowDown } from "lucide-react";

export function HiringPipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#0B1E3B] dark:text-white">AI Hiring Pipeline</h2>
        <p className="text-sm text-muted-foreground">End-to-end conversion across your talent funnel</p>
      </div>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-0">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex flex-1 flex-col items-center lg:flex-row">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="w-full flex-1 rounded-xl border border-[#E5E9F0] bg-gradient-to-br from-white to-[#F6F8FB] p-4 dark:border-white/10 dark:from-[#0B1E3B] dark:to-[#071428]"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {stage.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0B1E3B] dark:text-white">{stage.count}</p>
              <div className="mt-3 flex gap-3 text-xs">
                <span className="rounded-full bg-[#E8F8EF] px-2 py-0.5 font-medium text-[#1E9E5A]">
                  {stage.percentage}%
                </span>
                <span className="text-muted-foreground">Conv. {stage.conversionRate}%</span>
              </div>
            </motion.div>
            {i < stages.length - 1 && (
              <div className="flex shrink-0 items-center justify-center py-2 text-muted-foreground lg:px-2 lg:py-0">
                <ArrowDown className="h-4 w-4 lg:hidden" />
                <span className="hidden text-lg text-[#C8202A] lg:inline">→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
