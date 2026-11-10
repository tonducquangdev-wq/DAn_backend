# 🤖 AI PROJECT BRIEF — Life Planner RESTful API
> **Mục đích file này:** Đây là tài liệu ngữ cảnh toàn diện dành cho AI. Khi bắt đầu làm việc với dự án này, hãy đọc file này để hiểu toàn bộ kiến trúc, tech stack, cấu trúc code, luồng nghiệp vụ và quy ước coding trước khi thực hiện bất kỳ thay đổi nào.

---

## 1. THÔNG TIN TỔNG QUAN

| Thuộc tính | Giá trị |
|---|---|
| **Tên dự án** | Life Planner RESTful API Server |
| **Mô tả** | Backend + Frontend tích hợp — Ứng dụng quản lý đời sống toàn diện cho sinh viên và người đi làm |
| **Port mặc định** | `5000` |
| **Entry point** | `server.js` |
| **Ngôn ngữ** | JavaScript (CommonJS — `"type": "commonjs"`) |
| **Node.js** | v18+ |

---

## 2. TECH STACK

### Backend
| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| `express` | ^5.2.1 | Web framework |
| `mongoose` | ^9.10.3 | ODM cho MongoDB |
| `bcryptjs` | ^3.0.3 | Mã hóa mật khẩu (salt rounds = 10) |
| `jsonwebtoken` | ^9.0.3 | Tạo & xác thực JWT (hết hạn 7 ngày) |
| `express-validator` | ^7.3.2 | Validate dữ liệu đầu vào |
| `web-push` | ^3.6.7 | Gửi Web Push Notification (VAPID) |
| `cors` | ^2.8.6 | Cho phép cross-origin requests |
| `dotenv` | ^18.0.5 | Quản lý biến môi trường |
| `swagger-jsdoc` + `swagger-ui-express` | - | API docs (tích hợp sẵn) |

### Dev Dependencies
| Thư viện | Vai trò |
|---|---|
| `nodemon` | Auto-restart server khi dev |
| `concurrently` | Chạy song song server + client + ngrok tunnel |

### Frontend (nằm trong `client/`)
| Công nghệ | Vai trò |
|---|---|
| React 19 + Vite | SPA frontend |
| `vite-plugin-pwa` | Chuyển app thành PWA (Progressive Web App) |
| Service Worker + Workbox | Offline cache, nhận Push Notification |

---

## 3. CẤU TRÚC THƯ MỤC

