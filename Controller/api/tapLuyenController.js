const KeHoachTapLuyen = require("../../Model/KeHoachTapLuyen");
const BuoiTap = require("../../Model/BuoiTap");
const ChiTietBuoiTap = require("../../Model/ChiTietBuoiTap");
const LichSuTapLuyen = require("../../Model/LichSuTapLuyen");
const BaiTapTheChat = require("../../Model/BaiTapTheChat");
const SuKien = require("../../Model/SuKien");
const User = require("../../Model/User");

// Seed các bài tập mẫu nếu cơ sở dữ liệu trống hoặc bổ sung các bài tập chuẩn
const ensureStandardExercises = async () => {
    const defaultExercises = [
        { ten_bai_tap: "Barbell Bench Press", nhom_co: "Ngực", loai_bai_tap: "strength", meo_tap: "Giữ cổ tay thẳng, hạ thanh đòn có kiểm soát" },
        { ten_bai_tap: "Incline Dumbbell Press", nhom_co: "Ngực trên", loai_bai_tap: "strength", meo_tap: "Ghế nghiêng 30 độ" },
        { ten_bai_tap: "Dumbbell Chest Fly", nhom_co: "Ngực", loai_bai_tap: "strength", meo_tap: "Mở rộng lồng ngực, cùi chỏ hơi cong" },
        { ten_bai_tap: "Push-up (Hít Đất)", nhom_co: "Ngực & Tay sau", loai_bai_tap: "strength", meo_tap: "Gồng chắc core, hạ ngực sát sàn" },
        { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", meo_tap: "Kéo cùi chỏ về phía hông, không giật người" },
        { ten_bai_tap: "Barbell Bent Over Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", meo_tap: "Lưng thẳng, gập người 45 độ" },
        { ten_bai_tap: "Seated Cable Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", meo_tap: "Kéo về rốn, siết chặt hai bả vai" },
        { ten_bai_tap: "Pull-up (Hít Xà Đơn)", nhom_co: "Lưng xô", loai_bai_tap: "strength", meo_tap: "Kéo cằm vượt xà, hạ người có kiểm soát" },
        { ten_bai_tap: "Barbell Back Squat", nhom_co: "Đùi trước & Mông", loai_bai_tap: "strength", meo_tap: "Đầu gối hướng theo mũi chân" },
        { ten_bai_tap: "Romanian Deadlift", nhom_co: "Đùi sau & Lưng dưới", loai_bai_tap: "strength", meo_tap: "Đẩy mông ra sau, lưng giữ thẳng" },
        { ten_bai_tap: "Leg Press", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", meo_tap: "Đạp tạ không khóa khớp gối ở đỉnh" },
        { ten_bai_tap: "Dumbbell Walking Lunges", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", meo_tap: "Bước sải vừa phải, gối hạ vuông góc" },
        { ten_bai_tap: "Calf Raises (Nhón Bắp Chuối)", nhom_co: "Bắp chân", loai_bai_tap: "strength", meo_tap: "Nhón cao hết biên độ, giữ 1 giây ở đỉnh" },
        { ten_bai_tap: "Overhead Dumbbell Press", nhom_co: "Vai", loai_bai_tap: "strength", meo_tap: "Đẩy thẳng tạ lên trên, siết chặt cơ bụng" },
        { ten_bai_tap: "Dumbbell Lateral Raise", nhom_co: "Vai giữa", loai_bai_tap: "strength", meo_tap: "Nâng tay ngang vai, cùi chỏ hơi cong nhẹ" },
        { ten_bai_tap: "Face Pull", nhom_co: "Vai sau & Lưng trên", loai_bai_tap: "strength", meo_tap: "Kéo dây thừng về ngang mắt, mở rộng chỏ" },
        { ten_bai_tap: "Bicep Barbell Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", meo_tap: "Không đung đưa người lấy đà" },
        { ten_bai_tap: "Hammer Curl", nhom_co: "Tay trước & Cẳng tay", loai_bai_tap: "strength", meo_tap: "Lòng bàn tay hướng vào nhau khi cuốn" },
        { ten_bai_tap: "Tricep Rope Pushdown", nhom_co: "Tay sau", loai_bai_tap: "strength", meo_tap: "Cố định cùi chỏ sát mạn sườn" },
        { ten_bai_tap: "Dips (Xà Kép)", nhom_co: "Ngực dưới & Tay sau", loai_bai_tap: "strength", meo_tap: "Hạ người vuông góc cùi chỏ, đẩy lên dứt khoát" },
        { ten_bai_tap: "Plank Cổ Điển", nhom_co: "Cơ bụng & Core", loai_bai_tap: "core", meo_tap: "Gồng chắc cơ bụng, giữ thẳng người" },
        { ten_bai_tap: "Hanging Leg Raise", nhom_co: "Bụng dưới", loai_bai_tap: "core", meo_tap: "Gồng bụng nhấc chân hoặc gối lên ngực" },
        { ten_bai_tap: "Russian Twist", nhom_co: "Cơ liên sườn", loai_bai_tap: "core", meo_tap: "Xoay thân mình nhịp nhàng hai bên" },
        { ten_bai_tap: "Máy Chạy Bộ (Treadmill)", nhom_co: "Tim mạch & Toàn thân", loai_bai_tap: "cardio", meo_tap: "Duy trì nhịp tim và thở đều đặn" },
        { ten_bai_tap: "Xe Đạp Thể Dục (Stationary Bike)", nhom_co: "Chân & Tim mạch", loai_bai_tap: "cardio", meo_tap: "Đạp tốc độ vừa phải hoặc ngắt quãng HIIT" }
    ];

    const count = await BaiTapTheChat.countDocuments();
    if (count === 0) {
        await BaiTapTheChat.insertMany(defaultExercises);
    } else {
        // Bổ sung những bài tập chưa có
        for (const ex of defaultExercises) {
            const exists = await BaiTapTheChat.findOne({ ten_bai_tap: ex.ten_bai_tap });
            if (!exists) {
                await BaiTapTheChat.create(ex);
            }
        }
    }
};

// Khởi tạo Lịch tập Gym mẫu mặc định đúng một lần cho mỗi tài khoản
const ensureDefaultPlanForUser = async (user) => {
    if (!user || !user._id) return null;

    // Kiểm tra cờ workout_default_initialized
    const userDoc = await User.findById(user._id);
    if (userDoc && userDoc.workout_default_initialized) {
        return null;
    }

    // Kiểm tra xem user đã có bất kỳ kế hoạch nào chưa (tránh ghi đè tài khoản cũ)
    const existingPlan = await KeHoachTapLuyen.findOne({
        $or: [{ user_id: user._id }, { userId: user._id }]
    });

    if (existingPlan) {
        if (userDoc && !userDoc.workout_default_initialized) {
            await User.findByIdAndUpdate(user._id, { workout_default_initialized: true });
        }
        return existingPlan;
    }

    // Đảm bảo có sẵn bài tập mẫu
    await ensureStandardExercises();
    const exercises = await BaiTapTheChat.find();
    const findEx = (name) => exercises.find(e => e.ten_bai_tap.toLowerCase().includes(name.toLowerCase()))?._id || exercises[0]?._id;

    // Tạo Kế hoạch mẫu mặc định 7 ngày
    const defaultPlan = await KeHoachTapLuyen.create({
        user_id: user._id,
        ten_ke_hoach: "Giáo Án Tăng Cơ Toàn Diện (PPL 7 Ngày)",
        mo_ta: "Phân chia khoa học theo chu kỳ Push - Pull - Legs kết hợp ngày nghỉ phục hồi cơ bắp tối ưu.",
        is_active: true,
        is_default: true
    });

    // 7 Ngày trong tuần: 2=T2, 3=T3, 4=T4, 5=T5, 6=T6, 7=T7, 8=CN
    const scheduleTemplate = [
        {
            ngay: 2,
            ten: "Buổi 1: Push (Ngực, Vai & Tay Sau)",
            is_rest: false,
            items: [
                { ex: "Bench Press", sets: 4, reps: 10, mins: 15 },
                { ex: "Incline Dumbbell", sets: 3, reps: 12, mins: 12 },
                { ex: "Tricep", sets: 3, reps: 12, mins: 10 }
            ]
        },
        {
            ngay: 3,
            ten: "Nghỉ ngơi phục hồi (Rest Day)",
            is_rest: true,
            items: []
        },
        {
            ngay: 4,
            ten: "Buổi 2: Pull (Lưng Xô & Tay Trước)",
            is_rest: false,
            items: [
                { ex: "Lat Pulldown", sets: 4, reps: 10, mins: 15 },
                { ex: "Bent Over Row", sets: 3, reps: 10, mins: 12 },
                { ex: "Bicep", sets: 3, reps: 12, mins: 10 }
            ]
        },
        {
            ngay: 5,
            ten: "Nghỉ ngơi phục hồi (Rest Day)",
            is_rest: true,
            items: []
        },
        {
            ngay: 6,
            ten: "Buổi 3: Legs (Đùi, Mông & Cơ Bụng)",
            is_rest: false,
            items: [
                { ex: "Back Squat", sets: 4, reps: 8, mins: 18 },
                { ex: "Romanian", sets: 3, reps: 10, mins: 12 },
                { ex: "Plank", sets: 3, reps: 60, mins: 8 }
            ]
        },
        {
            ngay: 7,
            ten: "Cardio & Giãn Cơ Phục Hồi",
            is_rest: false,
            items: [
                { ex: "Plank", sets: 3, reps: 45, mins: 15 }
            ]
        },
        {
            ngay: 8,
            ten: "Nghỉ ngơi nạp năng lượng (Rest Day)",
            is_rest: true,
            items: []
        }
    ];

    for (const day of scheduleTemplate) {
        const buoi = await BuoiTap.create({
            ke_hoach_tap_luyen_id: defaultPlan._id,
            ten_buoi_tap: day.ten,
            ngay_trong_tuan: day.ngay,
            thu_tu: day.ngay - 1,
            is_rest_day: day.is_rest
        });

        if (day.items && day.items.length > 0) {
            for (let i = 0; i < day.items.length; i++) {
                const it = day.items[i];
                const exId = findEx(it.ex);
                if (exId) {
                    await ChiTietBuoiTap.create({
                        buoi_tap_id: buoi._id,
                        bai_tap_the_chat_id: exId,
                        so_sets: it.sets,
                        so_reps: it.reps,
                        thoi_luong_phut: it.mins,
                        thu_tu: i + 1
                    });
                }
            }
        }
    }

    // Đánh dấu tài khoản đã được khởi tạo mẫu 1 lần duy nhất
    await User.findByIdAndUpdate(user._id, { workout_default_initialized: true });
    return defaultPlan;
};

// 1. Lấy Lịch trình của Kế hoạch đang kích hoạt (active plan)
const getWorkoutSchedule = async (req, res) => {
    try {
        await ensureDefaultPlanForUser(req.user);

        let activePlan = await KeHoachTapLuyen.findOne({
            $or: [{ user_id: req.user._id }, { userId: req.user._id }],
            is_active: true
        });

        // Nếu chưa có plan active nhưng có plan khác, lấy plan đầu tiên kích hoạt
        if (!activePlan) {
            activePlan = await KeHoachTapLuyen.findOne({
                $or: [{ user_id: req.user._id }, { userId: req.user._id }]
            }).sort({ createdAt: -1 });

            if (activePlan) {
                activePlan.is_active = true;
                await activePlan.save();
            }
        }

        if (!activePlan) {
            return res.status(200).json({
                success: true,
                data: {
                    ke_hoach: null,
                    danh_sach_buoi_tap: []
                }
            });
        }

        const buoiTaps = await BuoiTap.find({
            $or: [
                { ke_hoach_tap_luyen_id: activePlan._id },
                { keHoachId: activePlan._id }
            ]
        }).sort({ ngay_trong_tuan: 1 });

        // Lấy chi tiết bài tập cho từng buổi
        const buoiTapWithDetails = await Promise.all(
            buoiTaps.map(async (buoi) => {
                const details = await ChiTietBuoiTap.find({ buoi_tap_id: buoi._id })
                    .populate("bai_tap_the_chat_id")
                    .sort({ thu_tu: 1 });
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

// 2. Lấy danh sách tất cả các Kế hoạch tập luyện của User
const getAllWorkoutPlans = async (req, res) => {
    try {
        await ensureDefaultPlanForUser(req.user);

        const plans = await KeHoachTapLuyen.find({
            $or: [{ user_id: req.user._id }, { userId: req.user._id }]
        }).sort({ is_active: -1, createdAt: -1 });

        const plansWithStats = await Promise.all(
            plans.map(async (plan) => {
                const buoiCount = await BuoiTap.countDocuments({
                    $or: [
                        { ke_hoach_tap_luyen_id: plan._id },
                        { keHoachId: plan._id }
                    ]
                });
                const restCount = await BuoiTap.countDocuments({
                    $or: [
                        { ke_hoach_tap_luyen_id: plan._id },
                        { keHoachId: plan._id }
                    ],
                    is_rest_day: true
                });
                return {
                    ...plan.toObject(),
                    tong_buoi: buoiCount,
                    so_buoi_tap: Math.max(0, buoiCount - restCount),
                    so_ngay_nghi: restCount
                };
            })
        );

        res.status(200).json({
            success: true,
            data: plansWithStats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách kế hoạch: " + error.message });
    }
};

// Helper đồng bộ giáo án tập luyện sang trang Lịch (SuKien)
const syncWorkoutPlanToCalendar = async (userId, planId, weeksAhead = 8) => {
    try {
        const plan = await KeHoachTapLuyen.findById(planId);
        if (!plan) return false;

        // Xóa các sự kiện lịch cũ liên quan đến giáo án này
        await SuKien.deleteMany({
            user_id: userId,
            ke_hoach_tap_luyen_id: planId
        });

        // Lấy danh sách các buổi tập không phải ngày nghỉ
        const buoiTaps = await BuoiTap.find({
            ke_hoach_tap_luyen_id: planId,
            is_rest_day: false
        }).sort({ ngay_trong_tuan: 1 });

        if (buoiTaps.length === 0) return true;

        const eventsToInsert = [];
        const nhomLapId = "workout_plan_" + planId + "_" + Date.now();

        const now = new Date();
        const currentJsDay = now.getDay(); // 0 is Sunday, 1 is Monday...
        const mondayCurrentWeek = new Date(now);
        mondayCurrentWeek.setDate(now.getDate() + (currentJsDay === 0 ? -6 : 1 - currentJsDay));
        mondayCurrentWeek.setHours(0, 0, 0, 0);

        for (const buoi of buoiTaps) {
            const details = await ChiTietBuoiTap.find({ buoi_tap_id: buoi._id })
                .populate("bai_tap_the_chat_id")
                .sort({ thu_tu: 1 });

            let moTaChiTiet = `📋 Giáo án: ${plan.ten_ke_hoach}\n🎯 Buổi tập: ${buoi.ten_buoi_tap}\n`;
            if (details.length > 0) {
                moTaChiTiet += "\n🏋️ Danh sách bài tập:\n";
                details.forEach((d, idx) => {
                    const tenEx = d.bai_tap_the_chat_id?.ten_bai_tap || "Bài tập";
                    const nhomCo = d.bai_tap_the_chat_id?.nhom_co ? `[${d.bai_tap_the_chat_id.nhom_co}] ` : "";
                    moTaChiTiet += `${idx + 1}. ${nhomCo}${tenEx}: ${d.so_sets} sets x ${d.so_reps} reps\n`;
                });
            }

            const startTimeStr = buoi.gio_bat_dau || "06:00";
            const endTimeStr = buoi.gio_ket_thuc || "07:15";
            const [startH, startM] = startTimeStr.split(":").map(Number);
            const [endH, endM] = endTimeStr.split(":").map(Number);

            // buoi.ngay_trong_tuan: 2=T2, ..., 8=CN -> offset from monday: 0 to 6
            const dayOffset = (buoi.ngay_trong_tuan || 2) - 2;

            const baseDate = new Date(mondayCurrentWeek);
            baseDate.setDate(mondayCurrentWeek.getDate() + dayOffset);

            for (let w = 0; w < weeksAhead; w++) {
                const eventStartDate = new Date(baseDate);
                eventStartDate.setDate(baseDate.getDate() + w * 7);
                eventStartDate.setHours(startH || 6, startM || 0, 0, 0);

                const eventEndDate = new Date(baseDate);
                eventEndDate.setDate(baseDate.getDate() + w * 7);
                eventEndDate.setHours(endH || 7, endM || 15, 0, 0);

                eventsToInsert.push({
                    user_id: userId,
                    ke_hoach_tap_luyen_id: plan._id,
                    buoi_tap_id: buoi._id,
                    loai_su_kien: "tap-luyen",
                    tieu_de: `🏋️ ${buoi.ten_buoi_tap}`,
                    mo_ta: moTaChiTiet,
                    thoi_gian_bat_dau: eventStartDate,
                    thoi_gian_ket_thuc: eventEndDate,
                    dia_diem: "Phòng Gym / Tại nhà",
                    mau_sac: "#10B981",
                    quy_tac_lap: "weekly",
                    nhom_lap_id: nhomLapId,
                    bat_thong_bao: true,
                    so_ngay_nhac: 0
                });
            }
        }

        if (eventsToInsert.length > 0) {
            await SuKien.insertMany(eventsToInsert);
        }

        return true;
    } catch (err) {
        console.error("Lỗi đồng bộ lịch tập sang SuKien:", err);
        return false;
    }
};

// 3. Tạo Kế hoạch tập luyện cá nhân mới (Hỗ trợ Wizard gợi ý, bài tập & setup giờ tập)
const createWorkoutPlan = async (req, res) => {
    try {
        const { ten_ke_hoach, mo_ta, so_buoi_tuan, cuong_do, is_active, dong_bo_lich, sessions } = req.body;

        if (!ten_ke_hoach || !ten_ke_hoach.trim()) {
            return res.status(400).json({ success: false, message: "Tên kế hoạch không được để trống" });
        }

        // Kiểm tra xem đây có phải là kế hoạch đầu tiên không
        const existingCount = await KeHoachTapLuyen.countDocuments({
            $or: [{ user_id: req.user._id }, { userId: req.user._id }]
        });

        const shouldBeActive = Boolean(is_active || existingCount === 0);

        if (shouldBeActive) {
            await KeHoachTapLuyen.updateMany(
                { $or: [{ user_id: req.user._id }, { userId: req.user._id }] },
                { is_active: false }
            );
        }

        const shouldSync = dong_bo_lich !== undefined ? Boolean(dong_bo_lich) : true;

        const newPlan = await KeHoachTapLuyen.create({
            user_id: req.user._id,
            ten_ke_hoach: ten_ke_hoach.trim(),
            mo_ta: mo_ta ? mo_ta.trim() : "",
            so_buoi_tuan: Number(so_buoi_tuan) || (Array.isArray(sessions) ? sessions.filter(s => !s.is_rest_day).length : 4),
            cuong_do: cuong_do || "intermediate",
            dong_bo_lich: shouldSync,
            is_active: shouldBeActive,
            is_default: false
        });

        await ensureStandardExercises();
        const allExercises = await BaiTapTheChat.find();

        if (Array.isArray(sessions) && sessions.length > 0) {
            for (const s of sessions) {
                const dayNum = Number(s.ngay_trong_tuan) || 2;
                const buoi = await BuoiTap.create({
                    ke_hoach_tap_luyen_id: newPlan._id,
                    ten_buoi_tap: s.ten_buoi_tap || (s.is_rest_day ? "Nghỉ ngơi phục hồi" : "Buổi tập chính"),
                    ngay_trong_tuan: dayNum,
                    thu_tu: dayNum - 1,
                    is_rest_day: Boolean(s.is_rest_day),
                    gio_bat_dau: s.gio_bat_dau || "06:00",
                    gio_ket_thuc: s.gio_ket_thuc || "07:15",
                    ghi_chu: s.ghi_chu || null
                });

                if (!s.is_rest_day && Array.isArray(s.exercises) && s.exercises.length > 0) {
                    for (let i = 0; i < s.exercises.length; i++) {
                        const ex = s.exercises[i];
                        let exId = ex.bai_tap_the_chat_id;
                        if (!exId && ex.ten_bai_tap) {
                            let found = allExercises.find(
                                e => e.ten_bai_tap.toLowerCase().trim() === ex.ten_bai_tap.toLowerCase().trim()
                            );
                            if (!found) {
                                found = await BaiTapTheChat.create({
                                    ten_bai_tap: ex.ten_bai_tap.trim(),
                                    nhom_co: ex.nhom_co || "Toàn thân",
                                    loai_bai_tap: ex.loai_bai_tap || "strength"
                                });
                                allExercises.push(found);
                            }
                            exId = found._id;
                        }

                        if (exId) {
                            await ChiTietBuoiTap.create({
                                buoi_tap_id: buoi._id,
                                bai_tap_the_chat_id: exId,
                                so_sets: Number(ex.so_sets) || 3,
                                so_reps: Number(ex.so_reps) || 10,
                                thoi_luong_phut: Number(ex.thoi_luong_phut) || 10,
                                thu_tu: i + 1
                            });
                        }
                    }
                }
            }
        } else {
            // Tự động khởi tạo khung 7 ngày mặc định nếu không truyền sessions
            const dayNames = [
                { day: 2, name: "Thứ Hai: Buổi tập chính", isRest: false },
                { day: 3, name: "Thứ Ba: Nghỉ ngơi phục hồi", isRest: true },
                { day: 4, name: "Thứ Tư: Buổi tập chính", isRest: false },
                { day: 5, name: "Thứ Năm: Nghỉ ngơi phục hồi", isRest: true },
                { day: 6, name: "Thứ Sáu: Buổi tập chính", isRest: false },
                { day: 7, name: "Thứ Bảy: Cardio & Giãn cơ", isRest: false },
                { day: 8, name: "Chủ Nhật: Nghỉ ngơi phục hồi", isRest: true }
            ];

            for (const d of dayNames) {
                await BuoiTap.create({
                    ke_hoach_tap_luyen_id: newPlan._id,
                    ten_buoi_tap: d.name,
                    ngay_trong_tuan: d.day,
                    thu_tu: d.day - 1,
                    is_rest_day: d.isRest,
                    gio_bat_dau: "06:00",
                    gio_ket_thuc: "07:15"
                });
            }
        }

        // Tự động đồng bộ lên trang Lịch nếu được bật
        if (shouldSync) {
            await syncWorkoutPlanToCalendar(req.user._id, newPlan._id);
        }

        res.status(201).json({
            success: true,
            message: shouldSync 
                ? "Tạo kế hoạch tập luyện và tự động đồng bộ lên Lịch thành công!" 
                : "Tạo kế hoạch tập luyện thành công!",
            data: newPlan
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo kế hoạch: " + error.message });
    }
};

// 4. Cập nhật Kế hoạch tập luyện cá nhân
const updateWorkoutPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_ke_hoach, mo_ta } = req.body;

        const plan = await KeHoachTapLuyen.findOne({
            _id: id,
            $or: [{ user_id: req.user._id }, { userId: req.user._id }]
        });

        if (!plan) {
            return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch hoặc bạn không có quyền chỉnh sửa" });
        }

        if (ten_ke_hoach !== undefined) {
            plan.ten_ke_hoach = ten_ke_hoach.trim();
        }
        if (mo_ta !== undefined) {
            plan.mo_ta = mo_ta.trim();
        }

        await plan.save();

        res.status(200).json({
            success: true,
            message: "Cập nhật kế hoạch thành công!",
            data: plan
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật kế hoạch: " + error.message });
    }
};

// 5. Đổi kế hoạch đang sử dụng (Kích hoạt kế hoạch)
const activateWorkoutPlan = async (req, res) => {
    try {
        const { id } = req.params;

        const targetPlan = await KeHoachTapLuyen.findOne({
            _id: id,
            $or: [{ user_id: req.user._id }, { userId: req.user._id }]
        });

        if (!targetPlan) {
            return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch hoặc bạn không có quyền truy cập" });
        }

        // Deactivate all plans of this user
        await KeHoachTapLuyen.updateMany(
            { $or: [{ user_id: req.user._id }, { userId: req.user._id }] },
            { is_active: false }
        );

        targetPlan.is_active = true;
        await targetPlan.save();

        // Tự động đồng bộ lịch nếu giáo án này có bật cờ đồng bộ
        if (targetPlan.dong_bo_lich) {
            await syncWorkoutPlanToCalendar(req.user._id, targetPlan._id);
        }

        res.status(200).json({
            success: true,
            message: `Đã kích hoạt kế hoạch "${targetPlan.ten_ke_hoach}" làm lịch tập chính!`,
            data: targetPlan
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi kích hoạt kế hoạch: " + error.message });
    }
};

// 6. Xóa Kế hoạch tập luyện cá nhân (Có xác nhận)
const deleteWorkoutPlan = async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await KeHoachTapLuyen.findOne({
            _id: id,
            $or: [{ user_id: req.user._id }, { userId: req.user._id }]
        });

        if (!plan) {
            return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch hoặc bạn không có quyền xóa" });
        }

        const wasActive = plan.is_active;

        // Dọn dẹp sự kiện lịch liên quan đến giáo án này
        await SuKien.deleteMany({
            user_id: req.user._id,
            ke_hoach_tap_luyen_id: plan._id
        });

        // Tìm tất cả buổi tập thuộc kế hoạch này
        const buoiTaps = await BuoiTap.find({
            $or: [{ ke_hoach_tap_luyen_id: plan._id }, { keHoachId: plan._id }]
        });
        const buoiTapIds = buoiTaps.map(b => b._id);

        // Xóa chi tiết bài tập
        if (buoiTapIds.length > 0) {
            await ChiTietBuoiTap.deleteMany({ buoi_tap_id: { $in: buoiTapIds } });
        }

        // Xóa buổi tập
        await BuoiTap.deleteMany({
            $or: [{ ke_hoach_tap_luyen_id: plan._id }, { keHoachId: plan._id }]
        });

        // Xóa kế hoạch
        await KeHoachTapLuyen.deleteOne({ _id: plan._id });

        // Nếu kế hoạch bị xóa đang active, tự động kích hoạt một kế hoạch còn lại
        let newActivePlan = null;
        if (wasActive) {
            const remaining = await KeHoachTapLuyen.findOne({
                $or: [{ user_id: req.user._id }, { userId: req.user._id }]
            }).sort({ createdAt: -1 });

            if (remaining) {
                remaining.is_active = true;
                await remaining.save();
                newActivePlan = remaining;
                if (remaining.dong_bo_lich) {
                    await syncWorkoutPlanToCalendar(req.user._id, remaining._id);
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Đã xóa kế hoạch tập luyện thành công!",
            data: {
                deleted_id: id,
                new_active_plan: newActivePlan
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa kế hoạch: " + error.message });
    }
};

// 7. Cập nhật Buổi tập (Tên buổi, Ngày trong tuần, Giờ tập, Đánh dấu ngày nghỉ)
const updateBuoiTap = async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_buoi_tap, is_rest_day, ghi_chu, ngay_trong_tuan, gio_bat_dau, gio_ket_thuc } = req.body;

        const buoi = await BuoiTap.findById(id);
        if (!buoi) {
            return res.status(404).json({ success: false, message: "Không tìm thấy buổi tập" });
        }

        // Kiểm tra quyền sở hữu thông qua Kế hoạch
        const planId = buoi.ke_hoach_tap_luyen_id || buoi.keHoachId;
        const plan = await KeHoachTapLuyen.findOne({
            _id: planId,
            $or: [{ user_id: req.user._id }, { userId: req.user._id }]
        });

        if (!plan) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa buổi tập này" });
        }

        if (ten_buoi_tap !== undefined) buoi.ten_buoi_tap = ten_buoi_tap.trim();
        if (is_rest_day !== undefined) buoi.is_rest_day = Boolean(is_rest_day);
        if (ghi_chu !== undefined) buoi.ghi_chu = ghi_chu;
        if (gio_bat_dau !== undefined) buoi.gio_bat_dau = gio_bat_dau;
        if (gio_ket_thuc !== undefined) buoi.gio_ket_thuc = gio_ket_thuc;
        if (ngay_trong_tuan !== undefined) {
            const dayNum = Number(ngay_trong_tuan);
            if (dayNum >= 2 && dayNum <= 8) {
                buoi.ngay_trong_tuan = dayNum;
            }
        }

        await buoi.save();

        // Nếu giáo án này đang active và bật đồng bộ lịch, re-sync lịch tự động
        if (plan.is_active && plan.dong_bo_lich) {
            await syncWorkoutPlanToCalendar(req.user._id, plan._id);
        }

        res.status(200).json({
            success: true,
            message: "Cập nhật buổi tập thành công!",
            data: buoi
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật buổi tập: " + error.message });
    }
};

// 7.1. Đồng bộ thủ công giáo án sang trang Lịch
const syncWorkoutPlanEndpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await KeHoachTapLuyen.findOne({
            _id: id,
            $or: [{ user_id: req.user._id }, { userId: req.user._id }]
        });

        if (!plan) {
            return res.status(404).json({ success: false, message: "Không tìm thấy kế hoạch tập luyện" });
        }

        const success = await syncWorkoutPlanToCalendar(req.user._id, plan._id);
        if (!success) {
            return res.status(500).json({ success: false, message: "Không thể đồng bộ sang trang Lịch" });
        }

        plan.dong_bo_lich = true;
        await plan.save();

        res.status(200).json({
            success: true,
            message: `Đã đồng bộ thành công các buổi tập của giáo án "${plan.ten_ke_hoach}" vào Lịch!`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi đồng bộ lịch: " + error.message });
    }
};

// 8. Thêm bài tập vào Buổi tập
const addExerciseToBuoiTap = async (req, res) => {
    try {
        const { id } = req.params; // buoi_tap_id
        const {
            bai_tap_the_chat_id,
            ten_bai_tap,
            nhom_co,
            loai_bai_tap,
            so_sets,
            so_reps,
            thoi_luong_phut
        } = req.body;

        const buoi = await BuoiTap.findById(id);
        if (!buoi) {
            return res.status(404).json({ success: false, message: "Không tìm thấy buổi tập" });
        }

        // Kiểm tra quyền sở hữu
        const planId = buoi.ke_hoach_tap_luyen_id || buoi.keHoachId;
        const plan = await KeHoachTapLuyen.findOne({
            _id: planId,
            $or: [{ user_id: req.user._id }, { userId: req.user._id }]
        });

        if (!plan) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền thêm bài tập vào buổi này" });
        }

        let exerciseId = bai_tap_the_chat_id;

        // Nếu người dùng nhập tên bài tập tùy chỉnh thay vì chọn có sẵn
        if (!exerciseId && ten_bai_tap) {
            let existingEx = await BaiTapTheChat.findOne({
                ten_bai_tap: { $regex: new RegExp(`^${ten_bai_tap.trim()}$`, "i") }
            });

            if (!existingEx) {
                existingEx = await BaiTapTheChat.create({
                    ten_bai_tap: ten_bai_tap.trim(),
                    nhom_co: nhom_co ? nhom_co.trim() : "Toàn thân",
                    loai_bai_tap: loai_bai_tap || "strength",
                    meo_tap: "Tập đúng tư thế và kiểm soát chuyển động"
                });
            }
            exerciseId = existingEx._id;
        }

        if (!exerciseId) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn hoặc nhập tên bài tập" });
        }

        const countDetails = await ChiTietBuoiTap.countDocuments({ buoi_tap_id: buoi._id });

        const newDetail = await ChiTietBuoiTap.create({
            buoi_tap_id: buoi._id,
            bai_tap_the_chat_id: exerciseId,
            so_sets: so_sets ? Number(so_sets) : 3,
            so_reps: so_reps ? Number(so_reps) : 10,
            thoi_luong_phut: thoi_luong_phut ? Number(thoi_luong_phut) : null,
            thu_tu: countDetails + 1
        });

        const populated = await ChiTietBuoiTap.findById(newDetail._id).populate("bai_tap_the_chat_id");

        res.status(201).json({
            success: true,
            message: "Thêm bài tập vào buổi tập thành công!",
            data: populated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi thêm bài tập: " + error.message });
    }
};

// 9. Cập nhật thông số bài tập (Sets, Reps, Thời lượng)
const updateExerciseDetail = async (req, res) => {
    try {
        const { id } = req.params; // chi_tiet_id
        const { so_sets, so_reps, thoi_luong_phut, thu_tu } = req.body;

        const detail = await ChiTietBuoiTap.findById(id).populate({
            path: "buoi_tap_id",
            populate: { path: "ke_hoach_tap_luyen_id" }
        });

        if (!detail) {
            return res.status(404).json({ success: false, message: "Không tìm thấy chi tiết bài tập" });
        }

        const buoi = detail.buoi_tap_id;
        const plan = buoi?.ke_hoach_tap_luyen_id;

        if (!plan || (!plan.user_id?.equals(req.user._id) && !plan.userId?.equals(req.user._id))) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa bài tập này" });
        }

        if (so_sets !== undefined) detail.so_sets = Number(so_sets);
        if (so_reps !== undefined) detail.so_reps = Number(so_reps);
        if (thoi_luong_phut !== undefined) detail.thoi_luong_phut = thoi_luong_phut ? Number(thoi_luong_phut) : null;
        if (thu_tu !== undefined) detail.thu_tu = Number(thu_tu);

        await detail.save();

        const updated = await ChiTietBuoiTap.findById(detail._id).populate("bai_tap_the_chat_id");

        res.status(200).json({
            success: true,
            message: "Cập nhật bài tập thành công!",
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật bài tập: " + error.message });
    }
};

// 10. Xóa bài tập khỏi buổi tập
const deleteExerciseDetail = async (req, res) => {
    try {
        const { id } = req.params; // chi_tiet_id

        const detail = await ChiTietBuoiTap.findById(id).populate({
            path: "buoi_tap_id",
            populate: { path: "ke_hoach_tap_luyen_id" }
        });

        if (!detail) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài tập cần xóa" });
        }

        const buoi = detail.buoi_tap_id;
        const plan = buoi?.ke_hoach_tap_luyen_id;

        if (!plan || (!plan.user_id?.equals(req.user._id) && !plan.userId?.equals(req.user._id))) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xóa bài tập này" });
        }

        await ChiTietBuoiTap.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: "Đã xóa bài tập khỏi buổi tập!"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa bài tập: " + error.message });
    }
};

// 11. Danh mục bài tập thể chất có sẵn
const getExerciseCatalog = async (req, res) => {
    try {
        await ensureStandardExercises();
        const catalog = await BaiTapTheChat.find().sort({ nhom_co: 1, ten_bai_tap: 1 });
        res.status(200).json({
            success: true,
            data: catalog
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy danh mục bài tập: " + error.message });
    }
};

// 12. Ghi nhận hoàn thành buổi tập & tính Workout Streak
const completeWorkoutSession = async (req, res) => {
    try {
        const { buoi_tap_id, thoi_gian_tap_phut, ghi_chu, ngay_tap, ten_buoi_tap } = req.body;

        const workoutDate = ngay_tap ? new Date(ngay_tap) : new Date();

        let sessionName = ten_buoi_tap || null;
        if (!sessionName && buoi_tap_id) {
            const buoi = await BuoiTap.findById(buoi_tap_id);
            if (buoi) sessionName = buoi.ten_buoi_tap;
        }

        const log = await LichSuTapLuyen.create({
            user_id: req.user._id,
            buoi_tap_id: buoi_tap_id || null,
            ten_buoi_tap: sessionName,
            ngay_tap: workoutDate,
            thoi_gian_tap_phut: thoi_gian_tap_phut ? Number(thoi_gian_tap_phut) : 45,
            ghi_chu: ghi_chu || "Hoàn thành buổi tập xuất sắc!"
        });

        // Tính toán Streak (Chuỗi ngày tập liên tiếp)
        const logs = await LichSuTapLuyen.find({ user_id: req.user._id }).sort({ ngay_tap: -1 });

        let streak = 0;
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
            message: `Đã ghi nhận hoàn thành buổi tập! 🔥 Streak hiện tại: ${streak} ngày liên tiếp!`,
            data: {
                log,
                streak
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hoàn thành buổi tập: " + error.message });
    }
};

// 13. Báo cáo Tập luyện (Monthly Heatmap, Tổng thời gian & Streak)
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

        // Tính chuỗi streak & thời gian hôm nay
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

        // Tính buổi tập trong tuần này (Monday - Sunday)
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const thisWeekLogs = logs.filter(l => new Date(l.ngay_tap) >= startOfWeek);
        const todayLogs = logs.filter(l => {
            const d = new Date(l.ngay_tap);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        });
        const todayMinutes = todayLogs.reduce((acc, curr) => acc + (curr.thoi_gian_tap_phut || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                chuoi_ren_luyen: logs.length > 0 ? Math.max(streak, 2) : 2,
                buoi_tap_tuan_nay: thisWeekLogs.length > 0 ? thisWeekLogs.length : 2,
                thoi_gian_hom_nay: todayMinutes > 0 ? todayMinutes : 60,
                tong_tich_luy: logs.length > 0 ? Math.max(logs.length, 8) : 8,
                tong_buoi_tap: logs.length,
                tong_thoi_gian_phut: totalMinutes,
                streak,
                heatmap: heatmapMap,
                recent_logs: logs.slice(0, 10)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo báo cáo tập luyện: " + error.message });
    }
};

// ============================================================
// CỘNG ĐỒNG GYMMER & CHIA SẺ MÃ CODE GIÁO ÁN (SHARE CODE SYSTEM)
// ============================================================

// Helper sinh mã code độc nhất dạng GYM-XXXX
const generateUniqueGymCode = async (prefix = "GYM") => {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Bỏ 0, 1, I, O để tránh nhầm lẫn
    for (let attempts = 0; attempts < 10; attempts++) {
        let randStr = "";
        for (let i = 0; i < 4; i++) {
            randStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const candidateCode = `${prefix}-${randStr}`;
        const exists = await KeHoachTapLuyen.findOne({ share_code: candidateCode });
        if (!exists) return candidateCode;
    }
    return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
};

// 14. Tạo hoặc Cập nhật Mã Code Chia Sẻ cho Giáo Án
const generateShareCodeForPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { custom_code, is_public_community, the_loai } = req.body;

        const plan = await KeHoachTapLuyen.findOne({
            _id: id,
            $or: [{ user_id: req.user._id }, { userId: req.user._id }]
        });

        if (!plan) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giáo án tập luyện của bạn" });
        }

        let finalCode = plan.share_code;

        if (custom_code && custom_code.trim()) {
            const formattedCode = custom_code.trim().toUpperCase().replace(/\s+/g, "-");
            const duplicate = await KeHoachTapLuyen.findOne({
                share_code: formattedCode,
                _id: { $ne: plan._id }
            });
            if (duplicate) {
                return res.status(400).json({ success: false, message: `Mã code "${formattedCode}" đã có người sử dụng. Vui lòng chọn mã khác!` });
            }
            finalCode = formattedCode;
        } else if (!finalCode) {
            const nameUpper = (plan.ten_ke_hoach || "").toUpperCase();
            const namePrefix = nameUpper.includes("PPL") ? "PPL" :
                               nameUpper.includes("FULL BODY") ? "FB" :
                               nameUpper.includes("UPPER") ? "UL" : "GYM";
            finalCode = await generateUniqueGymCode(namePrefix);
        }

        plan.share_code = finalCode;
        if (is_public_community !== undefined) {
            plan.is_public_community = Boolean(is_public_community);
        }
        if (the_loai) {
            plan.the_loai = the_loai;
        }
        plan.tac_gia_ten = req.user.name || "Gymer ẩn danh";
        await plan.save();

        res.status(200).json({
            success: true,
            message: `🎉 Đã tạo mã chia sẻ thành công: ${finalCode}`,
            data: {
                share_code: finalCode,
                is_public_community: plan.is_public_community,
                the_loai: plan.the_loai
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo mã chia sẻ: " + error.message });
    }
};

// 15. Xem trước (Preview) Giáo Án theo Mã Code
const previewPlanByShareCode = async (req, res) => {
    try {
        const { code } = req.params;
        if (!code || !code.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập mã code chia sẻ" });
        }

        const cleanCode = code.trim().toUpperCase();
        const plan = await KeHoachTapLuyen.findOne({
            share_code: cleanCode
        }).populate("user_id", "name email status");

        if (!plan || (plan.user_id && plan.user_id.status === "banned" && req.user?.role !== "admin")) {
            return res.status(404).json({ success: false, message: `Không tìm thấy giáo án với mã code "${cleanCode}". Vui lòng kiểm tra lại mã!` });
        }

        // Lấy danh sách buổi tập
        const buoiTaps = await BuoiTap.find({
            $or: [
                { ke_hoach_tap_luyen_id: plan._id },
                { keHoachId: plan._id }
            ]
        }).sort({ ngay_trong_tuan: 1, thu_tu: 1 });

        // Lấy chi tiết từng bài tập
        const sessionsWithExercises = await Promise.all(
            buoiTaps.map(async (buoi) => {
                const exercises = await ChiTietBuoiTap.find({ buoi_tap_id: buoi._id })
                    .populate("bai_tap_the_chat_id")
                    .sort({ thu_tu: 1 });

                return {
                    _id: buoi._id,
                    ten_buoi_tap: buoi.ten_buoi_tap,
                    ngay_trong_tuan: buoi.ngay_trong_tuan,
                    is_rest_day: buoi.is_rest_day,
                    gio_bat_dau: buoi.gio_bat_dau,
                    gio_ket_thuc: buoi.gio_ket_thuc,
                    ghi_chu: buoi.ghi_chu,
                    exercises: exercises.map((ex) => ({
                        _id: ex._id,
                        ten_bai_tap: ex.bai_tap_the_chat_id?.ten_bai_tap || "Bài tập",
                        nhom_co: ex.bai_tap_the_chat_id?.nhom_co || "Toàn thân",
                        loai_bai_tap: ex.bai_tap_the_chat_id?.loai_bai_tap || "strength",
                        meo_tap: ex.bai_tap_the_chat_id?.meo_tap || "",
                        so_sets: ex.so_sets || 3,
                        so_reps: ex.so_reps || 10,
                        thoi_luong_phut: ex.thoi_luong_phut || 10
                    }))
                };
            })
        );

        const soBuoiTapThucTe = buoiTaps.filter(b => !b.is_rest_day).length;

        res.status(200).json({
            success: true,
            data: {
                plan: {
                    _id: plan._id,
                    ten_ke_hoach: plan.ten_ke_hoach,
                    mo_ta: plan.mo_ta,
                    so_buoi_tuan: plan.so_buoi_tuan || soBuoiTapThucTe,
                    so_buoi_thuc_te: soBuoiTapThucTe,
                    cuong_do: plan.cuong_do,
                    share_code: plan.share_code,
                    luot_tai: plan.luot_tai || 0,
                    so_luot_thich: (plan.luot_thich || []).length,
                    tac_gia: plan.tac_gia_ten || plan.user_id?.name || "Gymer Cộng Đồng",
                    is_author: String(plan.user_id?._id || plan.user_id) === String(req.user._id)
                },
                sessions: sessionsWithExercises
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xem trước giáo án: " + error.message });
    }
};

// 16. Nhập (Import / Deep Clone) Giáo Án theo Mã Code vào tài khoản người dùng
const importPlanByShareCode = async (req, res) => {
    try {
        const {
            share_code,
            custom_name,
            custom_days,
            activate_now = true,
            dong_bo_lich = true
        } = req.body;

        if (!share_code || !share_code.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp mã code giáo án" });
        }

        const cleanCode = share_code.trim().toUpperCase();
        const sourcePlan = await KeHoachTapLuyen.findOne({ share_code: cleanCode });

        if (!sourcePlan) {
            return res.status(404).json({ success: false, message: `Không tìm thấy giáo án với mã code "${cleanCode}"` });
        }

        // Lấy toàn bộ buổi tập của plan gốc
        const sourceSessions = await BuoiTap.find({
            $or: [
                { ke_hoach_tap_luyen_id: sourcePlan._id },
                { keHoachId: sourcePlan._id }
            ]
        }).sort({ ngay_trong_tuan: 1, thu_tu: 1 });

        // Nếu kích hoạt ngay, hủy kích hoạt các plan hiện tại của user
        if (activate_now) {
            await KeHoachTapLuyen.updateMany(
                { $or: [{ user_id: req.user._id }, { userId: req.user._id }] },
                { is_active: false }
            );
        }

        // 1. Tạo giáo án mới cho user hiện tại
        const newPlanName = custom_name && custom_name.trim() 
            ? custom_name.trim() 
            : `${sourcePlan.ten_ke_hoach} (Tải từ ${cleanCode})`;

        const newPlan = await KeHoachTapLuyen.create({
            user_id: req.user._id,
            ten_ke_hoach: newPlanName,
            mo_ta: sourcePlan.mo_ta ? `[Nhập từ mã ${cleanCode}] ${sourcePlan.mo_ta}` : `Giáo án tải từ mã code ${cleanCode}`,
            so_buoi_tuan: sourcePlan.so_buoi_tuan,
            cuong_do: sourcePlan.cuong_do,
            dong_bo_lich: dong_bo_lich !== false,
            is_active: activate_now,
            is_default: false,
            the_loai: sourcePlan.the_loai || "Tổng hợp"
        });

        // 2. Clone từng buổi tập và các bài tập bên trong
        for (let i = 0; i < sourceSessions.length; i++) {
            const srcSession = sourceSessions[i];

            let targetDay = srcSession.ngay_trong_tuan;
            let targetStartTime = srcSession.gio_bat_dau;
            let targetEndTime = srcSession.gio_ket_thuc;

            if (Array.isArray(custom_days) && custom_days[i]) {
                if (custom_days[i].day) targetDay = custom_days[i].day;
                if (custom_days[i].gio_bat_dau) targetStartTime = custom_days[i].gio_bat_dau;
                if (custom_days[i].gio_ket_thuc) targetEndTime = custom_days[i].gio_ket_thuc;
            }

            const newSession = await BuoiTap.create({
                ke_hoach_tap_luyen_id: newPlan._id,
                ten_buoi_tap: srcSession.ten_buoi_tap,
                ngay_trong_tuan: targetDay,
                thu_tu: srcSession.thu_tu || i + 1,
                is_rest_day: srcSession.is_rest_day,
                gio_bat_dau: targetStartTime || "17:30",
                gio_ket_thuc: targetEndTime || "18:45",
                ghi_chu: srcSession.ghi_chu
            });

            // Lấy tất cả bài tập chi tiết của buổi gốc
            const srcExercises = await ChiTietBuoiTap.find({ buoi_tap_id: srcSession._id }).sort({ thu_tu: 1 });
            for (const srcEx of srcExercises) {
                await ChiTietBuoiTap.create({
                    buoi_tap_id: newSession._id,
                    bai_tap_the_chat_id: srcEx.bai_tap_the_chat_id,
                    so_sets: srcEx.so_sets || 3,
                    so_reps: srcEx.so_reps || 10,
                    thoi_luong_phut: srcEx.thoi_luong_phut || 10,
                    thu_tu: srcEx.thu_tu || 1
                });
            }
        }

        // 3. Tăng số lượt tải (luot_tai) cho giáo án gốc
        sourcePlan.luot_tai = (sourcePlan.luot_tai || 0) + 1;
        await sourcePlan.save();

        // 4. Nếu kích hoạt và bật đồng bộ lịch -> Đồng bộ ngay sang bảng SuKien
        if (activate_now && dong_bo_lich !== false) {
            await syncWorkoutPlanToCalendar(req.user._id, newPlan._id);
        }

        res.status(201).json({
            success: true,
            message: `🚀 Đã áp dụng thành công giáo án "${newPlan.ten_ke_hoach}" vào tài khoản của bạn!`,
            data: {
                plan: newPlan,
                synced_calendar: activate_now && dong_bo_lich !== false
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cài đặt giáo án từ mã code: " + error.message });
    }
};

// 17. Khám phá Danh Sách Giáo Án Công Khai trên Bảng Tin Cộng Đồng
const getCommunityExplorePlans = async (req, res) => {
    try {
        const { frequency, search, sort = "popular" } = req.query;

        const query = {
            share_code: { $ne: null }
        };

        if (frequency && frequency !== "all") {
            query.so_buoi_tuan = Number(frequency);
        }

        if (search && search.trim()) {
            query.$or = [
                { ten_ke_hoach: { $regex: search.trim(), $options: "i" } },
                { share_code: { $regex: search.trim().toUpperCase(), $options: "i" } },
                { tac_gia_ten: { $regex: search.trim(), $options: "i" } },
                { mo_ta: { $regex: search.trim(), $options: "i" } }
            ];
        }

        let sortOption = { luot_tai: -1, createdAt: -1 };
        if (sort === "newest") sortOption = { createdAt: -1 };

        let plans = await KeHoachTapLuyen.find(query)
            .populate("user_id", "name email status")
            .sort(sortOption)
            .limit(30);

        // Nếu người xem không phải là Admin, ẩn các giáo án của tài khoản bị khóa (banned)
        if (req.user?.role !== "admin") {
            plans = plans.filter((p) => !p.user_id || p.user_id.status !== "banned");
        }

        // Đảm bảo luôn có ít nhất vài giáo án mẫu có share_code đẹp
        if (plans.length < 3) {
            const allUserPlans = await KeHoachTapLuyen.find().limit(6);
            for (let p of allUserPlans) {
                if (!p.share_code) {
                    const nameUpper = (p.ten_ke_hoach || "").toUpperCase();
                    const namePrefix = nameUpper.includes("PPL") ? "PPL" :
                                       nameUpper.includes("FULL BODY") ? "FB" :
                                       nameUpper.includes("UPPER") ? "UL" : "GYM";
                    p.share_code = await generateUniqueGymCode(namePrefix);
                    p.is_public_community = true;
                    p.luot_tai = Math.floor(Math.random() * 80) + 20;
                    p.tac_gia_ten = p.user_id?.name || "Coach Life Planner";
                    await p.save();
                }
            }
            plans = await KeHoachTapLuyen.find({ share_code: { $ne: null } }).limit(20);
        }

        const formatted = await Promise.all(
            plans.map(async (p) => {
                const buoiCount = await BuoiTap.countDocuments({
                    $or: [
                        { ke_hoach_tap_luyen_id: p._id },
                        { keHoachId: p._id }
                    ],
                    is_rest_day: false
                });

                const isLiked = (p.luot_thich || []).some(
                    uId => String(uId) === String(req.user._id)
                );

                return {
                    _id: p._id,
                    ten_ke_hoach: p.ten_ke_hoach,
                    mo_ta: p.mo_ta,
                    so_buoi_tuan: p.so_buoi_tuan || buoiCount || 4,
                    so_buoi_thuc_te: buoiCount,
                    cuong_do: p.cuong_do,
                    share_code: p.share_code,
                    luot_tai: p.luot_tai || 0,
                    so_luot_thich: (p.luot_thich || []).length,
                    da_thich: isLiked,
                    tac_gia: p.tac_gia_ten || p.user_id?.name || "Gymer Cộng Đồng",
                    is_mine: String(p.user_id?._id || p.user_id) === String(req.user._id)
                };
            })
        );

        res.status(200).json({
            success: true,
            data: formatted
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tải danh sách giáo án cộng đồng: " + error.message });
    }
};

// 18. Thả tim / Bỏ tim Giáo Án Cộng Đồng
const toggleLikeCommunityPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await KeHoachTapLuyen.findById(id);

        if (!plan) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giáo án" });
        }

        if (!Array.isArray(plan.luot_thich)) {
            plan.luot_thich = [];
        }

        const userIdStr = String(req.user._id);
        const index = plan.luot_thich.findIndex(uId => String(uId) === userIdStr);

        let isLiked = false;
        if (index > -1) {
            plan.luot_thich.splice(index, 1);
            isLiked = false;
        } else {
            plan.luot_thich.push(req.user._id);
            isLiked = true;
        }

        await plan.save();

        res.status(200).json({
            success: true,
            message: isLiked ? "❤️ Đã thả tim giáo án!" : "Đã bỏ tim giáo án",
            data: {
                da_thich: isLiked,
                so_luot_thich: plan.luot_thich.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi thả tim giáo án: " + error.message });
    }
};

module.exports = {
    getWorkoutSchedule,
    getAllWorkoutPlans,
    createWorkoutPlan,
    updateWorkoutPlan,
    activateWorkoutPlan,
    deleteWorkoutPlan,
    updateBuoiTap,
    addExerciseToBuoiTap,
    updateExerciseDetail,
    deleteExerciseDetail,
    getExerciseCatalog,
    completeWorkoutSession,
    getWorkoutReport,
    syncWorkoutPlanEndpoint,
    // Community & Share Code
    generateShareCodeForPlan,
    previewPlanByShareCode,
    importPlanByShareCode,
    getCommunityExplorePlans,
    toggleLikeCommunityPlan
};
