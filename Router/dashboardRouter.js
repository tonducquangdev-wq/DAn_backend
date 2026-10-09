const express = require("express");
const router = express.Router();
const { 
    getDashboardKPI, 
    getThongBao, 
    markThongBaoAsRead 
} = require("../Controller/api/dashboardController");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);

router.get("/dashboard", getDashboardKPI);
router.get("/thong-bao", getThongBao);
router.patch("/thong-bao/:id/read", markThongBaoAsRead);

module.exports = router;
