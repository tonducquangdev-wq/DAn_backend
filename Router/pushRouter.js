const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/authMiddleware");
const {
    getPublicKey,
    subscribe,
    unsubscribe,
    testPush,
    getDailyBriefingSettings,
    updateDailyBriefingSettings,
    testDailyBriefing
} = require("../Controller/api/pushNotificationController");

// Public key có thể lấy không cần đăng nhập
router.get("/public-key", getPublicKey);

// Các thao tác đăng ký / gửi thử cần đăng nhập
router.post("/subscribe", authMiddleware, subscribe);
router.post("/unsubscribe", authMiddleware, unsubscribe);
router.post("/test", authMiddleware, testPush);

// Cài đặt và gửi thử thông báo tổng hợp sự kiện trong ngày (Daily Briefing)
router.get("/daily-briefing", authMiddleware, getDailyBriefingSettings);
router.put("/daily-briefing", authMiddleware, updateDailyBriefingSettings);
router.post("/daily-briefing/test", authMiddleware, testDailyBriefing);

module.exports = router;
