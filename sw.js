/* Chart QA 서비스 워커: 네트워크 우선(새로고침·앱을 열 때 최신), 인터넷이 없으면 저장본. 아이콘만 저장본 우선 */
const CACHE = "chartqa-v1";
const SHELL = ["./", "index.html", "app.enc", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.endsWith("version.json")) return;
  const key = req.mode === "navigate" || url.pathname.endsWith("/") ? "index.html" : req;
  if (url.pathname.includes("/icons/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
    return;
  }
  e.respondWith(
    fetch(req, { cache: "no-store" })
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); } return res; })
      .catch(() => caches.match(key).then((hit) => hit || caches.match("index.html")))
  );
});
