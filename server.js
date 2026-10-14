const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./Config/db");

// Import Routers
const authRouter = require("./Router/authRouter");
const suKienRouter = require("./Router/suKienRouter");
const monHocRouter = require("./Router/monHocRouter");
const tapLuyenRouter = require("./Router/tapLuyenRouter");
const duAnRouter = require("./Router/duAnRouter");
const dashboardRouter = require("./Router/dashboardRouter");

dotenv.config();
connectDB(); // Gọi kết nối MongoDB

const app = express();

// Middlewares
app.use(cors()); // Cho phép React gọi API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Thư mục chứa file đính kèm/avatar tĩnh
app.use("/public", express.static(path.join(__dirname, "Public")));

// Nạp các Routes API
app.use("/api/auth", authRouter);
app.use("/api/su-kien", suKienRouter);
app.use("/api/tap-luyen", tapLuyenRouter);
app.use("/api", monHocRouter);
app.use("/api", duAnRouter);
app.use("/api", dashboardRouter);

// Phục vụ giao diện Frontend tĩnh từ client/dist (nếu đã build)
const clientDistPath = path.join(__dirname, "client", "dist");
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
}

// Base Route & SPA Fallback cho React
app.get("/", (req, res) => {
    const indexPath = path.join(clientDistPath, "index.html");
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    res.json({
        success: true,
        message: "🚀 Life Planner RESTful API Server đang hoạt động!",
        version: "1.0.0"
    });
});

// Middleware Fallback cho các URL client-side routing của React (nếu client đã build)
app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/public")) {
        const indexPath = path.join(clientDistPath, "index.html");
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    next();
});

// Middleware xử lý 404 cho API và xử lý lỗi toàn cục
const { notFound, errorHandler } = require("./Middleware/errorMiddleware");
app.use("/api", notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Life Planner Server running on http://localhost:${PORT}`);
});

module.exports = { app, server };


