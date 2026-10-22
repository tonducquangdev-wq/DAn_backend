# 📚 TÀI LIỆU BÁO CÁO TOÀN DIỆN BACKEND - LIFE PLANNER RESTFUL API

---

## 📑 MỤC LỤC
1. [TỔNG QUAN HỆ THỐNG VÀ CÔNG NGHỆ CỐT LÕI](#1-tổng-quan-hệ-thống-và-công-nghệ-cốt-lõi)
2. [CẤU TRÚC THƯ MỤC DỰ ÁN](#2-cấu-trúc-thư-mục-dự-án)
3. [LUỒNG HOẠT ĐỘNG TỔNG THỂ (REQUEST LIFECYCLE)](#3-luồng-hoạt-động-tổng-thể-request-lifecycle)
4. [CÁC LUỒNG NGHIỆP VỤ ĐẶC THÙ & ĐỒNG BỘ DỮ LIỆU TỰ ĐỘNG](#4-các-luồng-nghiệp-vụ-đặc-thù--đồng-bộ-dữ-liệu-tự-động)
5. [DANH MỤC VÀ ĐẶC TẢ CHI TIẾT CÁC RESTFUL API](#5-danh-mục-và-đặc-tả-chi-tiết-các-restful-api)
   - [5.1. Nhóm Xác thực & Tài khoản (`/api/auth`)](#51-nhóm-xác-thực--tài-khoản-apiauth)
   - [5.2. Nhóm Lịch trình & Sự kiện (`/api/su-kien`)](#52-nhóm-lịch-trình--sự-kiện-apisu-kien)
   - [5.3. Nhóm Học tập, Môn học & Bài tập (`/api`)](#53-nhóm-học-tập-môn-học--bài-tập-api)
   - [5.4. Nhóm Dự án, Công việc & Ca làm Part-time (`/api`)](#54-nhóm-dự-án-công-việc--ca-làm-part-time-api)
   - [5.5. Nhóm Thể hình & Kế hoạch Rèn luyện (`/api/tap-luyen`)](#55-nhóm-thể-hình--kế-hoạch-rèn-luyện-apitap-luyen)
   - [5.6. Nhóm Kênh Chat Rèn luyện Cộng đồng (`/api/chat-tap-luyen`)](#56-nhóm-kênh-chat-rèn-luyện-cộng-đồng-apichat-tap-luyen)
   - [5.7. Nhóm Mạng lưới Bạn bè (`/api/ban-be`)](#57-nhóm-mạng-lưới-bạn-bè-apiban-be)
   - [5.8. Nhóm Nhắn tin riêng 1-1 (`/api/tin-nhan-rieng`)](#58-nhóm-nhắn-tin-riêng-1-1-apitin-nhan-rieng)
   - [5.9. Nhóm Hồ sơ Chuyên gia Gia sư / PT (`/api/chuyen-gia`)](#59-nhóm-hồ-sơ-chuyên-gia-gia-sư--pt-apichuyen-gia)
   - [5.10. Nhóm Quản trị viên Cấp cao (`/api/admin`)](#510-nhóm-quản-trị-viên-cấp-cao-apiadmin)
   - [5.11. Nhóm Dashboard KPI & Thông báo nội bộ (`/api`)](#511-nhóm-dashboard-kpi--thông-báo-nội-bộ-api)
   - [5.12. Nhóm Web Push Notification & Daily Briefing (`/api/push`)](#512-nhóm-web-push-notification--daily-briefing-apipush)
6. [THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA MAPPING)](#6-thiết-kế-cơ-sở-dữ-liệu-database-schema-mapping)
7. [CƠ CHẾ BẢO MẬT & XỬ LÝ LỖI TOÀN CỤC](#7-cơ-chế-bảo-mật--xử-lý-lỗi-toàn-cục)
8. [BỘ CÂU HỎI BẢO VỆ ĐỒ ÁN VÀ PHẢN BIỆN ĂN ĐIỂM CAO](#8-bộ-câu-hỏi-bảo-vệ-đồ-án-và-phản-biện-ăn-điểm-cao)
9. [KẾ HOẠCH TRIỂN KHAI 24/7 VÀ HƯỚNG PHÁT TRIỂN HỆ THỐNG](#9-kế-hoạch-triển-khai-247-và-hướng-phát-triển-hệ-thống)

---

## 1. TỔNG QUAN HỆ THỐNG VÀ CÔNG NGHỆ CỐT LÕI

* **Tên dự án:** **Life Planner RESTful API Server**
* **Mục tiêu:** Xây dựng hệ thống backend cung cấp nền tảng quản lý toàn diện đời sống thường nhật cho sinh viên và người đi làm, bao gồm:
  * Quản lý tiến độ học tập và tính toán GPA tích lũy tự động.
  * Quản lý công việc dự án và theo dõi ca làm việc part-time tính lương theo giờ.
  * Lập giáo án tập gym PPL 7 ngày, chia sẻ giáo án qua mã code và kết nối cộng đồng.
  * Kết nối mạng lưới gia sư & huấn luyện viên cá nhân (PT) có thẩm định hồ sơ.
  * Hệ thống thông báo đẩy chuẩn PWA Web Push (VAPID) và tự động tóm tắt lịch trình buổi sáng (Daily Briefing Scheduler).
* **Công nghệ nền tảng:**
  * **Runtime:** Node.js (v18+)
  * **Web Framework:** Express 5.x
  * **Cơ sở dữ liệu:** MongoDB (NoSQL) thông qua ODM Mongoose 9.x
  * **Mã hóa mật khẩu:** `bcryptjs` (salt rounds 10)
  * **Xác thực:** JSON Web Token (`jsonwebtoken` - hạn 7 ngày)
  * **Kiểm tra dữ liệu đầu vào:** `express-validator`
  * **Thông báo đẩy:** `web-push` (chuẩn VAPID)
  * **Tác vụ ngầm:** Interval Scheduler định kỳ theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh` UTC+7)

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

Hệ thống được thiết kế theo mô hình **MVC nâng cao cho RESTful API** (*Separation of Concerns*):

```text
test_backend/
├── Config/
│   ├── db.js                     # Kết nối MongoDB Atlas / Local và gọi khởi tạo dữ liệu mẫu
│   └── seedAdmin.js              # Tự động tạo tài khoản Quản trị viên (Admin) mặc định khi server khởi chạy
├── Controller/
│   └── api/
│       ├── authController.js           # Xử lý Đăng ký, Đăng nhập, Profile, Đổi mật khẩu
│       ├── suKienController.js         # Quản lý sự kiện lịch, chuỗi sự kiện lặp (lặp ngày, tuần, tháng)
│       ├── monHocController.js         # Môn học, tính GPA tự động, bài tập deadline, danh sách gia sư
│       ├── duAnController.js           # Quản lý dự án, tasks, ca làm việc part-time & tính lương ca
│       ├── tapLuyenController.js       # Giáo án PPL 7 ngày, bài tập thể hình, mã chia sẻ (Share Code)
│       ├── chatTapLuyenController.js   # Kênh chat cộng đồng gymmer, thả cảm xúc reaction
│       ├── banBeController.js          # Kết bạn, lời mời kết bạn, tìm kiếm người dùng
│       ├── tinNhanRiengController.js   # Chat 1-1 giữa học viên với bạn bè/gia sư/PT
│       ├── chuyenGiaController.js      # Người dùng nộp hồ sơ bằng cấp làm Gia sư / PT
│       ├── adminController.js          # Thống kê KPI, duyệt/từ chối hồ sơ chuyên gia, phân quyền, broadcast
│       ├── dashboardController.js      # Tổng hợp chỉ số KPI trang chủ, thông báo nội bộ
│       └── pushNotificationController.js# Quản lý VAPID Push Subscriptions, cấu hình Daily Briefing
├── Middleware/
│   ├── authMiddleware.js         # Giải mã Bearer Token JWT, kiểm tra tài khoản bị khóa (banned)
│   ├── roleMiddleware.js         # Kiểm tra phân quyền truy cập (RBAC: user, tutor, pt, admin)
│   └── errorMiddleware.js        # Bắt lỗi 404 Route và Bộ xử lý lỗi tập trung (Global Error Handler)
├── Model/                        # 22 Mongoose Schemas định nghĩa các bảng dữ liệu
│   ├── User.js                   # Người dùng, phân quyền (role), cài đặt thông báo & daily briefing
│   ├── SuKien.js                 # Lịch trình chung, nhóm lặp (nhom_lap_id)
│   ├── MonHoc.js, LichHoc.js, BaiTap.js, GiaSu.js
│   ├── DuAn.js, CongViec.js, CaLamViec.js
│   ├── KeHoachTapLuyen.js, BuoiTap.js, ChiTietBuoiTap.js, BaiTapTheChat.js, LichSuTapLuyen.js, HuanLuyenVien.js
│   ├── BanBe.js, TinNhanRieng.js, TinNhanTapLuyen.js, DangKyChuyenGia.js
│   └── ThongBao.js, PushSubscription.js, MucTieu.js
├── Router/                       # Khai báo các URL Endpoint tương ứng cho từng controller
│   ├── authRouter.js
│   ├── suKienRouter.js
│   ├── monHocRouter.js
│   ├── duAnRouter.js
│   ├── tapLuyenRouter.js
│   ├── chatTapLuyenRouter.js
│   ├── banBeRouter.js
│   ├── tinNhanRiengRouter.js
│   ├── chuyenGiaRouter.js
│   ├── adminRouter.js
│   ├── dashboardRouter.js
│   └── pushRouter.js
├── Utils/
│   ├── pushService.js            # Khởi tạo VAPID keys và hàm gửi Web Push tới trình duyệt / mobile
│   ├── dailyBriefingScheduler.js # Tác vụ nền chạy chu kỳ mỗi phút quét và gửi tóm tắt lịch trình
│   └── syncExpertUsers.js        # Đồng bộ tạo tài khoản đăng nhập cho các Gia sư và PT
├── Public/                       # Thư mục lưu trữ tĩnh (avatar, chứng chỉ, hình ảnh)
├── server.js                     # Điểm khởi chạy hệ thống (Entry point)
└── package.json
```

---

## 3. LUỒNG HOẠT ĐỘNG TỔNG THỂ (REQUEST LIFECYCLE)

Một yêu cầu (HTTP Request) từ phía Client được xử lý qua chuỗi tuần tự như sau:

```
[1. Client: React Frontend / Postman / Mobile PWA]
      │
      │  Gửi Request kèm Authorization Header: "Bearer <token>"
      ▼
[2. server.js]
      │  - cors(): Cho phép frontend truy cập chéo tên miền
      │  - express.json({ limit: "25mb" }): Parse dữ liệu JSON
      │  - express.urlencoded({ extended: true }): Parse body form
      ▼
[3. authMiddleware.js]
      │  - Kiểm tra Header "Authorization" có dạng "Bearer <token>" hay không
      │  - jwt.verify(token, JWT_SECRET): Giải mã Token và lấy User ID
      │  - User.findById(decoded.id): Kiểm tra tài khoản có tồn tại không
      │  - Kiểm tra user.status === "banned" -> Từ chối 403 nếu bị khóa
      │  - Gán đối tượng user vào req.user và gọi next()
      ▼
[4. roleMiddleware.js] (Chỉ áp dụng với các route nhạy cảm/admin)
      │  - Kiểm tra req.user.role có nằm trong danh sách quyền được cấp phép không
      │  - Ví dụ: checkRole('admin') chặn toàn bộ người dùng thông thường
      ▼
[5. Express Router] (Router chuyên biệt theo tính năng)
      │  - Định tuyến đúng Controller theo HTTP Method & URI Path
      ▼
[6. Controller]
      │  - Kiểm tra tính hợp lệ dữ liệu (Validate data)
      │  - Thực hiện logic nghiệp vụ & tính toán
      ▼
[7. Mongoose Model] <══════> [MongoDB Database]
      │
      ▼
[8. HTTP Response Trả về]
      ├── 200 OK / 201 Created: Dữ liệu JSON thành công
      └── 400 / 401 / 403 / 404 / 500: Thông báo lỗi chuẩn hóa
```

---

## 4. CÁC LUỒNG NGHIỆP VỤ ĐẶC THÙ & ĐỒNG BỘ DỮ LIỆU TỰ ĐỘNG

### 4.1. Luồng Tự Động Hóa Đồng Bộ Lịch (Calendar Hub Auto-Sync)
Hệ thống sử dụng bảng `SuKien` làm **Hub trung tâm** để gom toàn bộ các loại lịch trình về một nơi:
* **Khi tạo Môn học (`POST /api/mon-hoc`):**
  * Hệ thống tính toán các thứ học trong tuần (`ngay_hoc`), giờ học từ ngày bắt đầu đến ngày kết thúc môn học.
  * Tự động sinh hàng loạt bản ghi sự kiện `hoc-tap` lên bảng `SuKien` với `nhom_lap_id: monhoc_<id>`.
  * Khi sửa/xóa môn học, toàn bộ các buổi học trên Lịch được cập nhật hoặc dọn dẹp đồng bộ.
* **Khi tạo Bài tập (`POST /api/bai-tap`):**
  * Tự động sinh 1 sự kiện loại `deadline` lên `SuKien` có liên kết `bai_tap_id`.
  * Trang Lịch sẽ hiển thị đúng giờ hạn nộp bài kèm cảnh báo thời hạn.
* **Khi tạo Ca làm Part-time (`POST /api/ca-lam-viec`):**
  * Tự động tính số giờ làm (`so_gio_lam`) và tiền lương ca (`so_gio_lam * luong_theo_gio`).
  * Đồng bộ ca làm việc lên `SuKien` loại `cong-viec`.
* **Lợi ích kiến trúc:** Frontend chỉ cần gọi đúng **1 API duy nhất** (`GET /api/su-kien`) là hiển thị đầy đủ mọi hoạt động của người dùng (học tập, làm việc, deadline, rèn luyện) trên Calendar dạng Tháng/Tuần/Ngày.

### 4.2. Luồng Cấp Kế Hoạch Tập Gym & Chia Sẻ Giáo Án (PPL 7 Ngày & Share Code)
* **Khởi tạo tự động (Seed & Auto-init):** Khi người dùng lần đầu truy cập trang tập luyện, hệ thống tự động kiểm tra cờ `workout_default_initialized`. Nếu chưa có giáo án, hệ thống tự động nạp danh mục bài tập mẫu (Bench Press, Squat, Deadlift, Pull-up...) và tạo sẵn **Giáo án Tăng cơ Toàn diện PPL 7 ngày** (Push - Pull - Legs - Nghỉ).
* **Cơ chế Share Code:**
  * Người dùng bấm nút "Chia sẻ" -> Controller sinh mã chia sẻ độc nhất (VD: `PLAN-K8J2Q9`).
  * Người khác nhập mã code này -> Gọi `GET /api/tap-luyen/community/preview/:code` để xem trước các buổi tập.
  * Bấm "Lưu vào máy" -> Gọi `POST /api/tap-luyen/community/import` để clone toàn bộ kế hoạch, buổi tập và bài tập chi tiết về tài khoản của mình.

### 4.3. Luồng Thẩm Định Hồ Sơ Chuyên Gia (Gia sư / PT)
1. **Nộp hồ sơ:** Người dùng gửi thông tin chuyên môn, mức giá theo giờ, bằng cấp/chứng chỉ tại `POST /api/chuyen-gia/dang-ky` (trạng thái: `pending`).
2. **Xét duyệt:** Quản trị viên vào Cổng Admin (`GET /api/admin/ho-so`) xem xét hồ sơ bằng cấp.
3. **Phê duyệt tự động:**
   * Khi Admin duyệt (`POST /api/admin/duyet-ho-so/:id`):
     * Cập nhật `User.role` thành `'tutor'` hoặc `'pt'`.
     * Bật cờ `User.is_expert_verified = true`.
     * Tự động tạo hồ sơ hiển thị công khai trên danh mục Gia sư (`GiaSu`) hoặc HLV (`HuanLuyenVien`).
     * Tự động gửi thông báo nội bộ và bắn Web Push chúc mừng đến điện thoại người dùng.

### 4.4. Luồng Tác Vụ Ngầm Gửi Tóm Tắt Lịch Trình (Daily Briefing Scheduler)
* File [`dailyBriefingScheduler.js`](file:///d:/laragon/laragon/www/test_backend/Utils/dailyBriefingScheduler.js) kích hoạt vòng lặp `setInterval` mỗi 60 giây.
* Lấy giờ hiện tại theo định dạng `HH:mm` múi giờ Việt Nam (`Asia/Ho_Chi_Minh`).
* Truy vấn người dùng có `daily_briefing_enabled: true`, `daily_briefing_time` trùng với giờ hiện tại và `daily_briefing_last_sent !== dateStr`.
* Quét toàn bộ sự kiện trong ngày của người dùng, định dạng thông điệp đẩy và gửi qua Web Push trực tiếp tới thiết bị. Đánh dấu `daily_briefing_last_sent` để đảm bảo không gửi trùng lặp.

---

## 5. DANH MỤC VÀ ĐẶC TẢ CHI TIẾT CÁC RESTFUL API

### 5.1. Nhóm Xác thực & Tài khoản (`/api/auth`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản (họ tên, email, mật khẩu >= 6 ký tự). Mã hóa bcrypt và trả về JWT Token. |
| `POST` | `/api/auth/login` | Public | Đăng nhập tài khoản. Trả về thông tin user và JWT Token 7 ngày. |
| `POST` | `/api/auth/admin-login` | Public | Đăng nhập dành riêng cho Admin (kiểm tra nghiêm ngặt `user.role === 'admin'`). |
| `GET` | `/api/auth/me` | User | Lấy thông tin cá nhân hiện tại từ Bearer Token. |
| `PUT` | `/api/auth/me` | User | Cập nhật thông tin cá nhân, theme (light/dark/system), ngôn ngữ, cấu hình chuông thông báo. |
| `PUT` | `/api/auth/me/password` | User | Đổi mật khẩu tài khoản (xác minh mật khẩu cũ trước khi cập nhật mật khẩu mới). |

### 5.2. Nhóm Lịch trình & Sự kiện (`/api/su-kien`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/su-kien` | User | Lấy danh sách sự kiện lọc theo `start_date`, `end_date`, và `loai_su_kien` (`hoc-tap`, `tap-luyen`, `deadline`, `cong-viec`, `ca-nhan`). |
| `POST` | `/api/su-kien` | User | Tạo sự kiện mới. Hỗ trợ tạo chuỗi lặp tự động (`once`, `daily`, `weekly`, `monthly`) với `nhom_lap_id`. |
| `PUT` | `/api/su-kien/:id` | User | Cập nhật sự kiện. Hỗ trợ tham số `update_mode=single` (sửa 1 buổi) hoặc `update_mode=all` (sửa toàn bộ chuỗi lặp). |
| `DELETE` | `/api/su-kien/:id` | User | Xóa sự kiện (Soft-delete: `is_deleted = true`). Hỗ trợ `delete_mode=all` xóa toàn bộ chuỗi lặp. |

### 5.3. Nhóm Học tập, Môn học & Bài tập (`/api`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mon-hoc` | User | Lấy danh sách môn học của người dùng. |
| `POST` | `/api/mon-hoc` | User | Tạo môn học mới; **tự động sinh lịch học định kỳ và đưa vào bảng Sự kiện Lịch**. |
| `PUT` | `/api/mon-hoc/:id` | User | Cập nhật thông tin môn học (giảng viên, phòng học, điểm số, tiến độ hoàn thành). |
| `DELETE` | `/api/mon-hoc/:id` | User | Xóa môn học và đồng bộ dọn dẹp toàn bộ các buổi học trên Lịch. |
| `GET` | `/api/bao-cao-hoc-tap` | User | **Tính toán tự động GPA hệ 10, GPA hệ 4, tổng tín chỉ tích lũy và xếp loại học lực** (Xuất sắc, Giỏi, Khá...). |
| `GET` | `/api/bai-tap` | User | Lấy danh sách bài tập cần nộp, populate môn học liên kết. |
| `POST` | `/api/bai-tap` | User | Tạo bài tập mới; **tự động đưa hạn nộp (deadline) lên trang Lịch**. |
| `PUT` | `/api/bai-tap/:id` | User | Cập nhật trạng thái bài tập (`chua_hoan_thanh`, `da_hoan_thanh`), hạn nộp và đồng bộ sang Lịch. |
| `DELETE` | `/api/bai-tap/:id` | User | Xóa bài tập và xóa sự kiện deadline tương ứng trên Lịch. |
| `GET` | `/api/gia-su` | Public | Lấy danh sách gia sư được xác thực kèm bộ lọc (tìm kiếm tên, môn dạy, khoảng giá, rating). |

### 5.4. Nhóm Dự án, Công việc & Ca làm Part-time (`/api`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/du-an` | User | Lấy danh sách dự án / nơi làm việc. |
| `POST` | `/api/du-an` | User | Tạo dự án / nơi làm việc mới (loại: `part_time`, `cong_viec_chinh`, `du_an_ngoai`). |
| `PUT` | `/api/du-an/:id` | User | Sửa dự án; nếu đổi `luong_theo_gio`, tự động tính toán lại lương của toàn bộ ca làm việc. |
| `DELETE` | `/api/du-an/:id` | User | Xóa dự án cùng toàn bộ công việc và ca làm việc trực thuộc. |
| `GET` | `/api/cong-viec` | User | Lấy danh sách công việc (tasks) theo dự án. |
| `POST` | `/api/cong-viec` | User | Tạo công việc mới kèm độ ưu tiên và thời hạn. |
| `PUT` | `/api/cong-viec/:id` | User | Cập nhật trạng thái công việc (`chua_bat_dau`, `dang_lam`, `hoan_thanh`). |
| `DELETE` | `/api/cong-viec/:id` | User | Xóa công việc. |
| `GET` | `/api/ca-lam-viec` | User | Lấy danh sách ca làm việc part-time và tổng lương dự kiến. |
| `POST` | `/api/ca-lam-viec` | User | Tạo ca làm lẻ; tự động tính lương ca và đồng bộ lên trang Lịch. |
| `POST` | `/api/ca-lam-viec/bulk` | User | **Tạo hàng loạt ca làm việc theo tuần/tháng** (Bulk Insert). |
| `PUT` | `/api/ca-lam-viec/:id` | User | Sửa ca làm việc và cập nhật lại mức lương. |
| `DELETE` | `/api/ca-lam-viec/:id` | User | Xóa ca làm việc và dọn dẹp khỏi lịch trình. |

### 5.5. Nhóm Thể hình & Kế hoạch Rèn luyện (`/api/tap-luyen`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tap-luyen/schedule` | User | Lấy lịch trình 7 ngày của kế hoạch tập luyện đang kích hoạt (`is_active: true`). |
| `POST` | `/api/tap-luyen/hoan-thanh`| User | Lưu lịch sử hoàn thành buổi tập (sets, reps, mức tạ, calo tiêu hao, thời gian tập). |
| `GET` | `/api/tap-luyen/report` | User | Thống kê số buổi tập, chuỗi ngày tập liên tiếp (streak), phân bổ bài tập theo nhóm cơ. |
| `GET` | `/api/tap-luyen/plans` | User | Lấy danh sách tất cả các kế hoạch tập luyện của tài khoản. |
| `POST` | `/api/tap-luyen/plans` | User | Tạo kế hoạch tập luyện mới. |
| `PUT` | `/api/tap-luyen/plans/:id` | User | Cập nhật thông tin kế hoạch tập luyện. |
| `PATCH`| `/api/tap-luyen/plans/:id/activate` | User | Kích hoạt một giáo án làm giáo án tập chính thức. |
| `POST` | `/api/tap-luyen/plans/:id/dong-bo-lich` | User | Đồng bộ các buổi tập trong giáo án sang trang Lịch chung. |
| `DELETE`| `/api/tap-luyen/plans/:id` | User | Xóa kế hoạch tập luyện cùng các buổi tập liên quan. |
| `POST` | `/api/tap-luyen/plans/:id/share-code` | User | **Sinh mã chia sẻ (Share Code)** để gửi giáo án cho bạn bè. |
| `GET` | `/api/tap-luyen/community/preview/:code` | User | Xem trước cấu trúc buổi tập và bài tập của một mã giáo án. |
| `POST` | `/api/tap-luyen/community/import` | User | **Nhập (Clone) giáo án từ mã code** vào bộ sưu tập cá nhân. |
| `GET` | `/api/tap-luyen/community/explore` | User | Khám phá các giáo án cộng đồng được chia sẻ nhiều nhất. |
| `POST` | `/api/tap-luyen/community/:id/like` | User | Thả tim / Bỏ tim giáo án cộng đồng. |
| `PUT` | `/api/tap-luyen/buoi-tap/:id` | User | Cập nhật tên buổi tập, ngày tập hoặc đánh dấu ngày nghỉ (`is_rest`). |
| `POST` | `/api/tap-luyen/buoi-tap/:id/exercises` | User | Thêm bài tập vào buổi tập. |
| `PUT` | `/api/tap-luyen/chi-tiet/:id` | User | Cập nhật sets, reps, thời gian nghỉ của một bài tập trong buổi tập. |
| `DELETE`| `/api/tap-luyen/chi-tiet/:id` | User | Xóa bài tập khỏi buổi tập. |
| `GET` | `/api/tap-luyen/exercises`| User | Lấy danh mục bài tập thể chất chuẩn (ngực, lưng, chân, vai, tay, bụng, cardio). |

### 5.6. Nhóm Kênh Chat Rèn luyện Cộng đồng (`/api/chat-tap-luyen`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/chat-tap-luyen` | User | Lấy 60 tin nhắn thảo luận mới nhất của cộng đồng gymmer. |
| `POST` | `/api/chat-tap-luyen` | User | Gửi tin nhắn mới vào kênh chat chung. |
| `POST` | `/api/chat-tap-luyen/:id/react` | User | Thả hoặc đổi biểu tượng cảm xúc reaction (💪, 🔥, ❤️...) cho tin nhắn. |
| `DELETE`| `/api/chat-tap-luyen/:id` | User | Xóa tin nhắn do chính mình gửi. |

### 5.7. Nhóm Mạng lưới Bạn bè (`/api/ban-be`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ban-be` | User | Lấy danh sách bạn bè đã kết nối (`accepted`). |
| `GET` | `/api/ban-be/loi-moi` | User | Lấy danh sách lời mời kết bạn (lời mời gửi đến và lời mời đã gửi đi đang chờ duyệt). |
| `GET` | `/api/ban-be/tim-kiem` | User | Tìm kiếm người dùng trong hệ thống theo tên hoặc email. |
| `POST` | `/api/ban-be/loi-moi` | User | Gửi lời mời kết bạn tới người dùng khác. |
| `PATCH`| `/api/ban-be/loi-moi/:id/chap-nhan` | User | Chấp nhận lời mời kết bạn. |
| `DELETE`| `/api/ban-be/loi-moi/:id` | User | Từ chối hoặc hủy lời mời kết bạn. |
| `DELETE`| `/api/ban-be/:friendUserId` | User | Hủy kết bạn (Unfriend). |

### 5.8. Nhóm Nhắn tin riêng 1-1 (`/api/tin-nhan-rieng`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tin-nhan-rieng/hoi-thoai` | User | Lấy danh sách các cuộc hội thoại gần nhất kèm số tin chưa đọc và chuyên môn gia sư/PT. |
| `GET` | `/api/tin-nhan-rieng/chua-doc/count` | User | Đếm tổng số tin nhắn chưa đọc của người dùng. |
| `GET` | `/api/tin-nhan-rieng/user/:partnerId` | User | Lấy toàn bộ lịch sử trò chuyện với 1 đối tác và tự động đánh dấu đã đọc (`da_doc: true`). |
| `POST` | `/api/tin-nhan-rieng` | User | Gửi tin nhắn riêng; tự động kích hoạt Web Push thông báo tới thiết bị người nhận. |
| `DELETE`| `/api/tin-nhan-rieng/:id` | User | Xóa tin nhắn riêng của mình. |

### 5.9. Nhóm Hồ sơ Chuyên gia Gia sư / PT (`/api/chuyen-gia`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chuyen-gia/dang-ky` | User | Nộp hồ sơ đăng ký làm Gia sư hoặc Huấn luyện viên PT (bằng cấp, chứng chỉ, bảng điểm). |
| `GET` | `/api/chuyen-gia/trang-thai-ho-so` | User | Kiểm tra trạng thái hồ sơ của mình (`pending`, `approved`, `rejected`). |
| `DELETE`| `/api/chuyen-gia/huy-ho-so/:id` | User | Hủy hồ sơ đăng ký nếu chưa được duyệt. |
| `GET` | `/api/chuyen-gia/pt` | Public | Lấy danh sách Huấn luyện viên PT công khai đã qua thẩm định. |

### 5.10. Nhóm Quản trị viên Cấp cao (`/api/admin`)
*Toàn bộ router này yêu cầu `authMiddleware` và `checkRole('admin')`.*

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/thong-ke` | Admin | Báo cáo thống kê toàn diện: tổng user, tỷ lệ gia sư/PT, biểu đồ tăng trưởng 7 ngày, tỷ lệ duyệt đơn. |
| `GET` | `/api/admin/ho-so` | Admin | Lấy danh sách hồ sơ chuyên gia đang chờ duyệt hoặc đã xử lý. |
| `POST` | `/api/admin/duyet-ho-so/:id` | Admin | **Phê duyệt hồ sơ:** Tự động đổi role thành `tutor`/`pt`, bật cờ `is_expert_verified`, tạo profile công khai và gửi thông báo chúc mừng. |
| `POST` | `/api/admin/tu-choi-ho-so/:id` | Admin | Từ chối hồ sơ chuyên gia kèm lý do từ chối cụ thể. |
| `GET` | `/api/admin/users` | Admin | Quản lý danh sách người dùng trong hệ thống (tìm kiếm, phân trang, lọc theo vai trò). |
| `PUT` | `/api/admin/users/:id` | Admin | Cập nhật vai trò người dùng (`role`) hoặc khóa/mở khóa tài khoản (`status: 'active' \| 'banned'`). |
| `POST` | `/api/admin/notifications/broadcast` | Admin | Phát thông báo toàn hệ thống (tất cả người dùng, chỉ sinh viên, chỉ gia sư, chỉ PT hoặc cá nhân). |
| `GET` | `/api/admin/notifications/history` | Admin | Lịch sử các thông báo phát sóng đã gửi. |

### 5.11. Nhóm Dashboard KPI & Thông báo nội bộ (`/api`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | User | Tổng hợp dữ liệu trang chủ: sự kiện hôm nay, bài tập sắp đến hạn, số môn đang học, số buổi tập đã hoàn thành, mục tiêu cá nhân. |
| `GET` | `/api/thong-bao` | User | Lấy danh sách thông báo nội bộ của tài khoản. |
| `PATCH`| `/api/thong-bao/:id/read` | User | Đánh dấu đã đọc 1 thông báo. |
| `PATCH`| `/api/thong-bao/read-all` | User | Đánh dấu tất cả thông báo là đã đọc. |
| `DELETE`| `/api/thong-bao/:id` | User | Xóa thông báo nội bộ. |

### 5.12. Nhóm Web Push Notification & Daily Briefing (`/api/push`)

| Method | Endpoint | Quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/push/public-key` | Public | Lấy VAPID Public Key để thiết bị client đăng ký nhận thông báo đẩy. |
| `POST` | `/api/push/subscribe` | User | Lưu thông tin Subscription (endpoint, auth keys, device) vào MongoDB. |
| `POST` | `/api/push/unsubscribe` | User | Hủy đăng ký nhận thông báo đẩy trên thiết bị hiện tại. |
| `POST` | `/api/push/test` | User | Bắn thử 1 thông báo đẩy kiểm tra kết nối trực tiếp đến thiết bị. |
| `GET` | `/api/push/daily-briefing` | User | Lấy cài đặt thông báo tổng hợp lịch trình đầu ngày (bật/tắt, giờ hẹn gửi). |
| `PUT` | `/api/push/daily-briefing` | User | Cập nhật cấu hình giờ nhận thông báo Daily Briefing. |
| `POST` | `/api/push/daily-briefing/test`| User | Bắn thử nghiệm thông báo tổng hợp lịch trình hôm nay về thiết bị. |

---

## 6. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA MAPPING)

Hệ thống quản lý 22 Model Mongoose với các mối quan hệ chặt chẽ:

```
[User] (role: user | tutor | pt | admin)
  ├── 1:N ──> [SuKien] (Hub lịch trình chung)
  ├── 1:N ──> [MonHoc] ── 1:N ──> [LichHoc]
  │               └── 1:N ──> [BaiTap]
  ├── 1:N ──> [DuAn] ── 1:N ──> [CongViec]
  │               └── 1:N ──> [CaLamViec]
  ├── 1:N ──> [KeHoachTapLuyen] ── 1:N ──> [BuoiTap] ── 1:N ──> [ChiTietBuoiTap]
  │                                                                     │
  │                                      [BaiTapTheChat] <──────────────┘
  ├── 1:N ──> [LichSuTapLuyen] (Lưu kết quả hoàn thành buổi tập)
  ├── 1:N ──> [DangKyChuyenGia] (Đơn xin làm Gia sư/PT)
  ├── 1:1 ──> [GiaSu] / [HuanLuyenVien] (Hồ sơ chuyên gia được duyệt)
  ├── N:N ──> [BanBe] (Mối quan hệ bạn bè giữa 2 Users)
  ├── 1:N ──> [TinNhanRieng] (Tin nhắn 1-1)
  ├── 1:N ──> [TinNhanTapLuyen] (Chat kênh chung kèm reaction)
  ├── 1:N ──> [PushSubscription] (Thiết bị nhận Web Push)
  └── 1:N ──> [ThongBao] & [MucTieu]
```

---

## 7. CƠ CHẾ BẢO MẬT & XỬ LÝ LỖI TOÀN CỤC

### 7.1. Cơ chế Mã hóa Mật khẩu & Xử lý JWT Token (Authentication)

Hệ thống bảo vệ thông tin đăng nhập và phiên làm việc của người dùng thông qua 3 tệp then chốt:

#### 1. Nơi băm mật khẩu và ký tạo Token: [`Controller/api/authController.js`](file:///d:/laragon/laragon/www/test_backend/Controller/api/authController.js)
* **Ký phát hành JWT Token (`generateToken` - Dòng 5-12):**
  Sử dụng thư viện `jsonwebtoken` để tạo token có hiệu lực trong **7 ngày**, nhúng ID người dùng và ký bằng chuỗi bí mật:
  ```javascript
  const generateToken = (userId) => {
      return jwt.sign(
          { id: userId }, 
          process.env.JWT_SECRET || "life_planner_secret_key_2026", 
          { expiresIn: "7d" }
      );
  };
  ```
* **Mã hóa mật khẩu một chiều khi Đăng ký (`register` - Dòng 50):**
  Tuyệt đối không lưu mật khẩu thô (plaintext) mà dùng `bcryptjs` với độ an toàn **10 salt rounds**:
  ```javascript
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  ```
* **Đối chiếu mật khẩu khi Đăng nhập (`login` - Dòng 98-106):**
  So sánh mật khẩu người dùng nhập vào với chuỗi băm trong MongoDB bằng hàm `bcrypt.compare`:
  ```javascript
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác" });
  }
  const token = generateToken(user._id);
  ```
* **Đổi mật khẩu an toàn (`changePassword` - Dòng 248 & 256):**
  Bắt buộc đối chiếu mật khẩu hiện tại trước khi mã hóa mật khẩu mới và lưu vào cơ sở dữ liệu.

#### 2. Nơi gác cổng, bóc tách và giải mã Token: [`Middleware/authMiddleware.js`](file:///d:/laragon/laragon/www/test_backend/Middleware/authMiddleware.js)
Mọi yêu cầu gọi đến các API riêng tư đều bắt buộc phải đi qua middleware này để xác minh danh tính:
```javascript
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // 1. Kiểm tra header Authorization có tiền tố "Bearer " hay không
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy Token xác thực. Vui lòng đăng nhập lại."
            });
        }

        // 2. Trích xuất và giải mã Token bằng JWT_SECRET
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "life_planner_secret_key_2026");

        // 3. Tìm người dùng trong database (loại bỏ trường password để bảo mật)
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản không tồn tại hoặc Token không hợp lệ."
            });
        }

        // 4. Kiểm tra trạng thái tài khoản (Chặn truy cập nếu bị khóa)
        if (user.status === "banned") {
            return res.status(403).json({
                success: false,
                message: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ ban quản trị."
            });
        }

        // 5. Gán thông tin người dùng vào req.user cho các Controller sử dụng
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Xác thực không thành công: " + error.message
        });
    }
};
```

#### 3. Cấu hình Khóa bí mật (Secret Key): [`.env`](file:///d:/laragon/laragon/www/test_backend/.env)
Khóa bí mật dùng để ký và giải mã Token được quản lý qua biến môi trường (Dòng 3):
```env
JWT_SECRET=life_planner_secret_key_2026
```

---

### 7.2. Phân quyền người dùng (Role-Based Access Control - RBAC)

Hệ thống quản lý phân quyền theo 4 cấp độ vai trò: `user` (người dùng/sinh viên), `tutor` (gia sư), `pt` (huấn luyện viên thể hình), và `admin` (quản trị viên hệ thống).

#### 1. Middleware kiểm tra quyền truy cập: [`Middleware/roleMiddleware.js`](file:///d:/laragon/laragon/www/test_backend/Middleware/roleMiddleware.js)
Được cấu hình linh hoạt nhận vào danh sách các quyền được phép thực thi API:
```javascript
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin xác thực người dùng."
            });
        }

        // Kiểm tra tài khoản có bị khóa không
        if (req.user.status === "banned") {
            return res.status(403).json({
                success: false,
                message: "Tài khoản của bạn đã bị tạm khóa do vi phạm chính sách hệ thống."
            });
        }

        // Kiểm tra quyền hạn của người dùng so với danh sách được phép
        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Quyền truy cập bị từ chối. Chức năng này yêu cầu quyền [${allowedRoles.join(" hoặc ")}].`
            });
        }

        next();
    };
};
```

#### 2. Ma trận phân quyền thực tế trong hệ thống (Role Matrix)

| Vai trò (Role) | Quyền hạn & Chức năng được phép truy cập |
| :--- | :--- |
| **`user`** (Mặc định) | Quản lý lịch trình cá nhân, môn học, tính GPA, deadline bài tập, dự án, ca làm việc, tập gym PPL, kết bạn, nhắn tin 1-1, nộp hồ sơ xin làm Chuyên gia. |
| **`tutor`** (Gia sư) | Toàn bộ quyền của `user` + Được hiển thị hồ sơ công khai trong Danh mục Gia sư, gắn huy hiệu xác thực `is_expert_verified`, học viên có thể tìm kiếm và liên hệ học tập. |
| **`pt`** (HLV Thể hình) | Toàn bộ quyền của `user` + Được hiển thị hồ sơ trong Danh mục Huấn luyện viên thể hình, gắn huy hiệu xác thực, nhận học viên tư vấn tập luyện. |
| **`admin`** (Quản trị viên) | Toàn quyền kiểm soát hệ thống: Xem dashboard thống kê KPI, duyệt/từ chối hồ sơ bằng cấp chuyên gia, đổi vai trò người dùng, khóa/mở khóa tài khoản (`banned`/`active`), phát thông báo broadcast toàn server, tra cứu toàn bộ dữ liệu người dùng (`/api/admin/users/:id/full-data`). Được bảo vệ nghiêm ngặt qua `checkRole('admin')`. |

* **Cơ chế cô lập & bảo vệ dữ liệu khi khóa tài khoản (Banned Account Privacy Isolation):**
  * **Đối với người dùng khác:** Khi một tài khoản bị Admin khóa (`status: 'banned'`), toàn bộ thông tin cá nhân, hồ sơ Gia sư (`GiaSu`), hồ sơ HLV PT (`HuanLuyenVien`), tin nhắn trên kênh cộng đồng (`TinNhanTapLuyen`), lịch sử trò chuyện riêng (`TinNhanRieng`), tìm kiếm và lời mời kết bạn (`BanBe`), cùng các giáo án tập gym chia sẻ (`KeHoachTapLuyen`) của người đó sẽ **lập tức bị ẩn hoàn toàn khỏi tất cả người dùng khác**. Mọi hành vi gửi tin nhắn hoặc kết bạn tới người dùng bị khóa đều bị từ chối.
  * **Đối với chính tài khoản bị khóa:** Không thể thực hiện bất kỳ thao tác nào trên hệ thống (bị `authMiddleware` chặn lại với mã lỗi `403 Forbidden`).
  * **Đối với Quản trị viên (Admin):** Admin là người **duy nhất** có toàn quyền xem chi tiết toàn bộ dữ liệu của người dùng bị khóa (thông tin cá nhân, môn học, bài tập, dự án, ca làm việc, lịch tập, sự kiện) thông qua nút **"👁️ Dữ Liệu"** trên Admin Dashboard và endpoint bảo mật `GET /api/admin/users/:id/full-data`.

### 7.3. Xử lý lỗi toàn cục (Global Error Handling)
Trong [`errorMiddleware.js`](file:///d:/laragon/laragon/www/test_backend/Middleware/errorMiddleware.js), hệ thống bắt mọi lỗi từ Controller mà không làm crash máy chủ:
* **Route không tồn tại:** Trả về `404 Not Found`.
* **Mongoose CastError (Sai cú pháp ObjectId):** Trả về `400 Bad Request`.
* **Mongoose ValidationError (Dữ liệu không khớp Schema):** Trả về `400 Bad Request` kèm chi tiết lỗi từng trường.
* **TokenExpiredError / JsonWebTokenError:** Trả về `401 Unauthorized` yêu cầu đăng nhập lại.
* **Lỗi không xác định:** Trả về `500 Internal Server Error` (ẩn stack trace khi ở chế độ Production).

---

## 8. BỘ CÂU HỎI BẢO VỆ ĐỒ ÁN VÀ PHẢN BIỆN ĂN ĐIỂM CAO

### Câu 1: Em hãy trình bày luồng xác thực (Authentication) và phân quyền (Authorization) trong dự án?
* **Trả lời:**
  * **Xác thực:** Khi người dùng gửi email và mật khẩu tại `/api/auth/login`, Controller dùng `bcrypt.compare` để đối chiếu mật khẩu đã hash trong DB. Nếu khớp, server ký một chuỗi JWT Token có thời hạn 7 ngày chứa `id` của user. Các request sau đó Client phải đính kèm Header `Authorization: Bearer <token>`.
  * **Phân quyền:** Hệ thống có 4 vai trò chính (`user`, `tutor`, `pt`, `admin`). Tầng phân quyền sử dụng `roleMiddleware(allowedRoles)` kiểm tra trường `role` của `req.user`. Nếu không đủ thẩm quyền, hệ thống trả về mã `403 Forbidden`.

### Câu 2: Khi người dùng tạo môn học hay bài tập, tại sao bên trang Lịch lại tự động xuất hiện sự kiện?
* **Trả lời:**
  * Đây là cơ chế **Auto-Sync** do em thiết kế tại Controller. Bảng `SuKien` đóng vai trò là Hub tổng hợp.
  * Khi gọi API tạo Môn học (`createMonHoc`), Controller sẽ tự động tính toán các ngày học trong tuần từ `ngay_bat_dau` đến `ngay_ket_thuc`, đồng thời dùng `insertMany` để đẩy tất cả các buổi học vào bảng `SuKien` với `loai_su_kien: "hoc-tap"`.
  * Tương tự, khi tạo Bài tập, hệ thống tự động sinh 1 bản ghi `SuKien` loại `"deadline"`. Nhờ vậy, Client chỉ cần gọi 1 API lịch duy nhất là hiển thị được tất cả lịch trình mà không cần ghép nối phức tạp.

### Câu 3: Tính năng Daily Briefing gửi thông báo tổng hợp buổi sáng hoạt động thế nào? Có gây quá tải server không?
* **Trả lời:**
  * Tác vụ này chạy ngầm thông qua hàm [`startDailyBriefingScheduler`](file:///d:/laragon/laragon/www/test_backend/Utils/dailyBriefingScheduler.js) với chu kỳ kiểm tra mỗi 60 giây.
  * Để không gây nghẽn server, hệ thống chỉ truy vấn các user thỏa mãn: `daily_briefing_enabled == true`, giờ hẹn `daily_briefing_time == currentTime` (theo múi giờ Việt Nam UTC+7) và `daily_briefing_last_sent !== dateStr`.
  * Ngay khi tìm thấy, server cập nhật `daily_briefing_last_sent` thành ngày hôm nay để ngăn gửi trùng lặp, sau đó gom toàn bộ sự kiện trong ngày và gửi qua chuẩn Web Push (VAPID) trực tiếp đến Service Worker trên thiết bị người dùng.

### Câu 4: Làm thế nào để tính điểm GPA hệ 10 và hệ 4 tự động?
* **Trả lời:**
  * Tại API `GET /api/bao-cao-hoc-tap`, Controller truy vấn toàn bộ các môn học của người dùng có `diem_so != null`.
  * Sử dụng công thức tính điểm trung bình có trọng số theo số tín chỉ:
    $$\text{GPA}_{10} = \frac{\sum (\text{Điểm môn} \times \text{Số tín chỉ})}{\sum \text{Số tín chỉ}}$$
  * Đồng thời quy đổi điểm hệ 10 sang thang điểm 4 theo chuẩn đại học ($\ge 8.5 \to 4.0$, $\ge 7.0 \to 3.0$, $\ge 5.5 \to 2.0$, $\ge 4.0 \to 1.0$), từ đó tính $\text{GPA}_4$ và đưa ra xếp loại học lực tương ứng (Xuất sắc, Giỏi, Khá, Trung bình).

### Câu 5: Hệ thống xử lý thế nào khi xóa dữ liệu môn học hoặc dự án? Có bị lỗi mồ côi dữ liệu (orphan records) không?
* **Trả lời:**
  * Đối với Môn học, em áp dụng cơ chế **Soft-delete** (`is_deleted: true`) trên bảng `MonHoc`, đồng thời chạy truy vấn cập nhật hàng loạt `SuKien.updateMany({ mon_hoc_id: id }, { is_deleted: true })` và xóa sạch các bản ghi trong `LichHoc`.
  * Đối với Dự án, khi xóa Dự án thì Controller cũng tự động xóa toàn bộ các Tasks (`CongViec.deleteMany`) và Ca làm việc (`CaLamViec.deleteMany`) trực thuộc dự án đó, đảm bảo toàn vẹn dữ liệu trong cơ sở dữ liệu.

---

## 9. KẾ HOẠCH TRIỂN KHAI 24/7 VÀ HƯỚNG PHÁT TRIỂN HỆ THỐNG

### 9.1. Kế hoạch triển khai duy trì hệ thống chạy 24/7 (Deployment Strategies)
Để đưa hệ thống thoát khỏi môi trường máy tính cục bộ (localhost), duy trì hoạt động liên tục 24/7 phục vụ người dùng thực tế mà không cần bật máy tính cá nhân, hệ thống hướng tới 2 phương án triển khai thực tiễn:

#### Hướng 1: Triển khai Nền tảng Đám mây Miễn phí (Zero-Cost Cloud Deployment)
* **Cơ sở dữ liệu (Database Cloud):**
  * Di chuyển toàn bộ cơ sở dữ liệu MongoDB cục bộ lên **MongoDB Atlas** (gói dịch vụ M0 Sandbox miễn phí 512MB lưu trữ trên AWS/GCP).
  * Tận dụng tính năng sao lưu tự động (Automated Backups), mã hóa dữ liệu tĩnh và kiểm soát truy cập qua IP Whitelist.
* **Máy chủ ứng dụng (Web & API Hosting):**
  * Triển khai mã nguồn Backend & Frontend lên nền tảng **Render.com** (hoặc **Railway.app**) liên kết trực tiếp với kho mã nguồn **GitHub**.
  * Thiết lập quy trình tự động hóa **CI/CD**: Mỗi khi cập nhật code lên nhánh `main`, nền tảng tự động build và deploy phiên bản mới không gián đoạn dịch vụ (Zero-Downtime Deployment).
  * **HTTPS & PWA:** Render tự động cấp chứng chỉ bảo mật SSL/TLS (Let's Encrypt) chính quy và tên miền cố định vĩnh viễn (ví dụ: `https://lifeplanner-backend.onrender.com`), đáp ứng hoàn hảo tiêu chuẩn bảo mật khắt khe của **PWA Mobile** và **Web Push Notification** trên cả Android và iOS.

##### 📋 Quy trình triển khai thực tế từng bước (Step-by-Step Execution):

* **Bước 1: Khởi tạo Cơ sở dữ liệu đám mây (MongoDB Atlas):**
  1. Đăng ký tài khoản miễn phí tại [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
  2. Tạo cụm dữ liệu mới (Cluster): Chọn gói **M0 Free**, chọn Region **Singapore (ap-southeast-1)** để đạt tốc độ tối ưu về Việt Nam.
  3. Tạo tài khoản Database User (đặt username & password, ví dụ: `admin` / mật khẩu bảo mật).
  4. Mở quyền mạng: Vào menu **Network Access** ➜ **Add IP Address** ➜ Chọn **Allow Access from Anywhere (`0.0.0.0/0`)** để máy chủ Render có thể truy xuất cơ sở dữ liệu.
  5. Lấy chuỗi kết nối URI tại mục **Connect** ➜ **Drivers**:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/life_planner?retryWrites=true&w=majority
     ```

* **Bước 2: Cấu hình lệnh Build tự động cho Cloud:**
  1. Trong file `package.json`, đảm bảo script build tự động cài và dựng Frontend PWA:
     ```json
     "build": "npm --prefix client install && npm --prefix client run build"
     ```
  2. Đẩy toàn bộ mã nguồn lên kho lưu trữ GitHub:
     ```bash
     git add .
     git commit -m "prepare for cloud deployment"
     git push origin main
     ```

* **Bước 3: Tạo và kích hoạt Web Service trên Render.com:**
  1. Đăng nhập [render.com](https://render.com/) bằng tài khoản GitHub chứa repository `tonducquangdev-wq/DAn_backend`.
  2. Bấm **New +** ➜ **Web Service** ➜ Chọn kết nối với kho mã nguồn `DAn_backend`.
  3. Điền thông tin cấu hình dịch vụ:
     * **Name:** `lifeplanner-backend` (hoặc tên tùy chọn).
     * **Region:** `Singapore`.
     * **Branch:** `main`.
     * **Runtime:** `Node`.
     * **Build Command:** `npm install && npm run build`
     * **Start Command:** `node server.js`
     * **Instance Type:** `Free ($0/month)`.
  4. Khai báo Biến môi trường (**Environment Variables**):
     * `MONGO_URI`: `(Dán chuỗi kết nối MongoDB Atlas đã tạo ở Bước 1)`
     * `JWT_SECRET`: `life_planner_secret_key_2026`
     * `VAPID_PUBLIC_KEY`: `BPzDQMMjP6YHh_C1jnypACZdF3PqWVb5qlwobOK0dnY-aFieR-g5bfeZpZvHXY6iu7tfV1Xy3znfo7tEsz2Gzwg`
     * `VAPID_PRIVATE_KEY`: `sjRrETYsNAw928TrHvCsIYAvCxZokevwxojeMu2DPOE`
     * `VAPID_EMAIL`: `mailto:support@lifeplanner.com`
  5. Bấm **Deploy Web Service**. Sau khi quá trình build hoàn tất, hệ thống được cấp tên miền HTTPS cố định vĩnh viễn (ví dụ: `https://lifeplanner-backend.onrender.com`).

* **Bước 4: Thiết lập giữ hệ thống online 24/24 (Keep-Alive Cron-job):**
  1. Đăng ký tài khoản miễn phí tại [cron-job.org](https://cron-job.org/) (hoặc [uptimerobot.com](https://uptimerobot.com/)).
  2. Tạo 1 cron-job ping HTTP định kỳ:
     * **URL:** `https://lifeplanner-backend.onrender.com/`
     * **Tần suất (Schedule):** Mỗi 10 phút một lần (`*/10 * * * *`).
  3. **Mục đích:** Ngăn chặn cơ chế tạm ngủ (Sleep Mode sau 15 phút không hoạt động) của gói Render Free, đảm bảo tiến trình ngầm `dailyBriefingScheduler` hoạt động liên tục, quét và phát thông báo lịch trình mỗi sáng đúng giờ hẹn 100% dù người dùng tắt máy tính cá nhân.


#### Hướng 2: Triển khai Máy chủ ảo riêng biệt (Production VPS Deployment)
* **Hạ tầng máy chủ:**
  * Thuê máy chủ ảo **VPS Linux (Ubuntu 22.04 LTS / 24.04 LTS)** tại các nhà cung cấp hạ tầng trong nước hoặc quốc tế (Vietnix, AZDIGI, DigitalOcean, Linode).
* **Quản trị tiến trình với PM2 (Process Manager):**
  * Sử dụng **PM2** để chạy Node.js dưới dạng service ngầm (Daemon Mode).
  * Kích hoạt chế độ **Cluster Mode** để tận dụng tối đa tất cả các nhân của CPU máy chủ.
  * Tự động khởi động lại tiến trình ngay lập tức nếu xảy ra lỗi crash hoặc tự động kích hoạt sau khi máy chủ bị reboot (`pm2 startup`).
* **Web Server & Reverse Proxy Nginx:**
  * Cài đặt **Nginx** làm Reverse Proxy chuyển tiếp luồng truy cập từ cổng chuẩn 80/443 về cổng 5000 nội bộ.
  * Cấu hình nén gzip/brotli cho tài nguyên tĩnh, giới hạn tốc độ truy cập (Rate Limiting) phòng chống tấn công DoS/DDoS.
* **Tên miền & Chứng chỉ bảo mật riêng:**
  * Trỏ tên miền thương mại (ví dụ: `lifeplanner.vn`) về địa chỉ IP tĩnh của VPS.
  * Tự động tạo và gia hạn chứng chỉ SSL với **Certbot (Let's Encrypt)**.

### 9.2. Hướng mở rộng tính năng trong tương lai (Technical Roadmap)
1. **Giao tiếp Thời gian thực (Real-time WebSockets với Socket.IO):**
   * Nâng cấp phân hệ Tin nhắn riêng 1-1 và Kênh chat tập luyện cộng đồng từ cơ chế HTTP Polling sang kết nối hai chiều toàn phần (**Full-duplex WebSockets**), giúp tin nhắn hiển thị tức thì với độ trễ dưới 20ms.
2. **Trợ lý Trí tuệ Nhân tạo Cá nhân hóa (AI Assistant / LLM Integration):**
   * Tích hợp API mô hình ngôn ngữ lớn (Google Gemini / OpenAI) để tự động phân tích kết quả học tập (GPA) và lịch tập thể hình, từ đó đưa ra lời khuyên phân bổ thời gian biểu tối ưu, nhắc nhở ôn tập và gợi ý thực đơn ăn uống khoa học.
3. **Cổng Thanh toán Trực tuyến (Payment Gateway):**
   * Tích hợp các cổng thanh toán điện tử (VNPay, MoMo, ZaloPay, Stripe) phục vụ việc thanh toán học phí gia sư và thuê huấn luyện viên cá nhân (PT) trực tiếp trên nền tảng.
4. **Kiến trúc Microservices & Hàng đợi Thông điệp (Message Queue):**
   * Khi số lượng người dùng tăng cao, tách module Tác vụ nền & Thông báo đẩy (Daily Briefing & Web Push) thành một Microservice độc lập, sử dụng **RabbitMQ** hoặc **Redis Pub/Sub** để điều phối hàng đợi gửi thông báo không ảnh hưởng đến API chính.

