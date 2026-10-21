const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { 
    register, 
    login, 
    adminLogin,
    getMe, 
    updateProfile, 
    changePassword 
} = require("../Controller/api/authController");
const authMiddleware = require("../Middleware/authMiddleware");

// Middleware chặn và trả về lỗi validation nếu có
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
};

// Ràng buộc kiểm tra tính hợp lệ dữ liệu đăng ký (Registration Validation Rules)
const registerValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Vui lòng nhập họ và tên của bạn")
        .isLength({ min: 2 }).withMessage("Họ và tên phải có tối thiểu 2 ký tự"),
    body("email")
        .trim()
        .notEmpty().withMessage("Vui lòng nhập địa chỉ email")
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        .withMessage("Email không đúng định dạng hợp lệ (Ví dụ: name@gmail.com)"),
    body("password")
        .notEmpty().withMessage("Vui lòng nhập mật khẩu")
        .isLength({ min: 6 }).withMessage("Mật khẩu phải có độ dài tối thiểu 6 ký tự")
];

// Ràng buộc kiểm tra tính hợp lệ dữ liệu đăng nhập
const loginValidator = [
    body("email").trim().notEmpty().withMessage("Vui lòng nhập email đăng nhập"),
    body("password").notEmpty().withMessage("Vui lòng nhập mật khẩu")
];

// Public Auth routes (Bảo vệ bằng express-validator)
router.post("/register", registerValidator, handleValidationErrors, register);
router.post("/login", loginValidator, handleValidationErrors, login);
router.post("/admin-login", loginValidator, handleValidationErrors, adminLogin);

// Protected Profile routes
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateProfile);
router.put("/me/password", authMiddleware, changePassword);

module.exports = router;