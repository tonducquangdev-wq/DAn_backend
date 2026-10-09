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

router.use(authMiddleware);

// Routes Dự án
router.get("/du-an", getDuAn);
router.post("/du-an", createDuAn);
router.put("/du-an/:id", updateDuAn);
router.delete("/du-an/:id", deleteDuAn);

// Routes Công việc Task
router.get("/cong-viec", getCongViec);
router.post("/cong-viec", createCongViec);
router.put("/cong-viec/:id", updateCongViec);
router.delete("/cong-viec/:id", deleteCongViec);

module.exports = router;
