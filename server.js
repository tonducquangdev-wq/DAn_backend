const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./Config/db");

// Đường dẫn riêng cho Admin Portal (bí mật, đặt trong .env: ADMIN_PATH)
const ADMIN_PATH = process.env.ADMIN_PATH || "/lp-admin-secure";
const adminIndexPath = path.join(__dirname, "client", "dist", "index.html");

// Import Routers
const authRouter = require("./Router/authRouter");
const suKienRouter = require("./Router/suKienRouter");
const monHocRouter = require("./Router/monHocRouter");
const tapLuyenRouter = require("./Router/tapLuyenRouter");
const duAnRouter = require("./Router/duAnRouter");
const dashboardRouter = require("./Router/dashboardRouter");
const chuyenGiaRouter = require("./Router/chuyenGiaRouter");
const adminRouter = require("./Router/adminRouter");
const chatTapLuyenRouter = require("./Router/chatTapLuyenRouter");
const banBeRouter = require("./Router/banBeRouter");
const tinNhanRiengRouter = require("./Router/tinNhanRiengRouter");
const pushRouter = require("./Router/pushRouter");
const syncExpertUsers = require("./Utils/syncExpertUsers");
const { startDailyBriefingScheduler } = require("./Utils/dailyBriefingScheduler");

// Ensure we have proper VAPID keys loaded upon startup
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("⚠️ VAPID keys not found in environment variables. Falling back to hardcoded keys.");
}

connectDB().then(() => {
    syncExpertUsers();
    startDailyBriefingScheduler();
});

const app = express();

// Middlewares
const allowedOrigins = [
  "https://life-planner-lemon.vercel.app",
  "http://localhost:5000",
  "http://localhost:3000"
];
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép mọi yêu cầu không có origin (curl, postman, mobile...)
    if (!origin) return callback(null, true);

    // Cho phép production domain
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Cho phép mọi cổng localhost (dev)
    if (origin.startsWith("http://localhost:")) return callback(null, true);

    // Cho phép IP LAN (Wi-Fi, Radmin VPN, v.v.): http://192.168.x.x, http://10.x.x.x, http://172.16-31.x.x
    if (/^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"]
}));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Thư mục chứa file đính kèm/avatar tĩnh
app.use("/public", express.static(path.join(__dirname, "Public")));

// Health check endpoint cho cron-job.org (tránh bị hiểu nhầm server ngủ/lỗi)
app.get("/ping", (req, res) => res.status(200).send("OK"));

// Route riêng cho Admin Portal (chỉ serve khi đúng ADMIN_PATH bí mật)
app.get(ADMIN_PATH, (req, res) => {
    if (fs.existsSync(adminIndexPath)) {
        return res.sendFile(adminIndexPath);
    }
    return res.status(404).json({ success: false, message: "Admin frontend not found" });
});

// Nạp các Routes API
app.use("/api/auth", authRouter);
app.use("/api/su-kien", suKienRouter);
app.use("/api/tap-luyen", tapLuyenRouter);
app.use("/api/chat-tap-luyen", chatTapLuyenRouter);
app.use("/api/ban-be", banBeRouter);
app.use("/api/tin-nhan-rieng", tinNhanRiengRouter);
app.use("/api/push", pushRouter);
app.use("/api/chuyen-gia", chuyenGiaRouter);
app.use("/api/admin", adminRouter);
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
    if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/public") && req.path !== ADMIN_PATH) {
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

const PORT = parseInt(process.env.PORT) || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Life Planner Server running on port ${PORT}`);
});

module.exports = { app, server };


