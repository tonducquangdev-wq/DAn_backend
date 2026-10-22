const express = require("express");
const router = express.Router();
const {
    getMonHoc,
    createMonHoc,
    updateMonHoc,
    deleteMonHoc,
    getBaoCaoHocTap,
    getBaiTap,
    createBaiTap,
    updateBaiTap,
    deleteBaiTap,
    getGiaSu
} = require("../Controller/api/monHocController");
const authMiddleware = require("../Middleware/authMiddleware");
const { optionalAuth } = require("../Middleware/authMiddleware");

// Public / Semi-public Gia sư route
router.get("/gia-su", optionalAuth, getGiaSu);

// Protected Môn học routes
router.get("/mon-hoc", authMiddleware, getMonHoc);
router.post("/mon-hoc", authMiddleware, createMonHoc);
router.put("/mon-hoc/:id", authMiddleware, updateMonHoc);
router.delete("/mon-hoc/:id", authMiddleware, deleteMonHoc);

// Protected Báo cáo học tập
router.get("/bao-cao-hoc-tap", authMiddleware, getBaoCaoHocTap);

// Protected Bài tập routes
router.get("/bai-tap", authMiddleware, getBaiTap);
router.post("/bai-tap", authMiddleware, createBaiTap);
router.put("/bai-tap/:id", authMiddleware, updateBaiTap);
router.delete("/bai-tap/:id", authMiddleware, deleteBaiTap);

module.exports = router;

