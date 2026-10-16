/* 混排球員數據：離線快取
 * Made by Shelly ・ © 2026 Shelly. All rights reserved.
 * - 畫面本身（index.html）：先連網拿最新版，沒網路就用快取 → 改版不用手動清快取
 * - 圖示、字型、讀音字典：快取優先
 * - 送到 Apps Script 的 POST 一律不碰（離線佇列由頁面自己處理）
 * 改版時把 VERSION 加 1 可強制清掉舊快取。
 */
const VERSION = "vs-v13";  // v13：AI 分析匯出、圖表存成 PDF；v12：團隊圖表、個人圖表；v11：版權聲明；v10：問卷分頁（SUS）；v9：對方背號與對手分析、修改紀錄、好球、比分板閃爍回饋；v8：技術結構、局後報告、被攔死／攔網失誤、動作定義；v7：語音筆記、接球失誤、分析圖表；v6：站位同步、逐筆比分；v5：新 logo、網頁內說明
const SHELL = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-64.png", "./icons/favicon-32.png", "./icons/logo.svg",
  "./vendor/pinyin-pro-3.28.0.min.js"];
const CDN = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 畫面：network-first
  if (req.mode === "navigate" || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname))) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // 同網域靜態檔、字型、CDN：cache-first，抓到就存
  if (url.origin === location.origin || CDN.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