```
test_backend/
├── server.js                      ← Entry point: khởi Express, mount routers, serve client/dist
├── package.json
├── .env                           ← Biến môi trường (MONGO_URI, JWT_SECRET, VAPID keys)
│
├── Config/
│   ├── db.js                      ← Kết nối MongoDB, gọi seedAdmin()
│   └── seedAdmin.js               ← Tự động tạo tài khoản admin@lifeplanner.com khi khởi server
│
├── Controller/api/                 ← Business logic (12 controllers)
│   ├── authController.js          ← Đăng ký, đăng nhập, profile, đổi mật khẩu
│   ├── suKienController.js        ← Sự kiện lịch (CRUD + lặp ngày/tuần/tháng)
│   ├── monHocController.js        ← Môn học, GPA, bài tập, danh sách gia sư
│   ├── duAnController.js          ← Dự án, công việc, ca làm part-time + lương
│   ├── tapLuyenController.js      ← Giáo án PPL 7 ngày, Share Code, community
│   ├── chatTapLuyenController.js  ← Chat cộng đồng gymmer + reactions
│   ├── banBeController.js         ← Kết bạn, lời mời, unfriend
│   ├── tinNhanRiengController.js  ← Chat 1-1, đếm unread, trigger Web Push
│   ├── chuyenGiaController.js     ← Nộp/hủy hồ sơ gia sư/PT
│   ├── adminController.js         ← KPI, duyệt hồ sơ, ban user, broadcast
│   ├── dashboardController.js     ← Tổng hợp dữ liệu trang chủ
│   └── pushNotificationController.js ← VAPID subscribe, Daily Briefing config
│
├── Middleware/
│   ├── authMiddleware.js          ← Xác thực Bearer JWT + chặn banned
│   ├── roleMiddleware.js          ← RBAC: checkRole('admin') / checkRole('tutor','pt')
│   └── errorMiddleware.js        ← notFound (404) + errorHandler toàn cục
│
├── Model/                         ← 22 Mongoose Schemas
│   ├── User.js
│   ├── SuKien.js
│   ├── MonHoc.js / LichHoc.js / BaiTap.js / GiaSu.js
│   ├── DuAn.js / CongViec.js / CaLamViec.js
│   ├── KeHoachTapLuyen.js / BuoiTap.js / ChiTietBuoiTap.js
│   ├── BaiTapTheChat.js / LichSuTapLuyen.js / HuanLuyenVien.js
│   ├── BanBe.js / TinNhanRieng.js / TinNhanTapLuyen.js
│   ├── DangKyChuyenGia.js
│   ├── ThongBao.js / PushSubscription.js / MucTieu.js
│   └── (tổng 22 models)
│
├── Router/                        ← 12 Express routers
│   ├── authRouter.js              → /api/auth
│   ├── suKienRouter.js            → /api/su-kien
│   ├── monHocRouter.js            → /api (mon-hoc, bai-tap, gia-su, bao-cao-hoc-tap)
│   ├── duAnRouter.js              → /api (du-an, cong-viec, ca-lam-viec)
│   ├── tapLuyenRouter.js          → /api/tap-luyen
│   ├── chatTapLuyenRouter.js      → /api/chat-tap-luyen
│   ├── banBeRouter.js             → /api/ban-be
│   ├── tinNhanRiengRouter.js      → /api/tin-nhan-rieng
│   ├── chuyenGiaRouter.js         → /api/chuyen-gia
│   ├── adminRouter.js             → /api/admin
│   ├── dashboardRouter.js         → /api (dashboard, thong-bao)
│   └── pushRouter.js              → /api/push
│
├── Utils/
│   ├── pushService.js             ← Hàm sendPushToUser(userId, payload) dùng web-push
│   ├── dailyBriefingScheduler.js  ← setInterval mỗi 60s, gửi tóm tắt lịch buổi sáng
│   └── syncExpertUsers.js         ← Đồng bộ tài khoản gia sư/PT khi server khởi động
│
├── Public/                        ← File tĩnh: avatar, chứng chỉ upload
│
├── client/                        ← React 19 + Vite Frontend
│   ├── src/
│   │   ├── App.jsx                ← Router chính, guard route admin
│   │   ├── main.jsx               ← Entry point React
│   │   ├── context/AuthContext.jsx← State toàn cục: user, token, role
│   │   ├── services/api.js        ← Axios instance với baseURL và interceptor token
│   │   ├── services/pushNotificationClient.js ← Logic đăng ký Web Push
│   │   ├── views/                 ← 8 màn hình chính
│   │   │   ├── CalendarView.jsx   ← Xem lịch tháng/tuần/ngày
│   │   │   ├── StudyGpaView.jsx   ← Môn học, GPA, bài tập deadline
│   │   │   ├── ProjectsView.jsx   ← Dự án, công việc, ca part-time
│   │   │   ├── WorkoutView.jsx    ← Giáo án PPL, tập luyện
│   │   │   ├── MessagesView.jsx   ← Chat 1-1 kiểu Messenger
│   │   │   ├── TutorView.jsx      ← Danh sách gia sư/PT
│   │   │   ├── ProfileView.jsx    ← Hồ sơ cá nhân, cài đặt
│   │   │   ├── AdminDashboardView.jsx ← Trang quản trị
│   │   │   └── AdminLoginView.jsx
│   │   └── components/            ← 14 components tái sử dụng
│   │       ├── WorkoutCommunityChat.jsx ← Floating chat cộng đồng
│   │       ├── DangKyChuyenGiaModal.jsx ← Form nộp hồ sơ gia sư/PT
│   │       ├── PwaInstallPrompt.jsx     ← Prompt cài đặt PWA
│   │       ├── NotificationWatcher.jsx  ← Polling thông báo real-time
│   │       └── ...
│   └── public/
│       ├── sw.js                  ← Service Worker: nhận push, điều hướng click
│       └── push-handler.js        ← Xử lý self.addEventListener("push")
│
├── scripts/
│   ├── cleanup_sample_data.js     ← Dọn dẹp dữ liệu mẫu trong DB
│   └── inspect_data.js            ← Kiểm tra dữ liệu trong DB
│
└── life_planner_DB/               ← Backup/export dữ liệu MongoDB local
```

---

## 4. BIẾN MÔI TRƯỜNG (.env)

```env
MONGO_URI=mongodb://localhost:27017/life_planner_DB
# hoặc MongoDB Atlas: mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/life_planner

JWT_SECRET=life_planner_secret_key_2026

VAPID_PUBLIC_KEY=BPzDQMMjP6YHh_C1jnypACZdF3PqWVb5qlwobOK0dnY-aFieR-g5bfeZpZvHXY6iu7tfV1Xy3znfo7tEsz2Gzwg
VAPID_PRIVATE_KEY=sjRrETYsNAw928TrHvCsIYAvCxZokevwxojeMu2DPOE
VAPID_EMAIL=mailto:support@lifeplanner.com

# Tùy chọn — tài khoản admin mặc định
ADMIN_DEFAULT_EMAIL=admin@lifeplanner.com
ADMIN_DEFAULT_PASSWORD=admin123456

PORT=5000
```

---

## 5. NPM SCRIPTS

```bash
npm run dev       # Chạy đồng thời: nodemon server + Vite client + ngrok tunnel
npm run server    # Chỉ chạy backend (nodemon server.js)
npm run client    # Chỉ chạy frontend (Vite dev)
npm start         # Production: node server.js (client phải đã build)
npm run build     # Build React client vào client/dist/
npm run prod      # Build + Start (dùng khi deploy)
```

> **Ngrok tunnel:** `npm run tunnel` → dùng URL cố định `spent-problem-relocate.ngrok-free.dev` để test Web Push trên điện thoại thật (HTTPS bắt buộc cho Service Worker).

---

## 6. LUỒNG REQUEST (Request Lifecycle)

