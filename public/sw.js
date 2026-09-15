const CACHE_PREFIX = "kid-learning-english";
const CACHE_VERSION = "2026-09-15";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const APP_SCOPE = new URL(self.registration.scope);
const INDEX_URL = new URL("./index.html", APP_SCOPE).href;
const ROOT_URL = new URL("./", APP_SCOPE).href;
const PLAY_URL = new URL("./play", APP_SCOPE).href;
const SHELL_URLS = [
  ROOT_URL,
  INDEX_URL,
  PLAY_URL,
  new URL("./manifest.webmanifest", APP_SCOPE).href,
  new URL("./app-icon.svg", APP_SCOPE).href,
  new URL("./icon-192.png", APP_SCOPE).href,
  new URL("./icon-512.png", APP_SCOPE).href,
  new URL("./icon-maskable-512.png", APP_SCOPE).href,
  new URL("./apple-touch-icon.png", APP_SCOPE).href
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX))
            .filter((name) => name !== SHELL_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match(INDEX_URL)) ||
      (await caches.match(ROOT_URL)) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}
