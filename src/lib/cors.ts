// Allowed CORS origins. localhost is always included — CORS is browser-enforced
// so there's no security risk from allowing localhost in production.
export const allowedOrigins = [
  "https://deals.spellslots.dev",
  "http://localhost:5173",
];

export function isAllowedOrigin(origin: string | undefined): origin is string {
  return !!origin && allowedOrigins.includes(origin);
}
