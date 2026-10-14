const KeHoachTapLuyen = require("../../Model/KeHoachTapLuyen");
const BuoiTap = require("../../Model/BuoiTap");
const ChiTietBuoiTap = require("../../Model/ChiTietBuoiTap");
const LichSuTapLuyen = require("../../Model/LichSuTapLuyen");
const BaiTapTheChat = require("../../Model/BaiTapTheChat");
const User = require("../../Model/User");

// Seed các bài tập mẫu nếu cơ sở dữ liệu trống
const ensureStandardExercises = async () => {
    const count = await BaiTapTheChat.countDocuments();
    if (count > 0) return;

    const defaultExercises = [
        { ten_bai_tap: "Barbell Bench Press", nhom_co: "Ngực", loai_bai_tap: "strength", meo_tap: "Giữ cổ tay thẳng, hạ thanh đòn có kiểm soát" },
        { ten_bai_tap: "Incline Dumbbell Press", nhom_co: "Ngực trên", loai_bai_tap: "strength", meo_tap: "Ghế nghiêng 30 độ" },
        { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", meo_tap: "Kéo cùi chỏ về phía hông, không giật người" },
        { ten_bai_tap: "Barbell Bent Over Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", meo_tap: "Lưng thẳng, gập người 45 độ" },
        { ten_bai_tap: "Barbell Back Squat", nhom_co: "Đùi trước & Mông", loai_bai_tap: "strength", meo_tap: "Đầu gối hướng theo mũi chân" },
        { ten_bai_tap: "Romanian Deadlift", nhom_co: "Đùi sau & Lưng dưới", loai_bai_tap: "strength", meo_tap: "Đẩy mông ra sau, lưng giữ thẳng" },
        { ten_bai_tap: "Tricep Rope Pushdown", nhom_co: "Tay sau", loai_bai_tap: "strength", meo_tap: "Cố định cùi chỏ sát mạn sườn" },
        { ten_bai_tap: "Bicep Barbell Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", meo_tap: "Không đung đưa người lấy đà" },
        { ten_bai_tap: "Plank Cổ Điển", nhom_co: "Cơ bụng & Core", loai_bai_tap: "core", meo_tap: "Gồng chắc cơ bụng, giữ thẳng người" }
    ];

    await BaiTapTheChat.insertMany(defaultExercises);
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

// 3. Tạo Kế hoạch tập luyện cá nhân mới
const createWorkoutPlan = async (req, res) => {
    try {
        const { ten_ke_hoach, mo_ta, is_active } = req.body;

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

        const newPlan = await KeHoachTapLuyen.create({
            user_id: req.user._id,
            ten_ke_hoach: ten_ke_hoach.trim(),
            mo_ta: mo_ta ? mo_ta.trim() : "",
            is_active: shouldBeActive,
            is_default: false
        });

        // Tự động khởi tạo khung 7 ngày (Thứ 2 đến Chủ nhật) cho kế hoạch mới
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
                is_rest_day: d.isRest
            });
        }

        res.status(201).json({
            success: true,
            message: "Tạo kế hoạch tập luyện thành công!",
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

// 7. Cập nhật Buổi tập (Tên buổi, Ngày trong tuần, Đánh dấu ngày nghỉ)
const updateBuoiTap = async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_buoi_tap, is_rest_day, ghi_chu, ngay_trong_tuan } = req.body;

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
        if (ngay_trong_tuan !== undefined) {
            const dayNum = Number(ngay_trong_tuan);
            if (dayNum >= 2 && dayNum <= 8) {
                buoi.ngay_trong_tuan = dayNum;
            }
        }

        await buoi.save();

        res.status(200).json({
            success: true,
            message: "Cập nhật buổi tập thành công!",
            data: buoi
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật buổi tập: " + error.message });
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
    getWorkoutReport
};
