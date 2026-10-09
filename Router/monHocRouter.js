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

// Public Gia sư route
router.get("/gia-su", getGiaSu);

// Protected routes
router.use(authMiddleware);

router.get("/mon-hoc", getMonHoc);
router.post("/mon-hoc", createMonHoc);
router.put("/mon-hoc/:id", updateMonHoc);
router.delete("/mon-hoc/:id", deleteMonHoc);

router.get("/bao-cao-hoc-tap", getBaoCaoHocTap);

router.get("/bai-tap", getBaiTap);
router.post("/bai-tap", createBaiTap);
router.put("/bai-tap/:id", updateBaiTap);
router.delete("/bai-tap/:id", deleteBaiTap);

module.exports = router;
