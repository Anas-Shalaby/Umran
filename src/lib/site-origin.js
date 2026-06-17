import { headers } from "next/headers";

export function getSiteOrigin() {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  const headersList = headers();
  const origin = headersList.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  if (host) return `${protocol}://${host}`.replace(/\/$/, "");

  return "http://localhost:3000";
}
