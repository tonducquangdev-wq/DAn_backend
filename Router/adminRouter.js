const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/authMiddleware");
const { checkRole } = require("../Middleware/roleMiddleware");
const adminController = require("../Controller/api/adminController");

// Bảo vệ toàn bộ router Admin bằng authMiddleware và checkRole('admin')
router.use(authMiddleware);
router.use(checkRole("admin"));

// Thống kê tổng quan
router.get("/thong-ke", adminController.getThongKeAdmin);

// Quản lý thẩm định và phê duyệt hồ sơ chuyên gia (Gia sư / PT)
router.get("/ho-so", adminController.getDanhSachHoSo);
router.post("/duyet-ho-so/:id", adminController.duyetHoSo);
router.post("/tu-choi-ho-so/:id", adminController.tuChoiHoSo);

// Quản lý người dùng trong hệ thống (Đổi role, Khóa/Mở tài khoản)
router.get("/users", adminController.getDanhSachUsers);
router.put("/users/:id", adminController.capNhatUser);

// Phát thông báo hệ thống (Cả server, Người dùng, Gia sư, PT, hoặc Cá nhân)
router.post("/notifications/broadcast", adminController.guiThongBaoAdmin);
router.get("/notifications/history", adminController.getLichSuThongBaoAdmin);

module.exports = router;
