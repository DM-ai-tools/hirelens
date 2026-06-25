import "dotenv/config";
import { prisma } from "../src/lib/prisma.ts";
import { ensureScreeningStarted } from "../src/services/queue.service.ts";

const jobId = process.argv[2];
if (!jobId) {
  console.error("Usage: npx tsx scripts/run-pipeline.ts <jobId>");
  process.exit(1);
}

async function main() {
  console.log("Starting pipeline for", jobId);
  const kick = await ensureScreeningStarted(jobId);
  console.log("ensureScreeningStarted:", kick);

  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const { getProcessingStatus } = await import("../src/services/processing.service.ts");
    const status = await getProcessingStatus(jobId);
    console.log(
      `[${i}] stage=${status.currentStage} parsed=${status.parsed} evaluated=${status.evaluated} failed=${status.failed} complete=${status.isComplete}`
    );
    if (status.isComplete) break;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
