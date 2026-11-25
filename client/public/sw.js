// Life Planner - Service Worker chính thức đăng ký cho PWA
// Hỗ trợ cả môi trường Dev (Vite) và Production (Build)

const SW_VERSION = "2026-02";
console.log(`[SW] Life Planner Service Worker ${SW_VERSION} đang khởi động`);

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Import logic xử lý Push Notification (rung máy, hiện màn hình khóa, click mở trang)
// Dùng query ?v= để cache-bust, đảm bảo thiết bị đã cài PWA tải được bản push-handler mới nhất.
try {
  importScripts(`/push-handler.js?v=${SW_VERSION}`);
  console.log("[SW] Đã nạp push-handler.js thành công");
} catch (err) {
  console.error("[SW] Lỗi nạp push-handler.js vào Service Worker:", err);
}

// FALLBACK: Nếu push-handler.js không nạp được (404 / lỗi cú pháp / cache cũ),
// vẫn phải có push listener để hiển thị notification — tránh iOS thu hồi quyền push.
if (!self.__lpPushHandlerRegistered) {
  console.warn("[SW] push-handler.js chưa nạp được — dùng fallback push handler tối giản");
  self.addEventListener("push", (event) => {
    let data = {};
    try {
      data = event.data ? event.data.json() : {};
    } catch (e) {
      data = { title: "Life Planner", body: "Bạn có thông báo mới" };
    }
    const title = data.title || "Life Planner";
    const options = {
      body: data.body || "Bạn có thông báo mới từ Life Planner.",
      icon: data.icon || "/pwa-192x192.png",
      badge: data.badge || "/pwa-64x64.png",
      tag: data.tag || "life-planner-fallback",
      data: { url: data.url || "/" }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  });
}
