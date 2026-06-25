"use client";

import { cn } from "@/lib/utils";

export function AssessmentEmailPreview({
  mode,
  subject,
  bodyHtml,
  companyName,
  toEmail,
  deadline,
}: {
  mode: "desktop" | "mobile";
  subject: string;
  bodyHtml: string;
  companyName: string;
  toEmail?: string | null;
  deadline?: string | null;
}) {
  return (
    <div
      className={cn(
        "mx-auto rounded-xl border border-[#E5E9F0] bg-white shadow-sm dark:border-white/10 dark:bg-[#0B1E3B]/50",
        mode === "mobile" ? "max-w-[320px]" : "w-full"
      )}
    >
      <div className="sticky top-0 z-10 border-b border-[#E5E9F0] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#0B1E3B]">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-[#0B1E3B] dark:text-white">From:</span>
          {companyName}
        </div>
        {toEmail && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-[#0B1E3B] dark:text-white">To:</span>
            <span className="truncate font-medium text-[#0B1E3B] dark:text-white">{toEmail}</span>
          </div>
        )}
        {deadline && (
          <div className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
            <span className="shrink-0 font-semibold text-[#0B1E3B] dark:text-white">Deadline:</span>
            <span className="font-medium text-[#0B1E3B] dark:text-white">{deadline}</span>
          </div>
        )}
        <div className="mt-1 text-sm font-semibold text-[#0B1E3B] dark:text-white">{subject}</div>
      </div>
      <div
        className="p-4 text-sm leading-relaxed [&_a]:text-[#C8202A] [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </div>
  );
}