```
Client (React / Postman)
    │
    │  Header: "Authorization: Bearer <token>"
    ▼
server.js
    │  cors() → express.json({limit:"25mb"}) → express.urlencoded()
    ▼
authMiddleware.js         ← XÁC THỰC: giải mã JWT, tìm user DB, chặn "banned"
    ▼
roleMiddleware.js          ← PHÂN QUYỀN: checkRole('admin') / checkRole('tutor','pt')  [chỉ khi cần]
    ▼
Router → Controller
    │  Validate input → Business logic → Gọi Mongoose Model
    ▼
MongoDB ←→ Mongoose Model
    ▼
JSON Response (200/201/400/401/403/404/500)
```

---

## 7. DATABASE SCHEMA (22 Models)

### 7.1 User Schema (Model/User.js)
```js
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (bcrypt hash),
  avatar: String (null),
  theme_mode: enum["light","dark","system"] default "system",
  language: String default "vi",
  notify_events: Boolean default true,
  notify_deadlines: Boolean default true,
  notify_workouts: Boolean default true,
  notify_sound: Boolean default true,
  notify_lead_time: Number default 15,           // phút nhắc trước
  daily_briefing_enabled: Boolean default false,
  daily_briefing_time: String default "07:00",   // HH:mm
  daily_briefing_last_sent: String default null, // YYYY-MM-DD
  workout_default_initialized: Boolean default false,
  role: enum["user","tutor","gia_su","pt","admin"] default "user",
  status: enum["active","banned"] default "active",
  phone: String,
  bio: String,
  is_expert_verified: Boolean default false,
  timestamps: true
}
```

### 7.2 Quan hệ giữa các Models
```
[User]
  ├── 1:N → [SuKien]             (Hub lịch trình trung tâm)
  ├── 1:N → [MonHoc]
  │           ├── 1:N → [LichHoc]
  │           └── 1:N → [BaiTap]  (auto tạo SuKien loại "deadline")
  ├── 1:N → [DuAn]
  │           ├── 1:N → [CongViec]
  │           └── 1:N → [CaLamViec] (auto tạo SuKien loại "cong-viec")
  ├── 1:N → [KeHoachTapLuyen]
  │           └── 1:N → [BuoiTap]
  │                       └── 1:N → [ChiTietBuoiTap] → ref [BaiTapTheChat]
  ├── 1:N → [LichSuTapLuyen]
  ├── 1:N → [DangKyChuyenGia]    (đơn xin làm gia sư/PT)
  ├── 1:1 → [GiaSu] / [HuanLuyenVien]  (hồ sơ công khai sau khi duyệt)
  ├── N:N → [BanBe]
  ├── 1:N → [TinNhanRieng]
  ├── 1:N → [TinNhanTapLuyen]    (chat cộng đồng + reactions)
  ├── 1:N → [PushSubscription]
  ├── 1:N → [ThongBao]
  └── 1:N → [MucTieu]
```

### 7.3 SuKien (Calendar Hub)
Bảng **trung tâm** — tất cả loại lịch trình đều ghi vào đây:
- `loai_su_kien`: `"hoc-tap"` | `"tap-luyen"` | `"deadline"` | `"cong-viec"` | `"ca-nhan"`
- `quy_tac_lap`: `"once"` | `"daily"` | `"weekly"` | `"monthly"` | `"yearly"`
- `nhom_lap_id`: string dùng để nhóm chuỗi sự kiện lặp (VD: `"monhoc_<id>"`, `"repeat_<timestamp>_<random>"`)
- `is_deleted`: Boolean (soft delete)
- Frontend chỉ cần gọi **1 API** `GET /api/su-kien` để hiển thị toàn bộ Calendar

---

## 8. TOÀN BỘ API ENDPOINTS

### 8.1 Auth — `/api/auth`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Đăng ký (bcrypt + JWT) |
| POST | `/api/auth/login` | Public | Đăng nhập |
| POST | `/api/auth/admin-login` | Public | Đăng nhập riêng cho admin |
| GET | `/api/auth/me` | User | Lấy thông tin cá nhân |
| PUT | `/api/auth/me` | User | Cập nhật profile, theme, cài đặt thông báo |
| PUT | `/api/auth/me/password` | User | Đổi mật khẩu (verify mật khẩu cũ) |

### 8.2 Sự kiện — `/api/su-kien`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/su-kien` | User | Lấy sự kiện (filter: start_date, end_date, loai_su_kien) |
| POST | `/api/su-kien` | User | Tạo sự kiện (hỗ trợ quy tắc lặp: once, daily, weekly, monthly, yearly cùng cấu hình số lần lặp linh hoạt `so_lan_lap`, safe-clamp ngày cuối tháng và năm nhuận) |
| PUT | `/api/su-kien/:id` | User | Sửa sự kiện: `update_mode=single` (tách riêng thành sự kiện độc lập) hoặc `update_mode=all` (tính timeShift dịch chuyển cả chuỗi lặp hoặc tái tạo chuỗi khi đổi quy tắc) |
| DELETE | `/api/su-kien/:id` | User | Xóa soft (delete_mode: "single" xóa 1 buổi hoặc "all" xóa cả chuỗi) |

