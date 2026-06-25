const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** SSR-safe date formatting — avoids locale mismatches between server and browser. */
export function formatDateUTC(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** SSR-safe date + time formatting. */
export function formatDateTimeUTC(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const hours = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${hour12}:${minutes} ${period}`;
}
