"use client";

import { formatDateTimeUTC } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";

export type EmailActivityRow = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  assessmentName: string;
  deadline: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  status: string;
  subject: string | null;
  bodyHtml: string | null;
  templateName: string | null;
  aiGenerated: boolean;
  timezone: string | null;
};

function statusVariant(status: string) {
  const s = status.toUpperCase();
  if (s === "FAILED" || s === "BOUNCED") return "destructive" as const;
  if (s === "DELIVERED" || s === "OPENED" || s === "CLICKED") return "default" as const;
  if (s === "SENT") return "secondary" as const;
  return "outline" as const;
}

export function AssessmentEmailActivity({
  rows,
  onSelect,
}: {
  rows: EmailActivityRow[];
  onSelect: (row: EmailActivityRow) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="report-bottom report-email-activity-wrap">
      <div className="card">
        <div className="card-header">
          <b>Assessment Email Activity</b>
          <span className="meta">{rows.length} email{rows.length === 1 ? "" : "s"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="report-table" style={{ width: "100%", minWidth: 720 }}>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Assessment</th>
                <th>Deadline</th>
                <th>Sent Time</th>
                <th>Delivery Status</th>
                <th>Opened</th>
                <th>Clicked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-[#F6F8FB]"
                  onClick={() => onSelect(row)}
                >
                  <td>
                    <span className="font-medium">{row.candidateName}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">{row.candidateEmail}</span>
                  </td>
                  <td>{row.assessmentName}</td>
                  <td>{row.deadline ? formatDateTimeUTC(row.deadline) : "—"}</td>
                  <td>{row.sentAt ? formatDateTimeUTC(row.sentAt) : "—"}</td>
                  <td>
                    <Badge variant={statusVariant(row.status)}>
                      {row.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td>{row.openedAt ? formatDateTimeUTC(row.openedAt) : "—"}</td>
                  <td>{row.clickedAt ? formatDateTimeUTC(row.clickedAt) : "—"}</td>
                  <td>
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