### 8.3 Học tập — `/api`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/mon-hoc` | User | Danh sách môn học |
| POST | `/api/mon-hoc` | User | Tạo môn học → **auto sinh lịch học vào SuKien** |
| PUT | `/api/mon-hoc/:id` | User | Cập nhật môn học |
| DELETE | `/api/mon-hoc/:id` | User | Xóa + dọn SuKien liên quan |
| GET | `/api/bao-cao-hoc-tap` | User | **Tính GPA hệ 4 & hệ 10, xếp loại học lực** |
| GET | `/api/bai-tap` | User | Danh sách bài tập |
| POST | `/api/bai-tap` | User | Tạo bài tập → **auto tạo SuKien loại "deadline"** |
| PUT | `/api/bai-tap/:id` | User | Cập nhật (trạng thái + deadline) + sync SuKien |
| DELETE | `/api/bai-tap/:id` | User | Xóa + xóa SuKien deadline |
| GET | `/api/gia-su` | Public | Danh sách gia sư (filter: tên, môn, giá, rating) |

### 8.4 Dự án & Part-time — `/api`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET/POST | `/api/du-an` | User | Danh sách / Tạo dự án |
| PUT/DELETE | `/api/du-an/:id` | User | Sửa (re-tính lương ca) / Xóa cascade |
| GET/POST | `/api/cong-viec` | User | Công việc (tasks) |
| PUT/DELETE | `/api/cong-viec/:id` | User | Cập nhật status / Xóa |
| GET | `/api/ca-lam-viec` | User | Ca làm việc + tổng lương dự kiến |
| POST | `/api/ca-lam-viec` | User | Tạo ca → **auto tính lương + sync SuKien** |
| POST | `/api/ca-lam-viec/bulk` | User | **Tạo hàng loạt ca theo tuần/tháng** |
| PUT/DELETE | `/api/ca-lam-viec/:id` | User | Sửa / Xóa + dọn SuKien |

### 8.5 Tập luyện — `/api/tap-luyen`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/tap-luyen/schedule` | User | Lịch 7 ngày giáo án đang active |
| POST | `/api/tap-luyen/hoan-thanh` | User | Lưu lịch sử hoàn thành buổi tập |
| GET | `/api/tap-luyen/report` | User | Thống kê: số buổi, streak, phân bổ cơ bắp |
| GET/POST | `/api/tap-luyen/plans` | User | Danh sách / Tạo kế hoạch tập |
| PUT/DELETE | `/api/tap-luyen/plans/:id` | User | Sửa / Xóa kế hoạch |
| PATCH | `/api/tap-luyen/plans/:id/activate` | User | Kích hoạt giáo án |
| POST | `/api/tap-luyen/plans/:id/dong-bo-lich` | User | Sync buổi tập vào Calendar |
| POST | `/api/tap-luyen/plans/:id/share-code` | User | **Sinh Share Code (VD: PLAN-K8J2Q9)** |
| GET | `/api/tap-luyen/community/preview/:code` | User | Xem trước giáo án từ share code |
| POST | `/api/tap-luyen/community/import` | User | **Clone giáo án về tài khoản** |
| GET | `/api/tap-luyen/community/explore` | User | Khám phá giáo án cộng đồng |
| POST | `/api/tap-luyen/community/:id/like` | User | Like/unlike giáo án |
| PUT | `/api/tap-luyen/buoi-tap/:id` | User | Sửa buổi tập / đánh dấu nghỉ |
| POST | `/api/tap-luyen/buoi-tap/:id/exercises` | User | Thêm bài tập vào buổi |
| PUT/DELETE | `/api/tap-luyen/chi-tiet/:id` | User | Sửa / Xóa bài tập trong buổi |
| GET | `/api/tap-luyen/exercises` | User | Danh mục bài tập thể chất chuẩn |

### 8.6 Chat Cộng đồng — `/api/chat-tap-luyen`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/chat-tap-luyen` | User | 60 tin nhắn mới nhất |
| POST | `/api/chat-tap-luyen` | User | Gửi tin nhắn |
| POST | `/api/chat-tap-luyen/:id/react` | User | Reaction emoji (toggle) |
| DELETE | `/api/chat-tap-luyen/:id` | User | Xóa tin của mình |

### 8.7 Bạn bè — `/api/ban-be`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/ban-be` | User | Danh sách bạn bè (accepted) |
| GET | `/api/ban-be/loi-moi` | User | Lời mời đến & đi |
| GET | `/api/ban-be/tim-kiem` | User | Tìm kiếm user |
| POST | `/api/ban-be/loi-moi` | User | Gửi lời mời kết bạn |
| PATCH | `/api/ban-be/loi-moi/:id/chap-nhan` | User | Chấp nhận lời mời |
| DELETE | `/api/ban-be/loi-moi/:id` | User | Từ chối / Hủy lời mời |
| DELETE | `/api/ban-be/:friendUserId` | User | Unfriend |

### 8.8 Tin nhắn 1-1 — `/api/tin-nhan-rieng`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/tin-nhan-rieng/hoi-thoai` | User | Danh sách hội thoại + unread count |
| GET | `/api/tin-nhan-rieng/chua-doc/count` | User | Tổng tin chưa đọc |
| GET | `/api/tin-nhan-rieng/user/:partnerId` | User | Lịch sử chat + tự động đánh dấu đã đọc |
| POST | `/api/tin-nhan-rieng` | User | Gửi tin → **trigger Web Push tới người nhận** |
| DELETE | `/api/tin-nhan-rieng/:id` | User | Xóa tin nhắn của mình |

