const mongoose = require("mongoose");
const SuKien = require("../../Model/SuKien");

const ALLOWED_EVENT_TYPES = ["hoc-tap", "tap-luyen", "deadline", "ca-nhan", "cong-viec"];
const ALLOWED_REPEAT_RULES = ["once", "daily", "weekly", "monthly", "yearly"];

// Bảng màu chuẩn đồng bộ tuyệt đối với Thể loại sự kiện trên thanh lọc
const EVENT_DEFAULT_COLORS = {
    "hoc-tap": "#3b82f6",    // Xanh dương
    "tap-luyen": "#10b981",  // Xanh lá
    "deadline": "#f59e0b",   // Cam vàng
    "ca-nhan": "#8b5cf6",    // Tím
    "cong-viec": "#6366f1"   // Xanh chàm
};

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
            ngay_ket_thuc_lap, dia_diem, mau_sac, do_uu_tien, quy_tac_lap, so_lan_lap, bat_thong_bao, so_ngay_nhac, thoi_gian_nhac_truoc, cong_viec_id
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

        let sessionDurationMs;
        if (rule === "once") {
            sessionDurationMs = Math.max(0, endDate.getTime() - startDate.getTime());
        } else {
            // Đối với sự kiện lặp, thời lượng mỗi buổi tính theo khoảng thời gian trong ngày
            let diffMs = endDate.getTime() - startDate.getTime();
            if (diffMs <= 0) {
                const sH = startDate.getHours();
                const sM = startDate.getMinutes();
                const eH = endDate.getHours();
                const eM = endDate.getMinutes();
                diffMs = (eH * 60 + eM - (sH * 60 + sM)) * 60 * 1000;
            }
            if (diffMs <= 0) diffMs = 3600 * 1000; // Mặc định 1 tiếng nếu không xác định
            sessionDurationMs = diffMs;
        }

        // Hạn chót kết thúc của chuỗi lặp (ngay_ket_thuc_lap hoặc endDate)
        let repeatCutoff;
        if (ngay_ket_thuc_lap) {
            repeatCutoff = new Date(ngay_ket_thuc_lap);
            repeatCutoff.setHours(23, 59, 59, 999);
        } else {
            repeatCutoff = new Date(endDate);
            repeatCutoff.setHours(23, 59, 59, 999);
        }

        // Giới hạn số lần lặp linh hoạt theo cấu hình người dùng (so_lan_lap):
        // daily: tối đa 365 ngày
        // weekly: tối đa 104 tuần (~ 2 năm)
        // monthly: tối đa 60 tháng (~ 5 năm)
        // yearly: tối đa 10 năm
        const parsedCount = parseInt(so_lan_lap, 10);
        let maxIterations = 1;
        if (rule === "daily") {
            maxIterations = parsedCount > 0 ? Math.min(parsedCount, 365) : 365;
        } else if (rule === "weekly") {
            maxIterations = parsedCount > 0 ? Math.min(parsedCount, 104) : 104;
        } else if (rule === "monthly") {
            maxIterations = parsedCount > 0 ? Math.min(parsedCount, 60) : 60;
        } else if (rule === "yearly") {
            maxIterations = parsedCount > 0 ? Math.min(parsedCount, 10) : 10;
        }

        const eventsToInsert = [];

        for (let i = 0; i < maxIterations; i++) {
            let curStart;
            if (rule === "daily") {
                curStart = new Date(startDate);
                curStart.setDate(curStart.getDate() + i);
            } else if (rule === "weekly") {
                curStart = new Date(startDate);
                curStart.setDate(curStart.getDate() + i * 7);
            } else if (rule === "monthly") {
                // Thuật toán tính ngày hàng tháng an toàn, tránh tràn ngày cuối tháng (ví dụ ngày 31 nhảy sang tháng 3 nếu là tháng 2)
                const targetYear = startDate.getFullYear();
                const targetMonth = startDate.getMonth() + i;
                const origDate = startDate.getDate();
                const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                const actualDate = Math.min(origDate, lastDayOfTargetMonth);

                curStart = new Date(startDate);
                curStart.setFullYear(targetYear, targetMonth, actualDate);
            } else if (rule === "yearly") {
                // Thuật toán tính ngày hàng năm an toàn, xử lý năm nhuận 29/02 sang 28/02 ở năm thường
                const targetYear = startDate.getFullYear() + i;
                const targetMonth = startDate.getMonth();
                const origDate = startDate.getDate();
                const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                const actualDate = Math.min(origDate, lastDayOfTargetMonth);

                curStart = new Date(startDate);
                curStart.setFullYear(targetYear, targetMonth, actualDate);
            } else {
                curStart = new Date(startDate);
            }

            // Nếu ngày bắt đầu của buổi lặp này đã vượt quá ngày kết thúc chuỗi lặp do người dùng đặt
            if (rule !== "once" && curStart.getTime() > repeatCutoff.getTime()) {
                break;
            }

            const curEnd = loai_su_kien === "deadline" ? new Date(curStart) : new Date(curStart.getTime() + sessionDurationMs);

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
            message: rule === "once" ? "Tạo sự kiện thành công" : `Tạo chuỗi sự kiện lặp thành công (${createdEvents.length} sự kiện)`,
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
            const newRule = updateData.quy_tac_lap || event.quy_tac_lap;

            // Trường hợp 1: Đổi quy tắc lặp thành "once" (hủy lặp toàn bộ chuỗi)
            if (newRule === "once" && event.quy_tac_lap !== "once") {
                // Xóa mềm tất cả các sự kiện khác trong cùng chuỗi lặp
                await SuKien.updateMany(
                    { nhom_lap_id: event.nhom_lap_id, _id: { $ne: event._id }, user_id: req.user._id, is_deleted: false },
                    { $set: { is_deleted: true } }
                );

                updateData.nhom_lap_id = null;
                updateData.quy_tac_lap = "once";
                Object.assign(event, updateData);
                const saved = await event.save();

                return res.status(200).json({
                    success: true,
                    message: "Đã hủy chuỗi lặp và chuyển sự kiện thành một lần duy nhất",
                    data: saved
                });
            }

            // Trường hợp 2: Đổi sang một quy tắc lặp khác (ví dụ weekly sang daily hoặc monthly)
            if (newRule !== event.quy_tac_lap) {
                // Xóa mềm tất cả các sự kiện khác trong chuỗi lặp cũ
                await SuKien.updateMany(
                    { nhom_lap_id: event.nhom_lap_id, _id: { $ne: event._id }, user_id: req.user._id, is_deleted: false },
                    { $set: { is_deleted: true } }
                );

                const newNhomLapId = "repeat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
                updateData.nhom_lap_id = newNhomLapId;
                updateData.quy_tac_lap = newRule;

                let diffMs = newEnd.getTime() - newStart.getTime();
                if (diffMs <= 0) {
                    const sH = newStart.getHours();
                    const sM = newStart.getMinutes();
                    const eH = newEnd.getHours();
                    const eM = newEnd.getMinutes();
                    diffMs = (eH * 60 + eM - (sH * 60 + sM)) * 60 * 1000;
                }
                if (diffMs <= 0) diffMs = 3600 * 1000;
                const sessionDurationMs = diffMs;

                let repeatCutoff;
                if (req.body.ngay_ket_thuc_lap) {
                    repeatCutoff = new Date(req.body.ngay_ket_thuc_lap);
                    repeatCutoff.setHours(23, 59, 59, 999);
                } else {
                    repeatCutoff = new Date(newEnd);
                    repeatCutoff.setHours(23, 59, 59, 999);
                }

                const parsedCount = parseInt(req.body.so_lan_lap, 10);
                let maxIterations = 1;
                if (newRule === "daily") {
                    maxIterations = parsedCount > 0 ? Math.min(parsedCount, 365) : 365;
                } else if (newRule === "weekly") {
                    maxIterations = parsedCount > 0 ? Math.min(parsedCount, 104) : 104;
                } else if (newRule === "monthly") {
                    maxIterations = parsedCount > 0 ? Math.min(parsedCount, 60) : 60;
                } else if (newRule === "yearly") {
                    maxIterations = parsedCount > 0 ? Math.min(parsedCount, 10) : 10;
                }
                const extraEvents = [];

                for (let i = 1; i < maxIterations; i++) {
                    let curStart;
                    if (newRule === "daily") {
                        curStart = new Date(newStart);
                        curStart.setDate(curStart.getDate() + i);
                    } else if (newRule === "weekly") {
                        curStart = new Date(newStart);
                        curStart.setDate(curStart.getDate() + i * 7);
                    } else if (newRule === "monthly") {
                        const targetYear = newStart.getFullYear();
                        const targetMonth = newStart.getMonth() + i;
                        const origDate = newStart.getDate();
                        const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                        const actualDate = Math.min(origDate, lastDayOfTargetMonth);

                        curStart = new Date(newStart);
                        curStart.setFullYear(targetYear, targetMonth, actualDate);
                    } else if (newRule === "yearly") {
                        const targetYear = newStart.getFullYear() + i;
                        const targetMonth = newStart.getMonth();
                        const origDate = newStart.getDate();
                        const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                        const actualDate = Math.min(origDate, lastDayOfTargetMonth);

                        curStart = new Date(newStart);
                        curStart.setFullYear(targetYear, targetMonth, actualDate);
                    }

                    if (curStart.getTime() > repeatCutoff.getTime()) {
                        break;
                    }

                    const curEnd = (updateData.loai_su_kien || event.loai_su_kien) === "deadline" ? new Date(curStart) : new Date(curStart.getTime() + sessionDurationMs);

                    extraEvents.push({
                        user_id: req.user._id,
                        cong_viec_id: event.cong_viec_id || null,
                        loai_su_kien: updateData.loai_su_kien || event.loai_su_kien,
                        tieu_de: updateData.tieu_de || event.tieu_de,
                        mo_ta: updateData.mo_ta !== undefined ? updateData.mo_ta : event.mo_ta,
                        thoi_gian_bat_dau: curStart,
                        thoi_gian_ket_thuc: curEnd,
                        dia_diem: updateData.dia_diem !== undefined ? updateData.dia_diem : event.dia_diem,
                        mau_sac: updateData.mau_sac || event.mau_sac,
                        quy_tac_lap: newRule,
                        nhom_lap_id: newNhomLapId,
                        bat_thong_bao: updateData.bat_thong_bao !== undefined ? updateData.bat_thong_bao : event.bat_thong_bao,
                        thoi_gian_nhac_truoc: updateData.thoi_gian_nhac_truoc !== undefined ? updateData.thoi_gian_nhac_truoc : event.thoi_gian_nhac_truoc,
                        so_ngay_nhac: updateData.so_ngay_nhac !== undefined ? updateData.so_ngay_nhac : event.so_ngay_nhac
                    });
                }

                if (extraEvents.length > 0) {
                    await SuKien.insertMany(extraEvents);
                }

                Object.assign(event, updateData);
                const saved = await event.save();

                return res.status(200).json({
                    success: true,
                    message: `Đã đổi quy tắc lặp và tái tạo chuỗi sự kiện thành công (${extraEvents.length + 1} sự kiện)`,
                    data: saved
                });
            }

            // Trường hợp 3: Quy tắc lặp giữ nguyên, dịch chuyển thời gian và cập nhật thông tin chuỗi
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

            // Tính toán độ lệch thời gian (timeShift) và thời lượng mới (newDuration)
            const oldStartMs = new Date(event.thoi_gian_bat_dau).getTime();
            const newStartMs = newStart.getTime();
            const timeShift = newStartMs - oldStartMs;
            const newDuration = newEnd.getTime() - newStart.getTime();

            // Tìm tất cả các sự kiện cùng chuỗi lặp chưa bị xóa
            const relatedEvents = await SuKien.find({
                nhom_lap_id: event.nhom_lap_id,
                user_id: req.user._id,
                is_deleted: false
            });

            if (relatedEvents.length > 0) {
                const bulkOps = relatedEvents.map((ev) => {
                    const evOldStartMs = new Date(ev.thoi_gian_bat_dau).getTime();
                    const evNewStart = new Date(evOldStartMs + timeShift);
                    const evNewEnd = new Date(evNewStart.getTime() + newDuration);

                    return {
                        updateOne: {
                            filter: { _id: ev._id },
                            update: {
                                $set: {
                                    ...bulkFields,
                                    thoi_gian_bat_dau: evNewStart,
                                    thoi_gian_ket_thuc: evNewEnd
                                }
                            }
                        }
                    };
                });

                await SuKien.bulkWrite(bulkOps);
            }

            return res.status(200).json({
                success: true,
                message: `Cập nhật toàn bộ chuỗi sự kiện lặp thành công (${relatedEvents.length} sự kiện)`
            });
        } else {
            // Khi sửa chỉ 1 sự kiện riêng lẻ:
            const targetRule = updateData.quy_tac_lap || "once";

            // Nếu sự kiện đang thuộc chuỗi lặp cũ, tách nó ra khỏi nhóm cũ
            if (event.nhom_lap_id) {
                updateData.nhom_lap_id = null;
                updateData.quy_tac_lap = targetRule;
            }

            // Nếu người dùng chọn quy tắc lặp mới (khác once) cho buổi này:
            if (targetRule !== "once" && !updateData.nhom_lap_id) {
                const newNhomLapId = "repeat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
                updateData.nhom_lap_id = newNhomLapId;
                updateData.quy_tac_lap = targetRule;

                // Tính thời lượng mỗi buổi
                let diffMs = newEnd.getTime() - newStart.getTime();
                if (diffMs <= 0) {
                    const sH = newStart.getHours();
                    const sM = newStart.getMinutes();
                    const eH = newEnd.getHours();
                    const eM = newEnd.getMinutes();
                    diffMs = (eH * 60 + eM - (sH * 60 + sM)) * 60 * 1000;
                }
                if (diffMs <= 0) diffMs = 3600 * 1000;
                const sessionDurationMs = diffMs;

                let repeatCutoff;
                if (req.body.ngay_ket_thuc_lap) {
                    repeatCutoff = new Date(req.body.ngay_ket_thuc_lap);
                    repeatCutoff.setHours(23, 59, 59, 999);
                } else {
                    repeatCutoff = new Date(newEnd);
                    repeatCutoff.setHours(23, 59, 59, 999);
                }

                const parsedCount = parseInt(req.body.so_lan_lap, 10);
                let maxIterations = 1;
                if (targetRule === "daily") {
                    maxIterations = parsedCount > 0 ? Math.min(parsedCount, 365) : 365;
                } else if (targetRule === "weekly") {
                    maxIterations = parsedCount > 0 ? Math.min(parsedCount, 104) : 104;
                } else if (targetRule === "monthly") {
                    maxIterations = parsedCount > 0 ? Math.min(parsedCount, 60) : 60;
                } else if (targetRule === "yearly") {
                    maxIterations = parsedCount > 0 ? Math.min(parsedCount, 10) : 10;
                }
                const extraEvents = [];

                // Sinh các sự kiện tiếp theo (từ i = 1)
                for (let i = 1; i < maxIterations; i++) {
                    let curStart;
                    if (targetRule === "daily") {
                        curStart = new Date(newStart);
                        curStart.setDate(curStart.getDate() + i);
                    } else if (targetRule === "weekly") {
                        curStart = new Date(newStart);
                        curStart.setDate(curStart.getDate() + i * 7);
                    } else if (targetRule === "monthly") {
                        const targetYear = newStart.getFullYear();
                        const targetMonth = newStart.getMonth() + i;
                        const origDate = newStart.getDate();
                        const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                        const actualDate = Math.min(origDate, lastDayOfTargetMonth);

                        curStart = new Date(newStart);
                        curStart.setFullYear(targetYear, targetMonth, actualDate);
                    } else if (targetRule === "yearly") {
                        const targetYear = newStart.getFullYear() + i;
                        const targetMonth = newStart.getMonth();
                        const origDate = newStart.getDate();
                        const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                        const actualDate = Math.min(origDate, lastDayOfTargetMonth);

                        curStart = new Date(newStart);
                        curStart.setFullYear(targetYear, targetMonth, actualDate);
                    }

                    if (curStart.getTime() > repeatCutoff.getTime()) {
                        break;
                    }

                    const curEnd = (updateData.loai_su_kien || event.loai_su_kien) === "deadline" ? new Date(curStart) : new Date(curStart.getTime() + sessionDurationMs);

                    extraEvents.push({
                        user_id: req.user._id,
                        cong_viec_id: event.cong_viec_id || null,
                        loai_su_kien: updateData.loai_su_kien || event.loai_su_kien,
                        tieu_de: updateData.tieu_de || event.tieu_de,
                        mo_ta: updateData.mo_ta !== undefined ? updateData.mo_ta : event.mo_ta,
                        thoi_gian_bat_dau: curStart,
                        thoi_gian_ket_thuc: curEnd,
                        dia_diem: updateData.dia_diem !== undefined ? updateData.dia_diem : event.dia_diem,
                        mau_sac: updateData.mau_sac || event.mau_sac,
                        quy_tac_lap: targetRule,
                        nhom_lap_id: newNhomLapId,
                        bat_thong_bao: updateData.bat_thong_bao !== undefined ? updateData.bat_thong_bao : event.bat_thong_bao,
                        thoi_gian_nhac_truoc: updateData.thoi_gian_nhac_truoc !== undefined ? updateData.thoi_gian_nhac_truoc : event.thoi_gian_nhac_truoc,
                        so_ngay_nhac: updateData.so_ngay_nhac !== undefined ? updateData.so_ngay_nhac : event.so_ngay_nhac
                    });
                }

                if (extraEvents.length > 0) {
                    await SuKien.insertMany(extraEvents);
                }
            }

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
