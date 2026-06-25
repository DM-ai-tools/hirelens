"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeUTC } from "@/lib/format-date";
import { AssessmentEmailPreview } from "@/components/report/assessment-email-preview";
import type { EmailActivityRow } from "@/components/report/assessment-email-activity";

export function AssessmentEmailDetailDrawer({
  row,
  companyName,
  open,
  onOpenChange,
}: {
  row: EmailActivityRow | null;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Email details</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 px-1 text-sm">
          <DetailRow label="Candidate" value={row.candidateName} />
          <DetailRow label="Email" value={row.candidateEmail} />
          <DetailRow label="Assessment" value={row.assessmentName} />
          <DetailRow label="Subject" value={row.subject ?? "—"} />
          <DetailRow label="Template" value={row.templateName ?? "—"} />
          <DetailRow label="AI generated" value={row.aiGenerated ? "Yes" : "No"} />
          <DetailRow label="Deadline" value={row.deadline ? formatDateTimeUTC(row.deadline) : "—"} />
          <DetailRow label="Sent" value={row.sentAt ? formatDateTimeUTC(row.sentAt) : "—"} />
          <DetailRow label="Delivered" value={row.deliveredAt ? formatDateTimeUTC(row.deliveredAt) : "—"} />
          <DetailRow label="Opened" value={row.openedAt ? formatDateTimeUTC(row.openedAt) : "—"} />
          <DetailRow label="Clicked" value={row.clickedAt ? formatDateTimeUTC(row.clickedAt) : "—"} />
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">Status</span>
            <Badge>{row.status}</Badge>
          </div>

          {row.bodyHtml && (
            <div className="pt-2">
              <p className="mb-2 font-semibold">Email preview</p>
              <AssessmentEmailPreview
                mode="mobile"
                subject={row.subject ?? ""}
                bodyHtml={row.bodyHtml}
                companyName={companyName}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#E5E9F0] py-2 dark:border-white/10">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
