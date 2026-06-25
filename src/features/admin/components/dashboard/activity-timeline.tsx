"use client";

import { motion } from "framer-motion";
import {
  UserPlus,
  FileSearch,
  Send,
  Briefcase,
  Users,
  FileBarChart,
  Mail,
  LogIn,
} from "lucide-react";
import { GlassCard } from "../shared/glass-card";
import { formatDateTimeUTC } from "@/lib/format-date";
import type { ActivityItem } from "@/features/admin/types";import { cn } from "@/lib/utils";

const iconMap = {
  resume_upload: FileSearch,
  candidate_screened: FileSearch,
  assessment_sent: Send,
  job_created: Briefcase,
  recruiter_added: UserPlus,
  report_generated: FileBarChart,
  email_delivered: Mail,
  login: LogIn,
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <GlassCard delay={0.25}>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#0B1E3B] dark:text-white">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">Live platform events</p>
      </div>
      <div className="relative space-y-0">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[#E5E9F0] dark:bg-white/10" />
        {items.map((item, i) => {
          const Icon = iconMap[item.type] ?? FileSearch;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative flex gap-4 py-3"
            >
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  "bg-[#F6F8FB] text-[#0B1E3B] ring-4 ring-white dark:bg-white/10 dark:text-white dark:ring-[#0B1E3B]"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-[#0B1E3B] dark:text-white">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.actor} · {formatDateTimeUTC(item.timestamp)}
                </p>              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
