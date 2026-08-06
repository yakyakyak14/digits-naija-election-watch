/**
 * The canonical public URL of this deployment — single source of truth.
 *
 * Everything that needs an absolute URL (canonical tag, Open Graph and Twitter
 * cards, JSON-LD, the certificate verification line, robots.txt and sitemap.xml)
 * reads from here, so moving to a new domain is one environment variable rather
 * than a hunt through seven files.
 *
 * Set `VITE_SITE_URL` in the environment (and in the Vercel project settings) to
 * override. The fallback is the current Vercel deployment, which is a real,
 * resolving host — never a placeholder. An earlier version defaulted to an
 * invented domain with no DNS record, which silently broke every link in the
 * DIGEO welcome email.
 *
 * The Edge Functions read the same value from `PUBLIC_SITE_URL`; keep the two in
 * step (`npm run fn:deploy -- --secrets` pushes it).
 */
const FALLBACK = "https://digits-election-watch.vercel.app";

function normalise(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return FALLBACK;
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const SITE_URL = normalise(import.meta.env.VITE_SITE_URL ?? FALLBACK);

/** Absolute URL for a path, e.g. `absoluteUrl("/live")`. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Host without scheme, for display: "digits.dpdns.org". */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/**
 * The platform's public mailbox, derived from the domain so it can never drift
 * from where mail is actually routed. Cloudflare Email Routing delivers this to
 * the operator's inbox; there is deliberately only ONE published address,
 * because a role address that nobody has configured just bounces.
 */
export const CONTACT_EMAIL = `info@${SITE_HOST}`;
