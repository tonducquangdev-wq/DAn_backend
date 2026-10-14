/**
 * Middleware tập trung xử lý lỗi và 404 cho RESTful API Life Planner
 */

// Xử lý Route không tồn tại (404 Not Found)
const notFound = (req, res, next) => {
    const error = new Error(`Không tìm thấy tài nguyên API: ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Middleware xử lý lỗi toàn cục (Global Error Handler)
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || "Đã xảy ra lỗi máy chủ nội bộ";

    // Xử lý lỗi Mongoose CastError (ObjectId không đúng định dạng)
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = 400;
        message = "Định dạng định danh (ObjectId) không hợp lệ";
    }

    // Xử lý lỗi Mongoose ValidationError (Dữ liệu không khớp schema)
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }

    // Xử lý lỗi JWT Token không hợp lệ hoặc hết hạn
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Token xác thực không hợp lệ. Vui lòng đăng nhập lại.";
    }
    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

module.exports = {
    notFound,
    errorHandler
};