### 8.9 Chuyên gia — `/api/chuyen-gia`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/chuyen-gia/dang-ky` | User | Nộp hồ sơ gia sư/PT |
| GET | `/api/chuyen-gia/trang-thai-ho-so` | User | Xem trạng thái hồ sơ (pending/approved/rejected) |
| DELETE | `/api/chuyen-gia/huy-ho-so/:id` | User | Hủy hồ sơ pending |
| GET | `/api/chuyen-gia/pt` | Public | Danh sách PT công khai đã thẩm định |

### 8.10 Admin — `/api/admin` *(yêu cầu role: admin)*
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/thong-ke` | KPI toàn hệ thống (users, gia sư, biểu đồ 7 ngày) |
| GET | `/api/admin/ho-so` | Hồ sơ chuyên gia cần duyệt |
| POST | `/api/admin/duyet-ho-so/:id` | **Duyệt → auto đổi role + tạo profile công khai + push thông báo** |
| POST | `/api/admin/tu-choi-ho-so/:id` | Từ chối hồ sơ kèm lý do |
| GET | `/api/admin/users` | Danh sách users (search, phân trang, filter role) |
| PUT | `/api/admin/users/:id` | Đổi role / Khóa-Mở tài khoản |
| POST | `/api/admin/notifications/broadcast` | Broadcast thông báo (all/students/tutors/pts/single) |
| GET | `/api/admin/notifications/history` | Lịch sử broadcast |

### 8.11 Dashboard & Thông báo — `/api`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/dashboard` | User | Tổng hợp trang chủ: sự kiện hôm nay, deadline, mục tiêu |
| GET | `/api/thong-bao` | User | Danh sách thông báo nội bộ |
| PATCH | `/api/thong-bao/:id/read` | User | Đánh dấu đã đọc |
| PATCH | `/api/thong-bao/read-all` | User | Đánh dấu tất cả đã đọc |
| DELETE | `/api/thong-bao/:id` | User | Xóa thông báo |

