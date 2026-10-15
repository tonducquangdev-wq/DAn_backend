const mongoose = require("mongoose");
const SuKien = require("../../Model/SuKien");

const ALLOWED_EVENT_TYPES = ["hoc-tap", "tap-luyen", "deadline", "ca-nhan", "cong-viec"];
const ALLOWED_REPEAT_RULES = ["once", "daily", "weekly", "monthly"];

// Lấy danh sách sự kiện trong khoảng thời gian
const getSuKien = async (req, res) => {
    try {
        const { start_date, end_date, loai_su_kien } = req.query;
        const query = { 
            user_id: req.user._id,
            is_deleted: false 
        };

        if (loai_su_kien && ALLOWED_EVENT_TYPES.includes(loai_su_kien)) {
            query.loai_su_kien = loai_su_kien;
        }

        if (start_date || end_date) {
            query.thoi_gian_bat_dau = {};
            if (start_date) {
                const sDate = new Date(start_date);
                if (!isNaN(sDate.getTime())) {
                    query.thoi_gian_bat_dau.$gte = sDate;
                }
            }
            if (end_date) {
                const eDate = new Date(end_date);
                if (!isNaN(eDate.getTime())) {
                    query.thoi_gian_bat_dau.$lte = eDate;
                }
            }
            if (Object.keys(query.thoi_gian_bat_dau).length === 0) {
                delete query.thoi_gian_bat_dau;
            }
        }

        const events = await SuKien.find(query).sort({ thoi_gian_bat_dau: 1 });

        return res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi nạp danh sách sự kiện: " + error.message
        });
    }
};

