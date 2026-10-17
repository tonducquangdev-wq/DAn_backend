const express = require("express");
const router = express.Router();
const { 
    getDashboardKPI, 
    getThongBao, 
    markThongBaoAsRead,
    markAllThongBaoAsRead,
    deleteThongBao
} = require("../Controller/api/dashboardController");
const authMiddleware = require("../Middleware/authMiddleware");

router.get("/dashboard", authMiddleware, getDashboardKPI);
router.get("/thong-bao", authMiddleware, getThongBao);
router.patch("/thong-bao/read-all", authMiddleware, markAllThongBaoAsRead);
router.patch("/thong-bao/:id/read", authMiddleware, markThongBaoAsRead);
router.delete("/thong-bao/:id", authMiddleware, deleteThongBao);

module.exports = router;

