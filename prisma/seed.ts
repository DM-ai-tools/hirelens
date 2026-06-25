import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/password";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await hashPassword("admin123");
  const recruiterPassword = await hashPassword("recruiter123");

  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      companyName: "DOTMappers IT Pvt Ltd",
      primaryColor: "#C8202A",
      contactEmail: "contact@dotmappers.in",
      contactPhone: "080-31206609",
      defaultAssessmentDays: 7,
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "admin@dotmappers.in" },
    create: {
      name: "Admin User",
      email: "admin@dotmappers.in",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      active: true,
    },
    update: {
      passwordHash: adminPassword,
      name: "Admin User",
      role: Role.ADMIN,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "recruiter@dotmappers.in" },
    create: {
      name: "TA Recruiter",
      email: "recruiter@dotmappers.in",
      passwordHash: recruiterPassword,
      role: Role.RECRUITER,
      active: true,
    },
    update: {
      passwordHash: recruiterPassword,
      name: "TA Recruiter",
      role: Role.RECRUITER,
      active: true,
    },
  });

  const assessments = [
    {
      name: "Frontend Engineering Test (HackerRank)",
      type: "LINK" as const,
      url: "https://www.hackerrank.com/test/example",
      roleTag: "Frontend",
    },
    {
      name: "React Challenge (Google Form)",
      type: "LINK" as const,
      url: "https://forms.google.com/example",
      roleTag: "React",
    },
    {
      name: "Full Stack Assessment",
      type: "LINK" as const,
      url: "https://www.testgorilla.com/example",
      roleTag: "Full Stack",
    },
  ];

  for (const a of assessments) {
    const existing = await prisma.assessment.findFirst({ where: { name: a.name } });
    if (!existing) {
      await prisma.assessment.create({ data: a });
    }
  }

  await prisma.emailTemplate.upsert({
    where: { id: "default-template" },
    create: {
      id: "default-template",
      name: "Default Assessment Invitation",
      subject: "Assessment Invitation – {{job_title}}",
      bodyHtml: "<p>Dear {{candidate_name}}, please complete your {{assessment_name}} assessment for {{job_title}} at {{company_name}} by {{deadline}}.</p>",
      active: true,
    },
    update: {},
  });

  console.log("Seed completed:");
  console.log("  Admin: admin@dotmappers.in / admin123");
  console.log("  Recruiter: recruiter@dotmappers.in / recruiter123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
