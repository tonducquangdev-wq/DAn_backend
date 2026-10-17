const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/authMiddleware");
const {
    getHoiThoai,
    getTinNhanVoiNguoiDung,
    guiTinNhan,
    getTongTinChuaDoc,
    xoaTinNhan
} = require("../Controller/api/tinNhanRiengController");

router.use(authMiddleware);

router.get("/hoi-thoai", getHoiThoai);
router.get("/chua-doc/count", getTongTinChuaDoc);
router.get("/user/:partnerId", getTinNhanVoiNguoiDung);
router.post("/", guiTinNhan);
router.delete("/:id", xoaTinNhan);

module.exports = router;