// Tạo sự kiện mới (Hỗ trợ lặp lại: daily, weekly, monthly)
const createSuKien = async (req, res) => {
    try {
        const {
            loai_su_kien, tieu_de, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc,
            dia_diem, mau_sac, quy_tac_lap, bat_thong_bao, so_ngay_nhac, thoi_gian_nhac_truoc, cong_viec_id
        } = req.body;

        if (!tieu_de || typeof tieu_de !== "string" || !tieu_de.trim()) {
            return res.status(400).json({
                success: false,
                message: "Tiêu đề sự kiện không được để trống"
            });
        }

        if (!loai_su_kien || !ALLOWED_EVENT_TYPES.includes(loai_su_kien)) {
            return res.status(400).json({
                success: false,
                message: "Loại sự kiện không hợp lệ"
            });
        }

        let startDate, endDate;
        if (loai_su_kien === "deadline") {
            const deadlineInput = thoi_gian_bat_dau || thoi_gian_ket_thuc;
            if (!deadlineInput) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng chọn thời hạn cho deadline"
                });
            }
            startDate = new Date(deadlineInput);
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Định dạng thời hạn deadline không hợp lệ"
                });
            }
            endDate = thoi_gian_ket_thuc ? new Date(thoi_gian_ket_thuc) : new Date(startDate);
            if (isNaN(endDate.getTime()) || endDate.getTime() < startDate.getTime()) {
                endDate = new Date(startDate);
            }
        } else {
            if (!thoi_gian_bat_dau || !thoi_gian_ket_thuc) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng chọn đầy đủ Thời gian bắt đầu và Thời gian kết thúc"
                });
            }

            startDate = new Date(thoi_gian_bat_dau);
            endDate = new Date(thoi_gian_ket_thuc);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Định dạng thời gian không hợp lệ"
                });
            }

            if (endDate.getTime() <= startDate.getTime()) {
                return res.status(400).json({
                    success: false,
                    message: "Thời gian kết thúc phải lớn hơn thời gian bắt đầu"
                });
            }
        }

        const rule = ALLOWED_REPEAT_RULES.includes(quy_tac_lap) ? quy_tac_lap : "once";
        let nhomLapId = null;

        if (rule !== "once") {
            nhomLapId = "repeat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
        }

        const duration = endDate.getTime() - startDate.getTime();
        const maxIterations = rule === "once" ? 1 : rule === "daily" ? 30 : rule === "weekly" ? 12 : 6;
        const eventsToInsert = [];

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

            eventsToInsert.push({
                user_id: req.user._id,
                cong_viec_id: cong_viec_id || null,
                loai_su_kien,
                tieu_de: tieu_de.trim(),
                mo_ta: mo_ta ? String(mo_ta).trim() : null,
                thoi_gian_bat_dau: curStart,
                thoi_gian_ket_thuc: curEnd,
                dia_diem: dia_diem ? String(dia_diem).trim() : null,
                mau_sac: mau_sac || "#10B981",
                quy_tac_lap: rule,
                nhom_lap_id: nhomLapId,
                bat_thong_bao: typeof bat_thong_bao === "boolean" ? bat_thong_bao : true,
                thoi_gian_nhac_truoc: thoi_gian_nhac_truoc !== undefined ? Number(thoi_gian_nhac_truoc) : 15,
                so_ngay_nhac: Number(so_ngay_nhac) || 0
            });
        }

        const createdEvents = await SuKien.insertMany(eventsToInsert);

        return res.status(201).json({
            success: true,
            message: "Tạo sự kiện thành công",
            data: createdEvents
        });
    } catch (error) {
        return res.status(500).json({
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

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Mã ID sự kiện không hợp lệ"
            });
        }

        const event = await SuKien.findOne({ _id: id, user_id: req.user._id, is_deleted: false });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sự kiện hoặc sự kiện đã bị xóa"
            });
        }

        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.user_id;
        delete updateData.is_deleted;
        delete updateData.nhom_lap_id;

        // Validation nếu sửa tiêu đề
        if (updateData.tieu_de !== undefined) {
            if (typeof updateData.tieu_de !== "string" || !updateData.tieu_de.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Tiêu đề sự kiện không được để trống"
                });
            }
            updateData.tieu_de = updateData.tieu_de.trim();
        }

        // Validation loại sự kiện
        if (updateData.loai_su_kien !== undefined && !ALLOWED_EVENT_TYPES.includes(updateData.loai_su_kien)) {
            return res.status(400).json({
                success: false,
                message: "Loại sự kiện không hợp lệ"
            });
        }

        // Validation quy tắc lặp
        if (updateData.quy_tac_lap !== undefined && !ALLOWED_REPEAT_RULES.includes(updateData.quy_tac_lap)) {
            return res.status(400).json({
                success: false,
                message: "Quy tắc lặp không hợp lệ"
            });
        }

        // Validation thời gian
        const eventType = updateData.loai_su_kien !== undefined ? updateData.loai_su_kien : event.loai_su_kien;
        const newStart = updateData.thoi_gian_bat_dau ? new Date(updateData.thoi_gian_bat_dau) : new Date(event.thoi_gian_bat_dau);
        let newEnd;

        if (isNaN(newStart.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Định dạng thời gian không hợp lệ"
            });
        }

        if (eventType === "deadline") {
            // Đối với deadline, chỉ cần mốc deadline
            newEnd = updateData.thoi_gian_ket_thuc ? new Date(updateData.thoi_gian_ket_thuc) : new Date(newStart);
            if (isNaN(newEnd.getTime()) || newEnd.getTime() < newStart.getTime()) {
                newEnd = new Date(newStart);
            }
        } else {
            newEnd = updateData.thoi_gian_ket_thuc ? new Date(updateData.thoi_gian_ket_thuc) : new Date(event.thoi_gian_ket_thuc || newStart);
            if (isNaN(newEnd.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Định dạng thời gian kết thúc không hợp lệ"
                });
            }

            if (newEnd.getTime() <= newStart.getTime()) {
                return res.status(400).json({
                    success: false,
                    message: "Thời gian kết thúc phải lớn hơn thời gian bắt đầu"
                });
            }
        }

        updateData.thoi_gian_bat_dau = newStart;
        updateData.thoi_gian_ket_thuc = newEnd;

        if (updateData.bat_thong_bao !== undefined) {
            updateData.bat_thong_bao = Boolean(updateData.bat_thong_bao);
        }
        if (updateData.thoi_gian_nhac_truoc !== undefined) {
            updateData.thoi_gian_nhac_truoc = Number(updateData.thoi_gian_nhac_truoc);
        }

        if (update_mode === "all" && event.nhom_lap_id) {
            // Khi sửa toàn bộ chuỗi lặp:
            // Cập nhật thông tin tiêu đề, loại sự kiện, mô tả, địa điểm, màu sắc cho tất cả bản ghi cùng nhom_lap_id
            const bulkFields = {
                tieu_de: updateData.tieu_de !== undefined ? updateData.tieu_de : event.tieu_de,
                loai_su_kien: updateData.loai_su_kien !== undefined ? updateData.loai_su_kien : event.loai_su_kien,
                mo_ta: updateData.mo_ta !== undefined ? updateData.mo_ta : event.mo_ta,
                dia_diem: updateData.dia_diem !== undefined ? updateData.dia_diem : event.dia_diem,
                mau_sac: updateData.mau_sac !== undefined ? updateData.mau_sac : event.mau_sac,
                bat_thong_bao: updateData.bat_thong_bao !== undefined ? Boolean(updateData.bat_thong_bao) : event.bat_thong_bao,
                thoi_gian_nhac_truoc: updateData.thoi_gian_nhac_truoc !== undefined ? Number(updateData.thoi_gian_nhac_truoc) : event.thoi_gian_nhac_truoc,
                so_ngay_nhac: updateData.so_ngay_nhac !== undefined ? updateData.so_ngay_nhac : event.so_ngay_nhac
            };

            await SuKien.updateMany(
                { nhom_lap_id: event.nhom_lap_id, user_id: req.user._id, is_deleted: false },
                { $set: bulkFields }
            );

            return res.status(200).json({
                success: true,
                message: "Cập nhật toàn bộ chuỗi sự kiện lặp thành công"
            });
        } else {
            Object.assign(event, updateData);
            const savedEvent = await event.save();

            return res.status(200).json({
                success: true,
                message: "Cập nhật sự kiện thành công",
                data: savedEvent
            });
        }
    } catch (error) {
        return res.status(500).json({
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

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Mã ID sự kiện không hợp lệ"
            });
        }

        const event = await SuKien.findOne({ _id: id, user_id: req.user._id, is_deleted: false });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sự kiện hoặc sự kiện đã được xóa trước đó"
            });
        }

        if (delete_mode === "all" && event.nhom_lap_id) {
            await SuKien.updateMany(
                { nhom_lap_id: event.nhom_lap_id, user_id: req.user._id, is_deleted: false },
                { $set: { is_deleted: true } }
            );

            return res.status(200).json({
                success: true,
                message: "Xóa toàn bộ chuỗi sự kiện lặp thành công"
            });
        } else {
            event.is_deleted = true;
            await event.save();

            return res.status(200).json({
                success: true,
                message: "Xóa sự kiện thành công"
            });
        }
    } catch (error) {
        return res.status(500).json({
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
