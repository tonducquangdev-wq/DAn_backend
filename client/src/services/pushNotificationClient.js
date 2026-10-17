import { api } from "./api";

/**
 * Chuyển đổi VAPID Public Key định dạng Base64 sang Uint8Array theo chuẩn Web Push RFC 8292
 */
export function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Kiểm tra thiết bị và trình duyệt có hỗ trợ Web Push Notification không
 */
export function isPushNotificationSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Lấy Service Worker Registration một cách an toàn có timeout (không bao giờ treo)
 */
export async function getRegistrationWithTimeout(timeoutMs = 3000) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  // 1. Kiểm tra registration hiện có trước
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
  } catch (err) {
    console.warn("Không thể lấy registration hiện tại:", err);
  }

  // 2. Nếu chưa có, chủ động đăng ký sw.js
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    if (reg) return reg;
  } catch (err) {
    console.warn("Lỗi gọi register /sw.js:", err);
  }

  // 3. Chờ navigator.serviceWorker.ready có giới hạn thời gian (tránh treo vĩnh viễn)
  try {
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout Service Worker Ready")), timeoutMs)
    );
    return await Promise.race([readyPromise, timeoutPromise]);
  } catch (err) {
    console.warn("Timeout chờ Service Worker:", err);
    return null;
  }
}

/**
 * Kiểm tra trạng thái đã đăng ký nhận thông báo đẩy chưa
 */
export async function getExistingPushSubscription() {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await getRegistrationWithTimeout(3000);
    if (!registration || !registration.pushManager) return null;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn("Lỗi kiểm tra push subscription:", err);
    return null;
  }
}

/**
 * Đăng ký quyền và nhận Push Subscription từ trình duyệt
 */
export async function subscribeToPushNotifications() {
  if (!isPushNotificationSupported()) {
    const isIOSDevice =
      typeof window !== "undefined" &&
      /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isIOSDevice) {
      throw new Error(
        "🍎 Trên iPhone, Apple yêu cầu bạn phải bấm nút Chia sẻ (biểu tượng ô vuông mũi tên lên) ➔ chọn 'Thêm vào Màn hình chính' (Add to Home Screen). Sau đó mở app từ màn hình chính để kích hoạt thông báo nhé!"
      );
    }
    throw new Error("Trình duyệt hoặc thiết bị này chưa hỗ trợ Web Push Notification.");
  }

  // BƯỚC 1: XIN QUYỀN THÔNG BÁO NGAY LẬP TỨC (Bắt buộc phải gọi trực tiếp để giữ user activation trên iOS Safari)
  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission === "denied") {
    throw new Error(
      "⚠️ Quyền thông báo đang bị CHẶN trên thiết bị. Vui lòng vào Cài đặt trình duyệt / Cài đặt iPhone ➔ Safari ➔ Thông báo để cấp quyền lại."
    );
  }

  if (permission !== "granted") {
    throw new Error("Bạn chưa cấp quyền cho phép gửi thông báo.");
  }

  // BƯỚC 2: Khởi tạo / lấy Service Worker registration
  const registration = await getRegistrationWithTimeout(5000);
  if (!registration || !registration.pushManager) {
    throw new Error("Không thể kích hoạt Service Worker trên thiết bị. Vui lòng tải lại trang và thử lại.");
  }

  // BƯỚC 3: Lấy VAPID Public Key từ máy chủ Express
  const resKey = await api.getPushPublicKey();
  if (!resKey.success || !resKey.data?.publicKey) {
    throw new Error("Không thể kết nối máy chủ để lấy VAPID Public Key: " + (resKey.message || ""));
  }

  const applicationServerKey = urlB64ToUint8Array(resKey.data.publicKey);

  // BƯỚC 4: Đăng ký với Push Service của trình duyệt
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
  }

  // BƯỚC 5: Gửi subscription payload lên backend để lưu vào MongoDB
  const userAgent = navigator.userAgent;
  let deviceInfo = "Mobile Device";
  if (/iPhone|iPad/i.test(userAgent)) {
    deviceInfo = "iPhone/iPad PWA";
  } else if (/Android/i.test(userAgent)) {
    deviceInfo = "Android Mobile";
  } else if (/Windows/i.test(userAgent)) {
    deviceInfo = "Windows PC";
  } else if (/Mac/i.test(userAgent)) {
    deviceInfo = "macOS Device";
  }

  const resSave = await api.subscribePush({
    subscription: subscription.toJSON(),
    device_info: deviceInfo
  });

  return resSave;
}

/**
 * Hủy đăng ký nhận thông báo đẩy trên thiết bị này
 */
export async function unsubscribeFromPushNotifications() {
  if (!isPushNotificationSupported()) return false;

  try {
    const registration = await getRegistrationWithTimeout(3000);
    if (!registration || !registration.pushManager) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      try {
        await api.unsubscribePush({ endpoint: subscription.endpoint });
      } catch (e) {
        console.warn("Lỗi gửi request hủy push lên server:", e);
      }
      await subscription.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error("Lỗi hủy đăng ký push:", err);
    return false;
  }
}
