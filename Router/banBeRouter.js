const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/authMiddleware");
const {
    getDanhSachBanBe,
    getLoiMoiKetBan,
    guiLoiMoiKetBan,
    chapNhanLoiMoi,
    tuChoiLoiMoi,
    huyKetBan,
    timKiemNguoiDung
} = require("../Controller/api/banBeController");

router.use(authMiddleware);

router.get("/", getDanhSachBanBe);
router.get("/loi-moi", getLoiMoiKetBan);
router.get("/tim-kiem", timKiemNguoiDung);
router.post("/loi-moi", guiLoiMoiKetBan);
router.patch("/loi-moi/:id/chap-nhan", chapNhanLoiMoi);
router.delete("/loi-moi/:id", tuChoiLoiMoi);
router.delete("/:friendUserId", huyKetBan);

module.exports = router;
