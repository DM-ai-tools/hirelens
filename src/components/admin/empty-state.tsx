import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E9F0] bg-[#F6F8FB]/50 px-6 py-16 text-center dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B1E3B]/5 text-[#0B1E3B] dark:bg-white/10 dark:text-white">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-[#0B1E3B] dark:text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
