const jwt = require("jsonwebtoken");
const User = require("../Model/User");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy Token xác thực. Vui lòng đăng nhập lại."
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "life_planner_secret_key_2026");

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản không tồn tại hoặc Token không hợp lệ."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Xác thực không thành công: " + error.message
        });
    }
};

module.exports = authMiddleware;
