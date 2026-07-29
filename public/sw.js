/*
 * DIGITs Election Watch — service worker.
 *
 * Deliberately conservative for an election platform: the shell and brand assets
 * are cached so the app opens on a weak network, but nothing that carries
 * election data is ever served from cache. Live feeds, evidence, the Supabase
 * API and every server function always go to the network, because a stale
 * result on election day is worse than no result.
 */

const VERSION = "digits-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/brand/digits-logo-192.png",
  "/brand/digits-logo-512.png",
  "/brand/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Anything that could carry live election state must never be cached. */
function isNeverCacheable(url) {
  return (
    url.pathname.startsWith("/_serverFn") ||
    url.pathname.startsWith("/api") ||
    url.hostname.endsWith("supabase.co") ||
    url.hostname.endsWith("livekit.cloud") ||
    url.protocol === "wss:" ||
    url.pathname.startsWith("/control-center")
  );
}

function isImmutableAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/brand/") ||
      url.pathname.startsWith("/assets/") ||
      /\.(?:png|webp|svg|woff2?|css|js)$/.test(url.pathname))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isNeverCacheable(url)) return;

  // Immutable assets: cache first, then fill in behind the scenes.
  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request)
            .then((response) => {
              if (response.ok) {
                const copy = response.clone();
                void caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
              }
              return response;
            })
            .catch(() => hit),
      ),
    );
    return;
  }

  // Navigations: network first so page content is always current, with the
  // cached shell as the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(SHELL_CACHE).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/").then((hit) => hit ?? Response.error())),
    );
  }
});
