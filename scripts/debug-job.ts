import "dotenv/config";
import { existsSync } from "fs";
import { prisma } from "../src/lib/prisma.ts";

const jobId = process.argv[2] || "cmqp2gr4s0007twtogjd3l4j7";

async function main() {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { candidates: true, processingRuns: { orderBy: { startedAt: "desc" }, take: 1 } },
  });
  if (!job) {
    console.log("not found");
    return;
  }
  for (const c of job.candidates) {
    console.log({
      name: c.name,
      status: c.status,
      score: c.score,
      file: c.resumeFileName,
      pathExists: existsSync(c.resumePath),
      path: c.resumePath,
      rawTextLen: c.rawText?.length ?? 0,
      aiRationale: c.aiRationale?.slice(0, 80),
    });
  }
  console.log("run:", job.processingRuns[0]);
  console.log("mustHaveSkills:", job.mustHaveSkills);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
