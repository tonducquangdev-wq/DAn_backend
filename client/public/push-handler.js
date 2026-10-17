// Life Planner - PWA Web Push Notification Handler
// Xử lý thông báo đẩy ngoài màn hình khóa và rung chuông như Native App

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "Life Planner",
      body: event.data ? event.data.text() : "Bạn có thông báo mới"
    };
  }

  const title = data.title || "Life Planner";
  const options = {
    body: data.body || "Bạn có thông báo mới từ hệ thống Life Planner.",
    icon: data.icon || "/pwa-192x192.png",
    badge: data.badge || "/pwa-64x64.png",
    tag: data.tag || "life-planner-notification",
    renotify: true,
    vibrate: [150, 50, 150], // Rung điện thoại
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
