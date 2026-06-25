import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const c = await prisma.candidate.findFirst({
  where: { name: { contains: "Nitisha", mode: "insensitive" } },
  orderBy: { updatedAt: "desc" },
  include: { job: true },
});

console.log(
  JSON.stringify(
    {
      name: c?.name,
      score: c?.score,
      goodToCall: c?.goodToCall,
      missingSkills: c?.missingSkills,
      scoreThreshold: c?.job?.scoreThreshold,
      minExperience: c?.job?.minExperience,
      mustHaveSkills: c?.job?.mustHaveSkills,
      llmMissingMust: c?.llmRaw?.missing_must_have,
      llmMissingSkills: c?.llmRaw?.missing_skills,
    },
    null,
    2
  )
);

await prisma.$disconnect();
await pool.end();
