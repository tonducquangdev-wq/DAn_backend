const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../Model/User");

// Hàm sinh JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId }, 
        process.env.JWT_SECRET || "life_planner_secret_key_2026", 
        { expiresIn: "7d" }
    );
};

// Đăng ký tài khoản mới
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email này đã được đăng ký trong hệ thống"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = generateToken(user._id);

        const userData = user.toObject();
        delete userData.password;

        res.status(201).json({
            success: true,
            message: "Đăng ký tài khoản thành công",
            data: {
                user: userData,
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi đăng ký: " + error.message
        });
    }
};

// Đăng nhập
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập Email và Mật khẩu"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không chính xác"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không chính xác"
            });
        }

        const token = generateToken(user._id);
        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            data: {
                user: userData,
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi đăng nhập: " + error.message
        });
    }
};

// Đăng nhập dành riêng cho Cổng Quản Trị Viên (Admin Portal)
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập Email và Mật khẩu Quản trị"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản hoặc mật khẩu Quản trị không chính xác"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản hoặc mật khẩu Quản trị không chính xác"
            });
        }

        // Kiểm tra quyền Quản trị viên nghiêm ngặt
        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Từ chối truy cập: Tài khoản của bạn không có quyền Quản Trị Viên (Admin)!"
            });
        }

        const token = generateToken(user._id);
        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({
            success: true,
            message: "Đăng nhập Cổng Quản Trị thành công! Chào mừng Quản Trị Viên.",
            data: {
                user: userData,
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi đăng nhập Quản trị: " + error.message
        });
    }
};

// Lấy thông tin cá nhân hiện tại
const getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy thông tin người dùng: " + error.message
        });
    }
};

// Cập nhật thông tin & cài đặt cá nhân
const updateProfile = async (req, res) => {
    try {
        const { 
            name, email, theme_mode, language, 
            notify_events, notify_deadlines, notify_workouts, notify_sound, notify_lead_time
        } = req.body;

        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (email) user.email = email;
        if (theme_mode) user.theme_mode = theme_mode;
        if (language) user.language = language;
        if (typeof notify_events === "boolean") user.notify_events = notify_events;
        if (typeof notify_deadlines === "boolean") user.notify_deadlines = notify_deadlines;
        if (typeof notify_workouts === "boolean") user.notify_workouts = notify_workouts;
        if (typeof notify_sound === "boolean") user.notify_sound = notify_sound;
        if (notify_lead_time !== undefined) user.notify_lead_time = Number(notify_lead_time) || 15;

        await user.save();

        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({
            success: true,
            message: "Cập nhật thông tin cá nhân thành công",
            data: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi cập nhật cá nhân: " + error.message
        });
    }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới"
            });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(current_password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu hiện tại không đúng"
            });
        }

        user.password = await bcrypt.hash(new_password, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Đổi mật khẩu thành công"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi đổi mật khẩu: " + error.message
        });
    }
};

module.exports = {
    register,
    login,
    adminLogin,
    getMe,
    updateProfile,
    changePassword
};