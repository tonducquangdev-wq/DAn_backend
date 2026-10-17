/**
 * Middleware kiểm tra phân quyền người dùng (Role-Based Access Control)
 * Sử dụng sau authMiddleware
 * @param  {...string} allowedRoles - Danh sách các quyền được phép (ví dụ: 'admin', 'tutor', 'pt')
 */
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin xác thực người dùng."
            });
        }

        // Kiểm tra xem tài khoản có bị khóa không
        if (req.user.status === "banned") {
            return res.status(403).json({
                success: false,
                message: "Tài khoản của bạn đã bị tạm khóa do vi phạm chính sách hệ thống. Vui lòng liên hệ quản trị viên."
            });
        }

        // Nếu không yêu cầu role cụ thể, hoặc role của user nằm trong danh sách cho phép
        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Quyền truy cập bị từ chối. Chức năng này yêu cầu quyền [${allowedRoles.join(" hoặc ")}].`
            });
        }

        next();
    };
};

module.exports = { checkRole };
