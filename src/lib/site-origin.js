import { headers } from "next/headers";

export function getSiteOrigin() {
  const headersList = headers();
  const origin = headersList.get("origin");
  if (origin) return origin;

  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  if (host) return `${protocol}://${host}`;

  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
