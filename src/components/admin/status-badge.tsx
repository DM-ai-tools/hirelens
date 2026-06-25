import { cn } from "@/lib/utils";

const variants = {
  active: "bg-[#E8F8EF] text-[#1E9E5A] border-[#B8EACB]",
  inactive: "bg-[#FBE7E8] text-[#C8202A] border-[#f3c2c4]",
  pending: "bg-[#FBF1DC] text-[#B06E0A] border-[#F2D9A0]",
  completed: "bg-[#E8F8EF] text-[#1E9E5A] border-[#B8EACB]",
  processing: "bg-[#EEF1F6] text-[#0B1E3B] border-[#E5E9F0]",
  failed: "bg-[#FBE7E8] text-[#E24B4A] border-[#f3c2c4]",
  yes: "bg-[#E8F8EF] text-[#1E9E5A]",
  maybe: "bg-[#FBF1DC] text-[#B06E0A]",
  no: "bg-[#FBE7E8] text-[#E24B4A]",
  review: "bg-[#EEF1F6] text-[#7A8798]",
};

export function StatusBadge({
  children,
  variant = "active",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
