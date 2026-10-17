// Life Planner - Service Worker chính thức
// Hỗ trợ cả môi trường Dev (Vite) và Production (Build)

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Import logic xử lý Push Notification (rung máy, hiện màn hình khóa, click mở trang)
try {
  importScripts("/push-handler.js");
} catch (err) {
  console.error("Lỗi nạp push-handler.js vào Service Worker:", err);
}
