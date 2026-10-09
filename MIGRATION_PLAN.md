# TÀI LIỆU KHÔI PHỤC TIẾN TRÌNH & HƯỚNG DẪN BÀN GIAO DỰ ÁN LIFE PLANNER

> **LƯU Ý DÀNH CHO AI (ANTIGRAVITY / AI ASSISTANT) KHI ĐỌC FILE NÀY TRONG PHIÊN LÀM VIỆC MỚI:**
> File này chứa toàn bộ bối cảnh, kiến trúc, mã nguồn đã hoàn thành và danh sách nhiệm vụ cần làm tiếp theo của dự án **LIFE PLANNER**.
> Khi người dùng yêu cầu tiếp tục công việc, hãy đọc kỹ nội dung dưới đây để nắm bắt ngay lập tức trạng thái dự án mà không cần hỏi lại các thông tin cũ.

---

## 1. TỔNG QUAN HỆ THỐNG (PROJECT OVERVIEW)

- **Tên Dự Án**: **LIFE PLANNER** (Hệ thống Quản lý Cuộc sống, Học tập, Lịch cá nhân, Tập luyện Gym & Công việc)
- **Nguồn gốc**: Đã chuyển đổi thành công từ dự án Laravel Monolith sang mô hình **RESTful API + React Single Page Application**.
- **Cấu trúc Monorepo**:
  - **Backend API**: Node.js + Express (v5.2.1) + Mongoose (MongoDB) tại thư mục gốc `d:\hoctap\test_backend` (Port 5000)
  - **Frontend Client**: React 19 + Vite + Vanilla CSS Glassmorphic tại `d:\hoctap\test_backend\client`
  - **Cơ chế Xác thực**: JWT Bearer Token Authentication (đã thay thế Sanctum/Session)

---

## 2. TRẠNG THÁI MÃ NGUỒN ĐÃ HOÀN THÀNH (100% COMPLETE CORE)

### 🛠️ 2.1. Backend API (`d:\hoctap\test_backend`)

