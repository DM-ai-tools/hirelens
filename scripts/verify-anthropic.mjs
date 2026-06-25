import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const key = process.env.ANTHROPIC_API_KEY?.trim();
const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";
const useMock = process.env.USE_MOCK_AI === "true";

if (!key) {
  console.error("ANTHROPIC_API_KEY is not set in .env");
  process.exit(1);
}

if (useMock) {
  console.warn("USE_MOCK_AI=true — real Claude calls are disabled in app logic when no key is found.");
}

const client = new Anthropic({ apiKey: key });

try {
  const response = await client.messages.create({
    model,
    max_tokens: 32,
    messages: [{ role: "user", content: 'Reply with exactly: {"ok":true}' }],
  });
  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  console.log("Anthropic API key: OK");
  console.log("Model:", model);
  console.log("Sample response:", text.slice(0, 80));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Anthropic API key verification failed:", message);
  process.exit(1);
}
