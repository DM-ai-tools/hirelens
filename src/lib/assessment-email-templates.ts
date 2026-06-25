export type EmailTemplateVars = {
  candidate_name: string;
  job_title: string;
  company_name: string;
  assessment_name: string;
  assessment_link: string;
  deadline: string;
  recruiter_name: string;
};

export type BuiltInTemplateId = "assessment-invitation" | "interview-invitation" | "custom";

export type EmailTemplateOption = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  builtIn?: boolean;
};

const ASSESSMENT_BODY = `
<div style="font-family: Poppins, Arial, sans-serif; color: #3A4858; line-height: 1.6; max-width: 560px;">
  <p>Dear {{candidate_name}},</p>
  <p>Thank you for your interest in the <strong>{{job_title}}</strong> opportunity at <strong>{{company_name}}</strong>.</p>
  <p>As the next step in our hiring process, we invite you to complete the following assessment:</p>
  <div style="background: #fff; border: 1px solid #E5E9F0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
    <p style="font-size: 18px; font-weight: 600; color: #0B1E3B; margin: 0 0 16px;">{{assessment_name}}</p>
    <a href="{{assessment_link}}" style="background: #C8202A; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Start Assessment</a>
  </div>
  <p><strong>Deadline:</strong> {{deadline}}</p>
  <p>If you have any questions, please reach out to our talent acquisition team.</p>
  <p>Best regards,<br/>{{recruiter_name}}<br/>{{company_name}} Talent Acquisition</p>
</div>
`.trim();

const INTERVIEW_BODY = `
<div style="font-family: Poppins, Arial, sans-serif; color: #3A4858; line-height: 1.6; max-width: 560px;">
  <p>Dear {{candidate_name}},</p>
  <p>Congratulations on progressing in our hiring process for <strong>{{job_title}}</strong> at <strong>{{company_name}}</strong>.</p>
  <p>We would like to invite you to complete a pre-interview assessment before we schedule your interview:</p>
  <div style="background: #fff; border: 1px solid #E5E9F0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
    <p style="font-size: 18px; font-weight: 600; color: #0B1E3B; margin: 0 0 16px;">{{assessment_name}}</p>
    <a href="{{assessment_link}}" style="background: #0B1E3B; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Begin Assessment</a>
  </div>
  <p><strong>Please complete by:</strong> {{deadline}}</p>
  <p>We look forward to reviewing your submission and connecting with you soon.</p>
  <p>Warm regards,<br/>{{recruiter_name}}<br/>{{company_name}}</p>
</div>
`.trim();

export const BUILTIN_EMAIL_TEMPLATES: EmailTemplateOption[] = [
  {
    id: "assessment-invitation",
    name: "Assessment Invitation",
    subject: "Assessment Invitation – {{job_title}}",
    bodyHtml: ASSESSMENT_BODY,
    builtIn: true,
  },
  {
    id: "interview-invitation",
    name: "Interview Invitation",
    subject: "Interview Assessment – {{job_title}}",
    bodyHtml: INTERVIEW_BODY,
    builtIn: true,
  },
];

export function defaultSubject(jobTitle: string, templateId: string): string {
  if (templateId === "interview-invitation") {
    return `Interview Assessment – ${jobTitle}`;
  }
  return `Assessment Invitation – ${jobTitle}`;
}

export function replaceTemplateVars(template: string, vars: EmailTemplateVars): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out = out.replaceAll(`{{${camel}}}`, value);
    // Case-insensitive fallback for common placeholders
    const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    out = out.replace(re, value);
  }
  return out;
}

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New York (ET)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PT)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
] as const;

const TZ_OFFSETS: Record<string, string> = {
  "Asia/Kolkata": "+05:30",
  UTC: "+00:00",
  "America/New_York": "-04:00",
  "America/Los_Angeles": "-07:00",
  "Europe/London": "+01:00",
  "Asia/Singapore": "+08:00",
  "Asia/Dubai": "+04:00",
};

export function deadlineFromParts(date: string, time: string, timezone: string): Date {
  const offset = TZ_OFFSETS[timezone] ?? "+05:30";
  return new Date(`${date}T${time}:00${offset}`);
}

export function formatDeadlineDisplay(date: Date, timezone: string): string {
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function defaultDeadlineParts(daysAhead = 7, timezone = "Asia/Kolkata") {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const date = d.toISOString().slice(0, 10);
  const time = "18:00";
  return { date, time, timezone };
}
