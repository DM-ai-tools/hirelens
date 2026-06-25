import { prisma } from "@/lib/prisma";

/**
 * Resolve Anthropic API key: `.env` wins when set (so local key updates apply immediately),
 * then falls back to Admin → Company Settings in the database.
 */
export async function resolveAnthropicApiKey(): Promise<string | null> {
  const envKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (envKey) return envKey;

  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
    select: { anthropicApiKey: true },
  });
  const dbKey = settings?.anthropicApiKey?.trim();
  return dbKey || null;
}

export async function requireAnthropicApiKey(): Promise<string> {
  const key = await resolveAnthropicApiKey();
  if (!key) {
    throw new Error(
      "Anthropic API key not configured — set ANTHROPIC_API_KEY in .env or Admin → Settings"
    );
  }
  return key;
}

export async function hasAnthropicApiKey(): Promise<boolean> {
  return !!(await resolveAnthropicApiKey());
}
