const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/authMiddleware");
const {
    getTinNhan,
    guiTinNhan,
    reactTinNhan,
    xoaTinNhan
} = require("../Controller/api/chatTapLuyenController");

// Tất cả các thao tác chat đều yêu cầu đăng nhập
router.use(authMiddleware);

router.get("/", getTinNhan);
router.post("/", guiTinNhan);
router.post("/:id/react", reactTinNhan);
router.delete("/:id", xoaTinNhan);

module.exports = router;
