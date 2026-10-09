const express = require("express");
const router = express.Router();
const { 
    getWorkoutSchedule, 
    completeWorkoutSession, 
    getWorkoutReport 
} = require("../Controller/api/tapLuyenController");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);

router.get("/schedule", getWorkoutSchedule);
router.post("/hoan-thanh", completeWorkoutSession);
router.get("/report", getWorkoutReport);

module.exports = router;
