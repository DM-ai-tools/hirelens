import "dotenv/config";
import { prisma } from "../src/lib/prisma.ts";
import { runEvaluation } from "../src/services/ai.service.ts";

const jobId = "cmqp2gr4s0007twtogjd3l4j7";

async function main() {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  const candidate = await prisma.candidate.findFirst({
    where: { jobId, rawText: { not: null } },
  });
  if (!job || !candidate?.rawText) {
    console.log("missing data");
    return;
  }
  console.log("API key set:", !!process.env.ANTHROPIC_API_KEY);
  console.log("USE_MOCK_AI:", process.env.USE_MOCK_AI);
  try {
    const result = await runEvaluation(candidate.rawText, {
      title: job.title,
      mustHaveSkills: job.mustHaveSkills,
      niceToHaveSkills: job.niceToHaveSkills,
      minExperience: job.minExperience,
      jdText: job.jdText,
    });
    console.log("OK:", result.name, result.matched_must_have?.length);
  } catch (e) {
    console.error("EVAL ERROR:", e);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
