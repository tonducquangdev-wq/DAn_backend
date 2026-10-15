const express = require("express");
const router = express.Router();
const { 
    getWorkoutSchedule, 
    getAllWorkoutPlans,
    createWorkoutPlan,
    updateWorkoutPlan,
    activateWorkoutPlan,
    deleteWorkoutPlan,
    updateBuoiTap,
    addExerciseToBuoiTap,
    updateExerciseDetail,
    deleteExerciseDetail,
    getExerciseCatalog,
    completeWorkoutSession, 
    getWorkoutReport,
    syncWorkoutPlanEndpoint,
    generateShareCodeForPlan,
    previewPlanByShareCode,
    importPlanByShareCode,
    getCommunityExplorePlans,
    toggleLikeCommunityPlan
} = require("../Controller/api/tapLuyenController");
const authMiddleware = require("../Middleware/authMiddleware");

// Toàn bộ các API tập luyện đều yêu cầu xác thực JWT Bearer Token
router.use(authMiddleware);

// 1. Lịch trình 7 ngày & Báo cáo
router.get("/schedule", getWorkoutSchedule);
router.post("/hoan-thanh", completeWorkoutSession);
router.get("/report", getWorkoutReport);

// 2. Quản lý Kế hoạch tập luyện cá nhân (CRUD & Kích hoạt)
router.get("/plans", getAllWorkoutPlans);
router.post("/plans", createWorkoutPlan);
router.put("/plans/:id", updateWorkoutPlan);
router.patch("/plans/:id/activate", activateWorkoutPlan);
router.post("/plans/:id/dong-bo-lich", syncWorkoutPlanEndpoint);
router.delete("/plans/:id", deleteWorkoutPlan);
router.post("/plans/:id/share-code", generateShareCodeForPlan);

// 3. Quản lý Buổi tập & Bài tập
router.put("/buoi-tap/:id", updateBuoiTap);
router.post("/buoi-tap/:id/exercises", addExerciseToBuoiTap);
router.put("/chi-tiet/:id", updateExerciseDetail);
router.delete("/chi-tiet/:id", deleteExerciseDetail);
router.get("/exercises", getExerciseCatalog);

// 4. Cộng đồng Gymmer & Chia sẻ mã code (Community Hub)
router.get("/community/explore", getCommunityExplorePlans);
router.get("/community/preview/:code", previewPlanByShareCode);
router.post("/community/import", importPlanByShareCode);
router.post("/community/:id/like", toggleLikeCommunityPlan);

module.exports = router;
