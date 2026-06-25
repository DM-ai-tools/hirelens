import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "navy",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: "navy" | "red" | "green" | "amber";
}) {
  const accents = {
    navy: "bg-[#0B1E3B]/10 text-[#0B1E3B] dark:bg-white/10 dark:text-white",
    red: "bg-[#C8202A]/10 text-[#C8202A]",
    green: "bg-[#1E9E5A]/10 text-[#1E9E5A]",
    amber: "bg-[#E0A106]/15 text-[#B06E0A]",
  };

  return (
    <div className="rounded-xl border border-[#E5E9F0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0B1E3B]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0B1E3B] dark:text-white">{value}</p>
          {trend && <p className="mt-1 text-xs text-[#1E9E5A] font-medium">{trend}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
