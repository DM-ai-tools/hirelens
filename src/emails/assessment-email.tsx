import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface AssessmentEmailProps {
  candidateName: string;
  assessmentName: string;
  assessmentLink?: string;
  isAttachment?: boolean;
  deadline: string;
  companyName: string;
  companyLogo?: string | null;
}

export default function AssessmentEmail({
  candidateName,
  assessmentName,
  assessmentLink,
  isAttachment = false,
  deadline,
  companyName,
  companyLogo,
}: AssessmentEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your assessment invitation from {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {companyLogo && (
            <Img src={companyLogo} width="120" height="40" alt={companyName} />
          )}
          <Heading style={heading}>Assessment Invitation</Heading>
          <Text style={paragraph}>Dear {candidateName},</Text>
          <Text style={paragraph}>
            Thank you for your interest in joining {companyName}. As the next step
            in our hiring process, we invite you to complete the following
            assessment:
          </Text>
          <Section style={box}>
            <Text style={boxTitle}>{assessmentName}</Text>
            {isAttachment ? (
              <Text style={paragraph}>
                The assessment document is attached to this email. Please complete it
                and return it before the deadline below.
              </Text>
            ) : assessmentLink ? (
              <Link href={assessmentLink} style={button}>
                Start Assessment
              </Link>
            ) : null}
          </Section>
          <Text style={paragraph}>
            <strong>Deadline:</strong> {deadline}
          </Text>
          <Text style={paragraph}>
            Please complete the assessment before the deadline. If you have any
            questions, feel free to reach out to our talent acquisition team.
          </Text>
          <Text style={footer}>
            Best regards,
            <br />
            {companyName} Talent Acquisition Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f8fb", fontFamily: "Poppins, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const heading = { color: "#0B1E3B", fontSize: "24px", fontWeight: "700" };
const paragraph = { color: "#3A4858", fontSize: "15px", lineHeight: "1.6" };
const box = { backgroundColor: "#fff", border: "1px solid #E5E9F0", borderRadius: "12px", padding: "24px", textAlign: "center" as const, margin: "24px 0" };
const boxTitle = { color: "#0B1E3B", fontSize: "18px", fontWeight: "600", margin: "0 0 16px" };
const button = { backgroundColor: "#C8202A", color: "#fff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", display: "inline-block" };
const footer = { color: "#7A8798", fontSize: "14px", marginTop: "32px" };
