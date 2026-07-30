import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { reportAppError } from "../lib/error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { DigitsMark } from "@/components/brand/DigitsLogo";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { applyTheme, readStoredTheme } from "@/components/theme/ThemeToggle";

const SITE_NAME = "DIGITs Election Watch";
const SITE_URL = "https://digits-election-watch.org";
const TAGLINE = "Nigeria, watched by Nigerians";
const DESCRIPTION =
  "Live observer feeds from Nigerian polling units, verified citizen i-Witness reports, and accredited DIGEO observer training. Watching is free and needs no account.";

/**
 * Structured data so search engines and social cards describe the platform
 * rather than guessing from the page text.
 */
const ORGANISATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DIGITs Nigeria Election Watch",
  alternateName: "DIGITs Election Watch",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/digits-logo-512.png`,
  description: DESCRIPTION,
  areaServed: { "@type": "Country", name: "Nigeria" },
  foundingLocation: { "@type": "Place", name: "Abuja, Nigeria" },
  knowsAbout: [
    "Election observation",
    "Electoral transparency",
    "Citizen reporting",
    "Nigerian elections",
  ],
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-hero-mesh px-4 text-center">
      <DigitsMark size={72} priority />
      <p className="font-display text-6xl font-extrabold text-foreground">404</p>
      <h1 className="font-display text-xl font-semibold">This page isn't on the watch list</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The link may be out of date. The live grid and the reporting tools are both a click away.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link
          to="/live"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Watch live
        </Link>
        <Link
          to="/"
          className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent/15"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <DigitsMark size={56} priority />
      <h1 className="font-display text-xl font-semibold">This page didn't load</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Something broke on our side. Trying again usually clears it.
      </p>
      <div className="mt-2 flex justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent/15"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: `${SITE_NAME} — ${TAGLINE}` },
      { name: "description", content: DESCRIPTION },
      { name: "application-name", content: SITE_NAME },
      { name: "author", content: "DIGITs Nigeria Election Watch" },
      { name: "theme-color", content: "#0a1f3a" },
      { name: "color-scheme", content: "light dark" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "DIGITs" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "geo.region", content: "NG" },
      { name: "geo.placename", content: "Nigeria" },

      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: `${SITE_NAME} — ${TAGLINE}` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_NG" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: `${SITE_URL}/brand/og-card.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "DIGITs Election Watch — Nigeria, watched by Nigerians",
      },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${SITE_NAME} — ${TAGLINE}` },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: `${SITE_URL}/brand/og-card.png` },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/brand/digits-logo-48.png", type: "image/png", sizes: "48x48" },
      { rel: "icon", href: "/brand/digits-logo-32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/brand/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "canonical", href: SITE_URL },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ORGANISATION_JSONLD) }],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Apply the stored theme before first paint of the client tree so a dark-mode
  // visitor never sees a light flash.
  useEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []); // Run once on mount

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <Outlet />
      <InstallPrompt />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