### 8.12 Web Push & Daily Briefing — `/api/push`
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/push/public-key` | Public | Lấy VAPID Public Key |
| POST | `/api/push/subscribe` | User | Đăng ký nhận push (lưu endpoint + auth keys) |
| POST | `/api/push/unsubscribe` | User | Hủy đăng ký push |
| POST | `/api/push/test` | User | Gửi test push tới thiết bị |
| GET | `/api/push/daily-briefing` | User | Lấy cài đặt Daily Briefing |
| PUT | `/api/push/daily-briefing` | User | Cập nhật giờ nhận Daily Briefing |
| POST | `/api/push/daily-briefing/test` | User | Test gửi tóm tắt lịch hôm nay |

---

## 9. LUỒNG NGHIỆP VỤ ĐẶC THÙ

### 9.1 Calendar Hub Auto-Sync
Bảng `SuKien` là **Hub trung tâm** — tất cả module đều ghi vào đây:
- Tạo **Môn học** → sinh hàng loạt `SuKien` loại `"hoc-tap"` với `nhom_lap_id: "monhoc_<id>"`
- Tạo **Bài tập** → sinh 1 `SuKien` loại `"deadline"` với `bai_tap_id`
- Tạo **Ca làm việc** → tính lương tự động + sinh `SuKien` loại `"cong-viec"`
- Frontend chỉ cần **1 call** `GET /api/su-kien` để render toàn bộ Calendar

#### Cơ chế Quy tắc Lặp (Recurrence Rules) trong SuKien:
- **Tách bạch Thời gian trong ngày & Giới hạn chuỗi ngày lặp trên UI:**
  - **Khóa cố định Ngày bắt đầu:** Không cho người dùng sửa Ngày bắt đầu (`ngay_bat_dau`). Ngày bắt đầu được hệ thống tự động khóa và neo cứng theo đúng ngày người dùng đã click chọn trên giao diện lịch.
  - **Chỉ cho phép setup Ngày kết thúc:** Người dùng có toàn quyền thiết lập Ngày kết thúc (`ngay_ket_thuc`).
    + Khi chọn quy tắc lặp (`daily`, `weekly`, `monthly`, `yearly`), hệ thống hiện ô nhập số chu kỳ lặp (`Số ngày`, `Số tuần`, `Số tháng`, `Số năm`) và tự động tính ra Ngày kết thúc tương ứng.
    + Người dùng có thể tự do bấm chọn/thay đổi Ngày kết thúc trực tiếp trên ô chọn ngày (`type="date"`). Hệ thống sẽ tự động cập nhật số chu kỳ lặp tương ứng.
  - **Thời gian bắt đầu & Thời gian kết thúc của sự kiện trong ngày:**
    + Sử dụng các trường chọn giờ (`type="time"`) riêng biệt: **Giờ bắt đầu** (`gio_bat_dau`) và **Giờ kết thúc** (`gio_ket_thuc`) thể hiện khung giờ sự kiện diễn ra trong ngày (ví dụ: `09:00 - 10:30`), chứ KHÔNG PHẢI là ngày bắt đầu và ngày kết thúc của cả chuỗi lặp.
    + Với loại sự kiện `deadline`, hiển thị **Giờ hạn chót Deadline** (`type="time"`).
- **Phát hiện và Cảnh báo Trùng lịch Thời gian thực (Schedule Conflict Detection):**
  - Trong quá trình người dùng thiết lập lịch (chọn giờ, chọn ngày, đổi quy tắc lặp), hệ thống tự động tính toán toàn bộ các buổi dự kiến sinh ra và đối chiếu theo thời gian thực (`useMemo`) với danh sách sự kiện hiện có của người dùng.
  - **Cảnh báo trực quan trong Modal:** Nếu phát hiện khung giờ bị trùng lấn (`session.start < evtEnd && session.end > evtStart`), giao diện lập tức hiển thị huy hiệu `⚠️ Trùng giờ` cạnh trường nhập thời gian và một banner cảnh báo màu vàng nổi bật liệt kê chi tiết các sự kiện bị trùng (tên sự kiện, ngày tháng, khung giờ trùng lặp).
  - **Xác nhận khi Lưu:** Khi người dùng bấm Tạo/Lưu sự kiện, nếu có xung đột trùng lịch, hệ thống sẽ bật hộp thoại xác nhận chi tiết để người dùng có thể chọn quay lại điều chỉnh giờ hoặc tiếp tục lưu nếu có chủ đích.
- **Tạo sự kiện lặp (`createSuKien`):**
  - Hỗ trợ 5 quy tắc: `once`, `daily`, `weekly`, `monthly`, `yearly`.
  - Nhận tham số `ngay_ket_thuc_lap` làm mốc cutoff chuỗi lặp, trong khi `thoi_gian_bat_dau` và `thoi_gian_ket_thuc` xác định khung giờ chuẩn xác trong ngày (`sessionDurationMs = endDate - startDate`). Mỗi sự kiện sinh ra trong DB đều có thời gian bắt đầu và kết thúc nằm gọn trong ngày đó.
  - Nhận tham số `so_lan_lap` từ client để linh hoạt giới hạn vòng lặp `maxIterations` theo đúng mong muốn của người dùng.
  - Thuật toán **Safe Clamping**:
    + Hàng tháng (`monthly`): Tự động lấy `Math.min(origDate, lastDayOfTargetMonth)` để tránh tràn ngày cuối tháng sang tháng sau (ví dụ ngày 31/01 lặp sang tháng 2 sẽ rơi chuẩn xác vào ngày 28/02).
    + Hàng năm (`yearly`): Tự động bảo vệ năm nhuận (ngày 29/02 ở năm thường sẽ rơi an toàn vào ngày 28/02).
- **Cập nhật chuỗi lặp (`updateSuKien`):**
  - **Mở quyền chỉnh sửa Quy tắc lặp & Số chu kỳ khi Edit:** Cho phép người dùng chỉnh sửa trực tiếp dropdown `Quy tắc lặp lại`, số chu kỳ lặp và ngày kết thúc ngay tại modal Chỉnh sửa sự kiện.
  - **Khi chọn `update_mode === "all"`:** 
    + Nếu đổi quy tắc lặp thành `once`: Hủy chuỗi lặp, xóa mềm các buổi khác và giữ lại sự kiện hiện tại làm sự kiện đơn lẻ.
    + Nếu đổi sang quy tắc lặp khác (ví dụ: `weekly` sang `daily` hoặc `yearly`): Xóa mềm chuỗi cũ và tự động tái tạo chuỗi sự kiện mới theo chu kỳ và số lần lặp vừa cấu hình.
    + Nếu giữ nguyên quy tắc lặp: Tính độ lệch thời gian `timeShift = newStartMs - oldStartMs` và `newDuration = newEndMs - newStartMs`, sau đó cập nhật bulk cho tất cả sự kiện trong chuỗi (`nhom_lap_id`) cả thông tin nội dung lẫn dịch chuyển ngày giờ chính xác.
  - **Khi chọn `update_mode === "single"`:** Tách riêng sự kiện đó ra khỏi nhóm lặp cũ (`nhom_lap_id = null`), cập nhật theo quy tắc lặp mới được chọn, đảm bảo sự kiện độc lập không bị ghi đè hay xóa nhầm bởi các thao tác sửa/xóa cả chuỗi sau này.
  - **Chuyển từ đơn lẻ thành chuỗi lặp:** Tự động gán `nhom_lap_id` mới và sinh các sự kiện tiếp theo tương ứng.
- **Xóa sự kiện lặp (`deleteSuKien`):**
  - Hỗ trợ `delete_mode = "single"` (chỉ soft delete 1 buổi) hoặc `delete_mode = "all"` (soft delete toàn bộ `nhom_lap_id`).

### 9.2 Luồng Thẩm định Chuyên gia (Gia sư / PT)
```
User POST /api/chuyen-gia/dang-ky  →  DangKyChuyenGia {trang_thai: "pending"}
           ↓
Admin GET /api/admin/ho-so  →  Xem xét hồ sơ bằng cấp
           ↓
