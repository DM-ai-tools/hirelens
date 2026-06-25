import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("NO_USER");
    process.exit(1);
  }
  const job = await prisma.job.create({
    data: {
      title: "Test Job",
      jdText: "A".repeat(60),
      minExperience: 0,
      mustHaveSkills: ["SQL"],
      niceToHaveSkills: [],
      mandatoryRequirements: "must have claude",
      scoreThreshold: 70,
      createdById: user.id,
    },
  });
  console.log("OK", job.id);
  await prisma.job.delete({ where: { id: job.id } });
} catch (e) {
  console.error("ERR", e);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
