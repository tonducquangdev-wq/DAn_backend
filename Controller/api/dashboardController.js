const SuKien = require("../../Model/SuKien");
const MonHoc = require("../../Model/MonHoc");
const BaiTap = require("../../Model/BaiTap");
const LichSuTapLuyen = require("../../Model/LichSuTapLuyen");
const ThongBao = require("../../Model/ThongBao");
const MucTieu = require("../../Model/MucTieu");

// Tổng hợp chỉ số KPI Toàn hệ thống cho Dashboard
const getDashboardKPI = async (req, res) => {
    try {
        const userId = req.user._id;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // 1. Sự kiện hôm nay
        const todayEvents = await SuKien.find({
            user_id: userId,
            is_deleted: false,
            thoi_gian_bat_dau: { $gte: startOfToday, $lte: endOfToday }
        }).sort({ thoi_gian_bat_dau: 1 });

        // 2. Bài tập deadline sắp tới (chưa hoàn thành)
        const upcomingDeadlines = await BaiTap.find({
            user_id: userId,
            trang_thai: { $ne: "da_hoan_thanh" },
            han_nop: { $gte: startOfToday }
        })
            .populate("mon_hoc_id", "ten_mon mau_sac")
            .sort({ han_nop: 1 })
            .limit(5);

        // 3. Số môn học đang học
        const activeSubjectsCount = await MonHoc.countDocuments({
            user_id: userId,
            trang_thai: "dang_hoc",
            is_deleted: false
        });

        // 4. Tổng buổi tập luyện đã xong
        const completedWorkoutsCount = await LichSuTapLuyen.countDocuments({
            user_id: userId
        });

        // 5. Mục tiêu cá nhân
        const mucTieus = await MucTieu.find({ user_id: userId });

        // 6. Thông báo chưa đọc
        const unreadNotificationsCount = await ThongBao.countDocuments({
            user_id: userId,
            da_doc: false
        });

        res.status(200).json({
            success: true,
            data: {
                su_kien_hom_nay: todayEvents,
                deadline_sap_toi: upcomingDeadlines,
                so_mon_dang_hoc: activeSubjectsCount,
                so_buoi_tap_da_xong: completedWorkoutsCount,
                muc_tieu: mucTieus,
                thong_bao_chua_doc: unreadNotificationsCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi tổng hợp KPI Dashboard: " + error.message
        });
    }
};

// Quản lý Thông báo
const getThongBao = async (req, res) => {
    try {
        const thongBaos = await ThongBao.find({ user_id: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: thongBaos });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy thông báo: " + error.message });
    }
};

const markThongBaoAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await ThongBao.updateOne({ _id: id, user_id: req.user._id }, { $set: { da_doc: true } });
        res.status(200).json({ success: true, message: "Đã đánh dấu đọc thông báo" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi đánh dấu đọc: " + error.message });
    }
};

module.exports = {
    getDashboardKPI,
    getThongBao,
    markThongBaoAsRead
};
