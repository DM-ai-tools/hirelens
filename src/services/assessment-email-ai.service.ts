import Anthropic from "@anthropic-ai/sdk";
import { requireAnthropicApiKey } from "@/lib/anthropic-config";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export async function generateAssessmentEmailWithAI(params: {
  jobTitle: string;
  jdText: string;
  candidateName: string;
  candidateSummary: string;
  assessmentName: string;
  deadline: string;
  companyName: string;
  recruiterName: string;
  templateName: string;
  currentSubject: string;
  currentBodyHtml: string;
}): Promise<{ subject: string; bodyHtml: string }> {
  const apiKey = await requireAnthropicApiKey();
  const client = new Anthropic({ apiKey });

  const prompt = `You are an expert HR recruiter writing assessment invitation emails.

Rewrite the email professionally with a friendly, encouraging, personalized tone.
Preserve ALL template variables exactly as double-brace placeholders — do NOT replace them with real values.

Required placeholders (must appear in output where appropriate):
{{candidate_name}}, {{job_title}}, {{company_name}}, {{assessment_name}}, {{assessment_link}}, {{deadline}}, {{recruiter_name}}

Context:
- Job Title: ${params.jobTitle}
- Company: ${params.companyName}
- Recruiter: ${params.recruiterName}
- Assessment: ${params.assessmentName}
- Deadline: ${params.deadline}
- Template style: ${params.templateName}
- Candidate: ${params.candidateName}
- Candidate summary: ${params.candidateSummary}

Job description excerpt:
${params.jdText.slice(0, 2000)}

Current subject: ${params.currentSubject}

Current body HTML:
${params.currentBodyHtml}

Respond with ONLY valid JSON (no markdown fences):
{"subject":"...","bodyHtml":"..."}

The bodyHtml must be valid HTML suitable for email (inline styles, professional layout). Include a clear call-to-action button linking to {{assessment_link}}.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text.trim() : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return valid email JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as { subject?: string; bodyHtml?: string };
  if (!parsed.subject || !parsed.bodyHtml) {
    throw new Error("AI response missing subject or body");
  }

  return { subject: parsed.subject, bodyHtml: parsed.bodyHtml };
}