Admin POST /api/admin/duyet-ho-so/:id
    → DangKyChuyenGia.trang_thai = "approved"
    → User.role = "tutor" | "pt"
    → User.is_expert_verified = true
    → Tạo GiaSu {} hoặc HuanLuyenVien {} (hồ sơ công khai)
    → Tạo ThongBao (nội bộ)
    → sendPushToUser() (Web Push ra màn hình khóa điện thoại)
```

### 9.3 Chat: HTTP Short-Polling (không dùng WebSocket)
- **Lý do:** Ổn định hơn trên cloud free tier (Render, Vercel serverless ngắt WS sau 30-60s)
- Chat 1-1: Client poll `GET /api/tin-nhan-rieng/user/:id` mỗi **3.0 giây**
- Chat Cộng đồng: Client poll `GET /api/chat-tap-luyen` mỗi **3.5 giây** (chỉ khi cửa sổ đang mở)
- **Định hướng tương lai:** Nâng cấp lên Socket.IO (< 50ms latency, typing indicator)

### 9.4 Daily Briefing Scheduler
```js
// Utils/dailyBriefingScheduler.js
setInterval(async () => {
  const nowVN = getCurrentTimeVN(); // múi giờ Asia/Ho_Chi_Minh
  const users = await User.find({
    daily_briefing_enabled: true,
    daily_briefing_time: nowVN,        // "HH:mm"
    daily_briefing_last_sent: { $ne: todayStr }  // chống gửi 2 lần
  });
  // Quét SuKien trong ngày → format thông điệp → sendPushToUser()
  // Ghi daily_briefing_last_sent = todayStr
}, 60_000); // mỗi 60 giây
```

### 9.5 PWA Web Push (VAPID)
```
Trình duyệt xin quyền Notification
    → navigator.serviceWorker.register('sw.js')
    → pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC_KEY })
    → POST /api/push/subscribe  (lưu {endpoint, keys.p256dh, keys.auth})
    
Khi cần gửi thông báo:
    → Utils/pushService.js: webpush.sendNotification(subscription, payload)
    → Service Worker (sw.js): self.addEventListener("push") → showNotification()
    → Người dùng click thông báo → notificationclick → mở đúng trang đích
```

### 9.6 Workout Share Code
```
User A: POST /api/tap-luyen/plans/:id/share-code  →  { share_code: "PLAN-K8J2Q9" }
User B: GET  /api/tap-luyen/community/preview/PLAN-K8J2Q9  →  xem trước
User B: POST /api/tap-luyen/community/import  →  clone toàn bộ KeHoachTapLuyen + BuoiTap + ChiTietBuoiTap
```

---

## 10. BẢO MẬT & PHÂN QUYỀN

### 10.1 RBAC — 4 Vai trò
| Role | Quyền |
|---|---|
| `user` | Toàn bộ tính năng cá nhân: lịch, GPA, dự án, tập gym, chat, kết bạn, nộp hồ sơ chuyên gia |
| `tutor` | = `user` + huy hiệu 🎓 Gia sư Xác thực + hiển thị trong danh bạ gia sư |
| `pt` | = `user` + huy hiệu 🏋️ HLV PT Xác thực + hiển thị trong danh bạ PT |
| `admin` | Toàn quyền hệ thống: KPI, duyệt hồ sơ, ban user, broadcast, xem full data user |

### 10.2 Xử lý tài khoản Banned
- `authMiddleware` → trả `403 Forbidden` với mọi request
- Toàn bộ hồ sơ, tin nhắn, giáo án, kết quả tìm kiếm của user bị banned bị **ẩn** khỏi hệ thống
- Chỉ Admin có thể xem full data qua `GET /api/admin/users/:id/full-data`

### 10.3 Mã hóa & Token
- Mật khẩu: `bcrypt.hash(password, 10)` — không bao giờ lưu plaintext
- JWT: `{ id: userId }`, ký bằng `JWT_SECRET`, hết hạn `7d`
- Response luôn dùng `.select("-password")` khi trả User object

### 10.4 Global Error Handler (Middleware/errorMiddleware.js)
| Lỗi | HTTP Status |
|---|---|
| Route không tồn tại | 404 Not Found |
| Mongoose CastError (sai ObjectId) | 400 Bad Request |
| Mongoose ValidationError | 400 Bad Request + chi tiết từng trường |
| TokenExpiredError / JsonWebTokenError | 401 Unauthorized |
| Lỗi không xác định | 500 Internal Server Error |

---

## 11. FRONTEND ARCHITECTURE

### Cấu trúc màn hình (client/src/views/)
| View | Route / Hash | Mô tả |
|---|---|---|
| `CalendarView` | `#calendar` | Lịch tháng/tuần/ngày — gọi `/api/su-kien` |
| `StudyGpaView` | `#study` | Môn học, GPA, bài tập deadline |
| `ProjectsView` | `#projects` | Dự án, công việc, ca part-time |
| `WorkoutView` | `#workout` | Giáo án PPL, tập luyện, share code |
| `MessagesView` | `#messages` | Chat 1-1 kiểu Messenger (2 cột) |
| `TutorView` | `#tutors` | Danh sách gia sư/PT công khai |
| `ProfileView` | `#profile` | Hồ sơ, cài đặt, đăng ký chuyên gia |
| `AdminDashboardView` | `#admin` | Trang quản trị (chỉ role admin) |

