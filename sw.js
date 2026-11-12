/* WigglePlay service worker: lets the games open without a connection once they have been visited.
   Pages and code are fetched fresh when online (so updates arrive straight away) and fall back to the
   saved copy when offline. The large face-tracking files are saved the first time they are used. */
const VERSION = "wiggleplay-v3";
const CORE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "privacy/",
  "shared/kit.js",
  "shared/kit.css",
  "shared/motion.js",
  "shared/animals.js",
  "shared/face.js",
  "assets/icon.svg",
  "assets/favicon.svg",
  "assets/apple-touch-icon.png",
  "assets/icon-192.png",
  "assets/fredoka-600-latin.woff2",
  "games/balloon-pop/",
  "games/colour-squares/",
  "games/copy-the-tune/",
  "games/find-the-pair/",
  "games/how-many/",
  "games/music-wall/",
  "games/musical-colours/",
  "games/odd-one/",
  "games/shape-fit/",
  "games/star-pictures/",
  "games/surprise-friends/",
  "games/walking-animals/",
  "games/woodcutter/",
  "assets/screens/balloon-pop.png",
  "assets/screens/colour-squares.png",
  "assets/screens/copy-the-tune.png",
  "assets/screens/find-the-pair.png",
  "assets/screens/how-many.png",
  "assets/screens/music-wall.png",
  "assets/screens/musical-colours.png",
  "assets/screens/odd-one.png",
  "assets/screens/shape-fit.png",
  "assets/screens/star-pictures.png",
  "assets/screens/surprise-friends.png",
  "assets/screens/walking-animals.png",
  "assets/screens/woodcutter.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const big = req.url.includes("/shared/mediapipe/");
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const saved = await cache.match(req, { ignoreSearch: true });
      if (big && saved) return saved;                       // large files that never change: saved copy first
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        if (saved) return saved;                            // offline: use the saved copy
        if (req.mode === "navigate") { const home = await cache.match("./"); if (home) return home; }
        throw e;
      }
    })
  );
});
