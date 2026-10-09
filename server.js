const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
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

// Base Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 Life Planner RESTful API Server đang hoạt động!",
        version: "1.0.0"
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
