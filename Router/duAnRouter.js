const express = require("express");
const router = express.Router();
const {
    getDuAn,
    createDuAn,
    updateDuAn,
    deleteDuAn,
    getCongViec,
    createCongViec,
    updateCongViec,
    deleteCongViec
} = require("../Controller/api/duAnController");
const authMiddleware = require("../Middleware/authMiddleware");

// Routes Dự án
router.get("/du-an", authMiddleware, getDuAn);
router.post("/du-an", authMiddleware, createDuAn);
router.put("/du-an/:id", authMiddleware, updateDuAn);
router.delete("/du-an/:id", authMiddleware, deleteDuAn);

// Routes Công việc Task
router.get("/cong-viec", authMiddleware, getCongViec);
router.post("/cong-viec", authMiddleware, createCongViec);
router.put("/cong-viec/:id", authMiddleware, updateCongViec);
router.delete("/cong-viec/:id", authMiddleware, deleteCongViec);

module.exports = router;

