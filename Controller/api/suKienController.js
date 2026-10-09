const SuKien = require("../../Model/SuKien");
const { crypto } = require("crypto");

// Lấy danh sách sự kiện trong khoảng thời gian
const getSuKien = async (req, res) => {
    try {
        const { start_date, end_date, loai_su_kien } = req.query;
        const query = { 
            user_id: req.user._id,
            is_deleted: false 
        };

        if (loai_su_kien) {
            query.loai_su_kien = loai_su_kien;
        }

        if (start_date || end_date) {
            query.thoi_gian_bat_dau = {};
            if (start_date) query.thoi_gian_bat_dau.$gte = new Date(start_date);
            if (end_date) query.thoi_gian_bat_dau.$lte = new Date(end_date);
        }

        const events = await SuKien.find(query).sort({ thoi_gian_bat_dau: 1 });

        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách sự kiện: " + error.message
        });
    }
};

// Tạo sự kiện mới (Hỗ trợ lặp lại: daily, weekly, monthly)
const createSuKien = async (req, res) => {
    try {
        const {
            loai_su_kien, tieu_de, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc,
            dia_diem, mau_sac, quy_tac_lap, bat_thong_bao, so_ngay_nhac, cong_viec_id
        } = req.body;

        if (!tieu_de || !loai_su_kien || !thoi_gian_bat_dau || !thoi_gian_ket_thuc) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đủ Tiêu đề, Loại sự kiện, Thời gian bắt đầu và kết thúc"
            });
        }

        const startDate = new Date(thoi_gian_bat_dau);
        const endDate = new Date(thoi_gian_ket_thuc);
        const duration = endDate.getTime() - startDate.getTime();

        const rule = quy_tac_lap || "once";
        let nhomLapId = null;

        if (rule !== "once") {
            nhomLapId = "repeat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
        }

        const createdEvents = [];
        const maxIterations = rule === "once" ? 1 : rule === "daily" ? 30 : rule === "weekly" ? 12 : 6;

        for (let i = 0; i < maxIterations; i++) {
            const curStart = new Date(startDate);
            if (rule === "daily") {
                curStart.setDate(curStart.getDate() + i);
            } else if (rule === "weekly") {
                curStart.setDate(curStart.getDate() + i * 7);
            } else if (rule === "monthly") {
                curStart.setMonth(curStart.getMonth() + i);
            }

            const curEnd = new Date(curStart.getTime() + duration);

            const event = await SuKien.create({
                user_id: req.user._id,
                cong_viec_id: cong_viec_id || null,
                loai_su_kien,
                tieu_de,
                mo_ta: mo_ta || null,
                thoi_gian_bat_dau: curStart,
                thoi_gian_ket_thuc: curEnd,
                dia_diem: dia_diem || null,
                mau_sac: mau_sac || "#10B981",
                quy_tac_lap: rule,
                nhom_lap_id: nhomLapId,
                bat_thong_bao: typeof bat_thong_bao === "boolean" ? bat_thong_bao : true,
                so_ngay_nhac: so_ngay_nhac || 0
            });

            createdEvents.push(event);
        }

        res.status(201).json({
            success: true,
            message: "Tạo sự kiện thành công",
            data: createdEvents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi tạo sự kiện: " + error.message
        });
    }
};

// Cập nhật sự kiện
const updateSuKien = async (req, res) => {
    try {
        const { id } = req.params;
        const { update_mode } = req.query; // 'single' | 'all'
        const event = await SuKien.findOne({ _id: id, user_id: req.user._id });

        if (!event) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện" });
        }

        const updateData = req.body;
        delete updateData.user_id;

        if (update_mode === "all" && event.nhom_lap_id) {
            await SuKien.updateMany(
                { nhom_lap_id: event.nhom_lap_id, user_id: req.user._id },
                { $set: updateData }
            );
        } else {
            Object.assign(event, updateData);
            await event.save();
        }

        res.status(200).json({
            success: true,
            message: "Cập nhật sự kiện thành công"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi cập nhật sự kiện: " + error.message
        });
    }
};

// Xóa sự kiện (Soft delete)
const deleteSuKien = async (req, res) => {
    try {
        const { id } = req.params;
        const { delete_mode } = req.query; // 'single' | 'all'
        const event = await SuKien.findOne({ _id: id, user_id: req.user._id });

        if (!event) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện" });
        }

        if (delete_mode === "all" && event.nhom_lap_id) {
            await SuKien.updateMany(
                { nhom_lap_id: event.nhom_lap_id, user_id: req.user._id },
                { $set: { is_deleted: true } }
            );
        } else {
            event.is_deleted = true;
            await event.save();
        }

        res.status(200).json({
            success: true,
            message: "Xóa sự kiện thành công"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi xóa sự kiện: " + error.message
        });
    }
};

module.exports = {
    getSuKien,
    createSuKien,
    updateSuKien,
    deleteSuKien
};
