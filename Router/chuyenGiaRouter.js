const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/authMiddleware");
const chuyenGiaController = require("../Controller/api/chuyenGiaController");
const HuanLuyenVien = require("../Model/HuanLuyenVien");

// Route người dùng nộp đơn & kiểm tra trạng thái
router.post("/dang-ky", authMiddleware, chuyenGiaController.dangKyChuyenGia);
router.get("/trang-thai-ho-so", authMiddleware, chuyenGiaController.getTrangThaiHoSo);
router.delete("/huy-ho-so/:id", authMiddleware, chuyenGiaController.huyHoSo);

// Route công khai: Lấy danh sách Huấn luyện viên PT được xác thực
router.get("/pt", async (req, res) => {
    try {
        const { search, chuyen_mon } = req.query;
        let filter = {};

        if (chuyen_mon && chuyen_mon !== "all") {
            filter.chuyen_mon = { $regex: chuyen_mon, $options: "i" };
        }

        if (search) {
            filter.$or = [
                { ho_ten: { $regex: search, $options: "i" } },
                { chuyen_mon: { $regex: search, $options: "i" } },
                { khu_vuc: { $regex: search, $options: "i" } }
            ];
        }

        const pts = await HuanLuyenVien.find(filter).sort({ rating: -1, createdAt: -1 });
        res.status(200).json({
            success: true,
            total: pts.length,
            data: pts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách HLV PT: " + error.message
        });
    }
});

module.exports = router;
