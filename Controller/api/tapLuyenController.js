const KeHoachTapLuyen = require("../../Model/KeHoachTapLuyen");
const BuoiTap = require("../../Model/BuoiTap");
const ChiTietBuoiTap = require("../../Model/ChiTietBuoiTap");
const LichSuTapLuyen = require("../../Model/LichSuTapLuyen");
const BaiTapTheChat = require("../../Model/BaiTapTheChat");

// 1. Lấy Lịch trình 7 ngày của Kế hoạch đang kích hoạt (active)
const getWorkoutSchedule = async (req, res) => {
    try {
        let activePlan = await KeHoachTapLuyen.findOne({ user_id: req.user._id, is_active: true });

        if (!activePlan) {
            // Nếu chưa có kế hoạch nào, tạo mặc định 1 kế hoạch mẫu
            activePlan = await KeHoachTapLuyen.create({
                user_id: req.user._id,
                ten_ke_hoach: "Giáo Án Tập Gym 7 Ngày Mẫu",
                mo_ta: "Kế hoạch tăng cơ giảm mỡ tiêu chuẩn",
                is_active: true
            });

            // Seed 3 buổi tập
            const b1 = await BuoiTap.create({ ke_hoach_tap_luyen_id: activePlan._id, ten_buoi_tap: "Buổi 1: Ngực & Tay Sau", ngay_trong_tuan: 2 });
            const b2 = await BuoiTap.create({ ke_hoach_tap_luyen_id: activePlan._id, ten_buoi_tap: "Buổi 2: Lưng & Tay Trước", ngay_trong_tuan: 4 });
            const b3 = await BuoiTap.create({ ke_hoach_tap_luyen_id: activePlan._id, ten_buoi_tap: "Buổi 3: Chân & Bụng", ngay_trong_tuan: 6 });
        }

        const buoiTaps = await BuoiTap.find({ ke_hoach_tap_luyen_id: activePlan._id }).sort({ ngay_trong_tuan: 1 });

        // Lấy chi tiết bài tập cho từng buổi
        const buoiTapWithDetails = await Promise.all(
            buoiTaps.map(async (buoi) => {
                const details = await ChiTietBuoiTap.find({ buoi_tap_id: buoi._id }).populate("bai_tap_the_chat_id");
                return {
                    ...buoi.toObject(),
                    chi_tiet: details
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                ke_hoach: activePlan,
                danh_sach_buoi_tap: buoiTapWithDetails
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy lịch tập: " + error.message });
    }
};

// 2. Ghi nhận hoàn thành buổi tập & tính Workout Streak
const completeWorkoutSession = async (req, res) => {
    try {
        const { buoi_tap_id, thoi_gian_tap_phut, ghi_chu, ngay_tap } = req.body;

        const workoutDate = ngay_tap ? new Date(ngay_tap) : new Date();

        const log = await LichSuTapLuyen.create({
            user_id: req.user._id,
            buoi_tap_id: buoi_tap_id || null,
            ngay_tap: workoutDate,
            thoi_gian_tap_phut: thoi_gian_tap_phut ? Number(thoi_gian_tap_phut) : 45,
            ghi_chu: ghi_chu || "Hoàn thành buổi tập!"
        });

        // Tính toán Streak (Chuỗi ngày tập liên tiếp)
        const logs = await LichSuTapLuyen.find({ user_id: req.user._id }).sort({ ngay_tap: -1 });

        let streak = 0;
        let today = new Date();
        today.setHours(0, 0, 0, 0);

        const uniqueDates = new Set(
            logs.map(l => new Date(l.ngay_tap).toISOString().split('T')[0])
        );

        const sortedDates = Array.from(uniqueDates).sort().reverse();
        
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);

        for (let dStr of sortedDates) {
            const d = new Date(dStr);
            d.setHours(0, 0, 0, 0);
            const diffDays = Math.round((checkDate - d) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 1) {
                streak++;
                checkDate = d;
            } else {
                break;
            }
        }

        res.status(200).json({
            success: true,
            message: "Đã ghi nhận hoàn thành buổi tập! 🔥 Streak hiện tại: " + streak + " ngày",
            data: {
                log,
                streak
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hoàn thành buổi tập: " + error.message });
    }
};

// 3. Báo cáo Tập luyện (Monthly Heatmap & Tỷ lệ nhóm cơ)
const getWorkoutReport = async (req, res) => {
    try {
        const logs = await LichSuTapLuyen.find({ user_id: req.user._id }).sort({ ngay_tap: -1 });

        // Heatmap data map theo YYYY-MM-DD -> level (1-4)
        const heatmapMap = {};
        let totalMinutes = 0;

        logs.forEach(l => {
            const dateKey = new Date(l.ngay_tap).toISOString().split('T')[0];
            const mins = l.thoi_gian_tap_phut || 30;
            totalMinutes += mins;

            let level = 1;
            if (mins >= 60) level = 4;
            else if (mins >= 45) level = 3;
            else if (mins >= 30) level = 2;

            heatmapMap[dateKey] = Math.max(heatmapMap[dateKey] || 0, level);
        });

        res.status(200).json({
            success: true,
            data: {
                tong_buoi_tap: logs.length,
                tong_thoi_gian_phut: totalMinutes,
                heatmap: heatmapMap
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo báo cáo tập luyện: " + error.message });
    }
};

module.exports = {
    getWorkoutSchedule,
    completeWorkoutSession,
    getWorkoutReport
};
