const bcrypt = require("bcryptjs");
const User = require("../Model/User");

const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@lifeplanner.com";
        const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin123456";

        let adminUser = await User.findOne({ email: adminEmail });
        if (!adminUser) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            adminUser = await User.create({
                name: "Quản Trị Viên Hệ Thống",
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
                status: "active",
                bio: "Quản trị viên cấp cao của hệ thống Life Planner"
            });
            console.log(`👑 [ADMIN] Đã khởi tạo tài khoản Quản trị viên mặc định: ${adminEmail} | Mật khẩu: ${adminPassword}`);
        } else if (adminUser.role !== "admin") {
            adminUser.role = "admin";
            await adminUser.save();
            console.log(`👑 [ADMIN] Đã đồng bộ quyền Admin cho tài khoản: ${adminEmail}`);
        }

        // Cập nhật các user cũ chưa có role về 'user'
        await User.updateMany({ role: { $exists: false } }, { $set: { role: "user", status: "active" } });
    } catch (error) {
        console.error("⚠️ Lỗi khởi tạo tài khoản Admin mặc định:", error.message);
    }
};

module.exports = seedAdmin;