### State Management
- `AuthContext.jsx` — Context API: lưu `user`, `token`, hàm `login()`, `logout()`
- `localStorage` — lưu JWT token giữa các lần reload
- Axios `api.js` — instance với `baseURL` và `Authorization` header tự động

### Smart Auto-Scroll (MessagesView)
- Chỉ tự cuộn xuống đáy khi `isNearBottom === true`
- Giữ nguyên vị trí khi user đang cuộn lên xem tin cũ

### WorkoutCommunityChat
- Floating popup, có thể mở ở mọi màn hình
- Poll mỗi 3.5s **chỉ khi popup đang mở** (`isOpen === true`) → `clearInterval` khi đóng

---

## 12. KHỞI ĐỘNG DỰ ÁN

### Lần đầu cài đặt
```bash
# 1. Backend
npm install

# 2. Frontend
cd client && npm install && cd ..

# 3. Tạo file .env (xem mục 4 ở trên)

# 4. Chạy development (server + client + ngrok tunnel)
npm run dev
```

### Yêu cầu hệ thống
- MongoDB đang chạy local (port 27017) **hoặc** có MongoDB Atlas connection string
- Node.js v18+
- (Optional) ngrok CLI để tunnel HTTPS cho Web Push test trên điện thoại

### Tài khoản Admin mặc định (tự tạo khi server khởi động)
```
Email:    admin@lifeplanner.com
Password: admin123456
```
> Đăng nhập admin qua `POST /api/auth/admin-login` hoặc màn hình `AdminLoginView`

---

## 13. TRIỂN KHAI (DEPLOYMENT)

### Render.com (Miễn phí)
```
Build Command: npm install && npm run build
Start Command: node server.js
Environment Variables: MONGO_URI, JWT_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
```
- Sau khi deploy: Setup cron-job ping `/` mỗi 10 phút (cron-job.org) để tránh sleep mode
- HTTPS tự động được cấp bởi Render → PWA và Web Push hoạt động bình thường

### VPS (Production)
```bash
# PM2 + Nginx reverse proxy
pm2 start server.js --name lifeplanner --cluster max
pm2 startup && pm2 save
```

---

## 14. QUY ƯỚC CODE

- **Ngôn ngữ:** CommonJS (`require` / `module.exports`), không dùng ES Modules
- **Async:** `async/await` với `try/catch` trong tất cả controllers
- **Response format chuẩn:**
  ```json
  { "success": true/false, "message": "...", "data": {} }
  ```
- **Tên biến:** `snake_case` cho fields MongoDB, `camelCase` cho biến JS
- **Tên file:** PascalCase cho Models (`User.js`), camelCase cho Controllers/Routers
- **Middleware chain:** `authMiddleware` → `roleMiddleware` → Controller
- **Soft delete:** Dùng `is_deleted: true` (không xóa thật) cho `SuKien`
- **Populate:** Dùng `.populate()` để join dữ liệu thay cho JOIN query thủ công

---

## 15. CÁC ĐIỂM CẦN CHÚ Ý KHI PHÁT TRIỂN

> [!IMPORTANT]
> **SuKien là Hub trung tâm.** Khi sửa logic tạo/cập nhật MonHoc, BaiTap, CaLamViec — phải nhớ sync SuKien tương ứng để Calendar không bị lỗi.

> [!IMPORTANT]
> **Daily Briefing Scheduler** chạy `setInterval` trong tiến trình Node.js. Nếu dùng hosting serverless (Vercel Functions), scheduler này sẽ **không hoạt động** vì mỗi request là 1 process riêng. Phải dùng hosting có persistent process (Render Web Service, Railway, VPS).

> [!WARNING]
> **Web Push VAPID keys** đã được hardcode trong `.env` mẫu ở trên. Trong production thực tế phải generate keys mới bằng `npx web-push generate-vapid-keys` và thay thế vào `.env`.

> [!NOTE]
> **Chat sử dụng HTTP Polling** (không phải WebSocket). Nếu muốn nâng cấp lên real-time WebSocket, cần thêm `socket.io` vào `server.js` và refactor `tinNhanRiengController` + `chatTapLuyenController`.

> [!TIP]
> **Khi thêm API mới:** Tạo route trong Router → khai báo hàm xử lý trong Controller → export và mount trong `server.js` (nếu là router mới). Luôn wrap trong `try/catch` và return JSON chuẩn format `{success, message, data}`.

---

*File này được cập nhật ngày **02/11/2026**: Hoàn thiện tính năng Cảnh báo Trùng lịch thời gian thực (Real-time Schedule Conflict Detection): Tự động tính toán các buổi dự kiến (kể cả chuỗi lặp) và phát hiện chồng lấn thời gian với sự kiện đã có; hiển thị huy hiệu `⚠️ Trùng giờ` cùng banner cảnh báo danh sách sự kiện bị trùng chi tiết ngay trên modal setup lịch; bật hộp thoại xác nhận khi bấm Lưu để người dùng quyết định điều chỉnh lại hoặc tiếp tục.*

