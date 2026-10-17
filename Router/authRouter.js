const express = require("express");
const router = express.Router();
const { 
    register, 
    login, 
    adminLogin,
    getMe, 
    updateProfile, 
    changePassword 
} = require("../Controller/api/authController");
const authMiddleware = require("../Middleware/authMiddleware");

// Public Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);

// Protected Profile routes
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateProfile);
router.put("/me/password", authMiddleware, changePassword);

module.exports = router;