1. **Cấu hình Server & CSDL**:
   - [`server.js`](file:///d:/hoctap/test_backend/server.js): Server Express chính, nạp CORS, Express JSON, Static `/public`, kết nối MongoDB và 6 Router phân hệ.
   - [`Config/db.js`](file:///d:/hoctap/test_backend/Config/db.js): Hàm kết nối MongoDB Mongoose.
   - [`.env`](file:///d:/hoctap/test_backend/.env): Cấu hình `PORT=5000`, `MONGO_URI=mongodb://127.0.0.1:27017/life_planner`, `JWT_SECRET`.
   - [`Middleware/authMiddleware.js`](file:///d:/hoctap/test_backend/Middleware/authMiddleware.js): Middleware xác thực JWT Bearer Token cho các API bảo mật.

2. **15 Mongoose Models (`Model/*.js`)**:
   - [`User.js`](file:///d:/hoctap/test_backend/Model/User.js): User profile, Cài đặt theme (light/dark/system), Cài đặt thông báo.
   - [`MonHoc.js`](file:///d:/hoctap/test_backend/Model/MonHoc.js): Quản lý môn học, số tín chỉ, điểm số hệ 10.
   - [`BaiTap.js`](file:///d:/hoctap/test_backend/Model/BaiTap.js): Bài tập môn học & Deadline.
   - [`LichHoc.js`](file:///d:/hoctap/test_backend/Model/LichHoc.js): Thời khóa biểu cố định hàng tuần.
   - [`SuKien.js`](file:///d:/hoctap/test_backend/Model/SuKien.js): Lịch cá nhân & Sự kiện lặp lại (daily, weekly, monthly) qua `nhom_lap_id`.
   - [`KeHoachTapLuyen.js`](file:///d:/hoctap/test_backend/Model/KeHoachTapLuyen.js): Giáo án tập gym/thể chất.
   - [`BuoiTap.js`](file:///d:/hoctap/test_backend/Model/BuoiTap.js): Các buổi tập 7 ngày trong tuần.
   - [`BaiTapTheChat.js`](file:///d:/hoctap/test_backend/Model/BaiTapTheChat.js): Danh mục bài tập thể chất mẫu.
   - [`ChiTietBuoiTap.js`](file:///d:/hoctap/test_backend/Model/ChiTietBuoiTap.js): Số sets, reps, thời lượng.
   - [`LichSuTapLuyen.js`](file:///d:/hoctap/test_backend/Model/LichSuTapLuyen.js): Nhật ký ghi nhận hoàn thành tập luyện (Phục vụ Streak & Heatmap).
   - [`DuAn.js`](file:///d:/hoctap/test_backend/Model/DuAn.js): Quản lý dự án cá nhân.
   - [`CongViec.js`](file:///d:/hoctap/test_backend/Model/CongViec.js): Công việc / Task Todo theo dự án.
   - [`GiaSu.js`](file:///d:/hoctap/test_backend/Model/GiaSu.js): Danh sách gia sư hỗ trợ học tập gợi ý.
   - [`ThongBao.js`](file:///d:/hoctap/test_backend/Model/ThongBao.js): Thông báo hệ thống.
   - [`MucTieu.js`](file:///d:/hoctap/test_backend/Model/MucTieu.js): Theo dõi mục tiêu cá nhân.

3. **API Controllers & Routers (`Controller/api/` & `Router/`)**:
   - `authController.js` / `authRouter.js`: `/api/auth/register`, `/login`, `/me`, `/me/password`.
   - `suKienController.js` / `suKienRouter.js`: CRUD `/api/su-kien` (Lịch & sự kiện lặp).
   - `monHocController.js` / `monHocRouter.js`: CRUD `/api/mon-hoc`, `/api/bai-tap`, tính GPA tự động tại `/api/bao-cao-hoc-tap`, `/api/gia-su`.
   - `tapLuyenController.js` / `tapLuyenRouter.js`: Lịch tập 7 ngày `/api/tap-luyen/schedule`, hoàn thành buổi tập `/api/tap-luyen/hoan-thanh`, báo cáo heatmap `/api/tap-luyen/report`.
   - `duAnController.js` / `duAnRouter.js`: CRUD `/api/du-an` & `/api/cong-viec`.
   - `dashboardController.js` / `dashboardRouter.js`: Tổng hợp chỉ số KPI `/api/dashboard`, `/api/thong-bao`.

---

### 💻 2.2. Frontend React Client (`d:\hoctap\test_backend\client`)

- **API Services**: [`client/src/services/api.js`](file:///d:/hoctap/test_backend/client/src/services/api.js) tích hợp sẵn fetch API call với `Authorization: Bearer <token>`.
- **Global Auth & Theme Context**: [`client/src/context/AuthContext.jsx`](file:///d:/hoctap/test_backend/client/src/context/AuthContext.jsx) lưu User State, JWT Token và chế độ Dark/Light Mode.
- **Design System CSS**: [`client/src/index.css`](file:///d:/hoctap/test_backend/client/src/index.css) giao diện Glassmorphic hiện đại, hỗ trợ Responsive & Dynamic Dark Mode.
- **Layout & Routing**: [`client/src/App.jsx`](file:///d:/hoctap/test_backend/client/src/App.jsx) điều hướng mượt mà với Sidebar navigation.
- **Components & Views**:
  - Modal Auth Login/Register: [`AuthModal.jsx`](file:///d:/hoctap/test_backend/client/src/components/AuthModal.jsx)
  - Sidebar Navigation: [`Sidebar.jsx`](file:///d:/hoctap/test_backend/client/src/components/Sidebar.jsx)
  - 📊 **Dashboard View**: [`DashboardView.jsx`](file:///d:/hoctap/test_backend/client/src/views/DashboardView.jsx)
  - 📅 **Lịch & Sự Kiện View**: [`CalendarView.jsx`](file:///d:/hoctap/test_backend/client/src/views/CalendarView.jsx)
  - 🎓 **Học Tập & GPA View**: [`StudyGpaView.jsx`](file:///d:/hoctap/test_backend/client/src/views/StudyGpaView.jsx)
  - 🏋️ **Gym & Monthly Heatmap View**: [`WorkoutView.jsx`](file:///d:/hoctap/test_backend/client/src/views/WorkoutView.jsx)
  - 📋 **Dự Án & Tasks View**: [`ProjectsView.jsx`](file:///d:/hoctap/test_backend/client/src/views/ProjectsView.jsx)
  - ⚙️ **Cài Đặt Cá Nhân View**: [`ProfileView.jsx`](file:///d:/hoctap/test_backend/client/src/views/ProfileView.jsx)

---

## 3. LỆNH KHỞI CHẠY DỰ ÁN HÀNG NGÀY

### Bước 1: Chạy Backend Node.js API Server (Port 5000)

```bash
# Tại thư mục: d:\hoctap\test_backend
npm run dev
```

### Bước 2: Chạy Frontend React Client (Port 5173)

```bash
# Tại thư mục: d:\hoctap\test_backend\client
npm run dev
```

---

## 4. GỢI Ý CAC NHIỆM VỤ CÓ THỂ TIẾP TỤC TRONG PHIÊN TỚI (NEXT STEPS)

Khi người dùng mở lại dự án và muốn phát triển tiếp, AI có thể gợi ý thực hiện các bước nâng cấp sau:

1. **Upload File Thật với Multer / Cloudinary**:
   - Tích hợp `multer` trong Node.js để upload Avatar thật và tệp đính kèm bài tập vào thư mục `Public/uploads/`.
2. **Xuất Báo Cáo Học Tập & GPA (Export PDF / Excel)**:
   - Thêm tính năng xuất bảng điểm GPA hệ 10 & 4 ra file PDF/Excel cho sinh viên.
3. **Lịch Tháng Tương Tác (Full Interactive Monthly Calendar)**:
   - Nâng cấp lưới lịch tháng hiển thị trực quan các sự kiện dạng ô ngày (dùng thư viện FullCalendar hoặc Recharts/Chart.js).
4. **Thông Báo Đẩy (Push Notifications / Web Notification API)**:
   - Phát âm thanh hoặc hiển thị thông báo trình duyệt khi đến hạn Deadline hoặc buổi tập Gym.
5. **Đóng Gói Sản Phẩm & Deploy**:
   - Hướng dẫn người dùng deploy Backend lên Render/Vercel/Railway và Frontend lên Vercel/Netlify.

---

## 5. BẢNG TIẾN ĐỘ TỔNG KẾT (PROGRESS CHECKLIST)

- [x] Phân tích dự án Laravel Monolith cũ & lập bản đồ chuyển đổi.
- [x] Tạo 15 Mongoose Models trong `Model/`.
- [x] Viết JWT Authentication Middleware & Auth API (`/api/auth`).
- [x] Viết các Controller & Router API cho 6 phân hệ (Lịch, Môn học/GPA, Gym, Dự án/Task, Dashboard).
- [x] Đăng ký API trong `server.js` & kiểm tra cú pháp thành công.
- [x] Xây dựng React 19 Frontend trong `client/src` đầy đủ 6 Views + Dark/Light Theme.
- [x] Kiểm thử build production `vite build` thành công.
- [x] Đã lưu tài liệu khôi phục tiến trình tại `MIGRATION_PLAN.md`.
