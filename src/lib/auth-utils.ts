/** Safe internal redirect path from ?callbackUrl= */
export function resolveCallbackUrl(
  raw: string | null | undefined,
  role?: "ADMIN" | "RECRUITER",
  fallback?: string
): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  if (fallback) return fallback;
  return role === "ADMIN" ? "/admin" : "/";
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
