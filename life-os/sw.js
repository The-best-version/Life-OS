/* --- the app, kept openable -------------------------------------------
 *  The local server starts with Windows, but "it had not come up yet" must
 *  never read as "your year is gone". This keeps the one html file and its
 *  icons and fonts in a cache, and serves them when the network fails.
 *
 *  Network first, always. The app is a single html file rebuilt in place,
 *  so a cache that answered first would keep handing back yesterday's build
 *  after every rebuild — indistinguishable from a change that did not take.
 *  The cache only ever answers when the network could not.
 *
 *  It never touches the data. /state and /sync are excluded outright: a
 *  stale copy of the state handed back from a cache is precisely the
 *  silent corruption this whole arrangement exists to prevent.
 * --------------------------------------------------------------------- */

const CACHE = "life-os-shell-v3";
/* React is the one thing the app cannot open without, and it comes off a
   CDN — so it is precached by name rather than left to be picked up on the
   way past. Everything else here is small and local. */
const SHELL = [
  "./",
  "index.html",
  /* By the path it is served at, not by filename. The cache is keyed on the
     request, so precaching "hub.html" would leave a request for /hub with
     nothing to fall back to. */
  "hub",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js",
];

self.addEventListener("install", (e) => {
  /* One at a time, not addAll: addAll is all-or-nothing, so a single icon
     404 or a CDN hiccup would leave the cache completely empty and the
     offline fallback would quietly not exist. */
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/* Only the shell. Anything that carries state is left to the network, where
   a failure is visible, instead of being answered from a cache, where it is
   not. */
function shellRequest(req) {
  if (req.method !== "GET") return false;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    return !url.pathname.startsWith("/state") && !url.pathname.startsWith("/sync");
  }
  return (
    url.hostname === "cdnjs.cloudflare.com" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

self.addEventListener("fetch", (e) => {
  if (!shellRequest(e.request)) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(e.request, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches
          .match(e.request)
          .then((hit) => hit || caches.match("index.html"))
          .then(
            (hit) =>
              hit ||
              new Response("غير متصل", {
                status: 503,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
              }),
          ),
      ),
  );
});
