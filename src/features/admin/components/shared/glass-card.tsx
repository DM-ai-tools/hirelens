"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "rounded-2xl border border-[#E5E9F0]/80 bg-white/80 p-6 shadow-[0_8px_30px_rgba(11,30,59,0.06)] backdrop-blur-sm",
        "dark:border-white/10 dark:bg-[#0B1E3B]/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
