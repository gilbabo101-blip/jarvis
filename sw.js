// Jarvis offline shell: always try the network first so updates show up at once,
// fall back to the last saved copy when offline. Google data is never cached.
const CACHE = "jarvis-v2";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  // App files revalidate with the server every time (a quick 304 when nothing changed), so a new version shows on the next open.
  const fresh = /\.(html|js|webmanifest)$/.test(url.pathname) || url.pathname.endsWith("/") || e.request.mode === "navigate";
  e.respondWith(
    (fresh ? fetch(url.href, { cache: "no-cache", credentials: "same-origin" }) : fetch(e.request))
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match("./index.html")))
  );
});
