const CACHE_NAME = "bootkit-shell-v1";

const APP_SHELL = [
  "/",
  "/categories",
  "/cart",
  "/orders",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) return;

  if (
    requestUrl.pathname.startsWith("/api/") ||
    requestUrl.pathname.startsWith("/_next/webpack-hmr")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseCopy = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseCopy))
            .catch(() => undefined);

          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match("/")) ||
            Response.error()
          );
        })
    );

    return;
  }

  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseCopy = networkResponse.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseCopy))
            .catch(() => undefined);

          return networkResponse;
        });
      })
    );
  }
});