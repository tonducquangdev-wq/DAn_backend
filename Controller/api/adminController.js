const mongoose = require("mongoose");
const User = require("../../Model/User");
const DangKyChuyenGia = require("../../Model/DangKyChuyenGia");
const GiaSu = require("../../Model/GiaSu");
const HuanLuyenVien = require("../../Model/HuanLuyenVien");
const ThongBao = require("../../Model/ThongBao");
const MonHoc = require("../../Model/MonHoc");
const SuKien = require("../../Model/SuKien");
const DuAn = require("../../Model/DuAn");
const KeHoachTapLuyen = require("../../Model/KeHoachTapLuyen");
const BaiTap = require("../../Model/BaiTap");
const CaLamViec = require("../../Model/CaLamViec");
const LichHoc = require("../../Model/LichHoc");
const { sendPushBroadcast } = require("../../Utils/pushService");

/**
 * 1. Thống kê tổng quan hệ thống cho Admin Dashboard
 */
const getThongKeAdmin = async (req, res) => {
    try {
        const [
            tongUsers,
            soSinhVien,
            soGiaSu,
            soPT,
            soAdmin,
            tongHoSo,
            hoSoChoDuyet,
            hoSoDaDuyet,
            hoSoTuChoi,
            tongMonHoc,
            tongSuKien,
            tongDuAn,
            tongGiaoAnGym
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "user" }),
            User.countDocuments({ role: "tutor" }),
            User.countDocuments({ role: "pt" }),
            User.countDocuments({ role: "admin" }),
            DangKyChuyenGia.countDocuments(),
            DangKyChuyenGia.countDocuments({ trang_thai: "pending" }),
            DangKyChuyenGia.countDocuments({ trang_thai: "approved" }),
            DangKyChuyenGia.countDocuments({ trang_thai: "rejected" }),
            MonHoc.countDocuments(),
            SuKien.countDocuments(),
            DuAn.countDocuments(),
            KeHoachTapLuyen.countDocuments()
        ]);

        // Tính toán xu hướng 7 ngày gần nhất (Daily Trend)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const [userGrowthRaw, appGrowthRaw] = await Promise.all([
            User.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            DangKyChuyenGia.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const dailyGrowth = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
            const userFound = userGrowthRaw.find(item => item._id === dateStr);
            const appFound = appGrowthRaw.find(item => item._id === dateStr);
            dailyGrowth.push({
                date: dateStr,
                label: dayLabel,
                users: userFound ? userFound.count : 0,
                applications: appFound ? appFound.count : 0
            });
        }

        // Tỉ lệ phê duyệt thành công
        const totalProcessed = hoSoDaDuyet + hoSoTuChoi;
        const approvalRate = totalProcessed > 0 ? Math.round((hoSoDaDuyet / totalProcessed) * 100) : 100;

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: tongUsers,
                    students: soSinhVien,
                    tutors: soGiaSu,
                    pts: soPT,
                    admins: soAdmin
                },
                applications: {
                    total: tongHoSo,
                    pending: hoSoChoDuyet,
                    approved: hoSoDaDuyet,
                    rejected: hoSoTuChoi,
                    approval_rate: approvalRate
                },
                content: {
                    subjects: tongMonHoc,
                    events: tongSuKien,
                    projects: tongDuAn,
                    workout_plans: tongGiaoAnGym
                },
                charts: {
                    daily_growth: dailyGrowth,
                    role_distribution: [
                        { key: "students", label: "Sinh viên / Học viên", count: soSinhVien, color: "#3b82f6" },
                        { key: "tutors", label: "Gia Sư Học Tập", count: soGiaSu, color: "#10b981" },
                        { key: "pts", label: "HLV Thể Hình (PT)", count: soPT, color: "#8b5cf6" },
                        { key: "admins", label: "Quản Trị Viên", count: soAdmin, color: "#f59e0b" }
                    ],
                    app_distribution: [
                        { key: "pending", label: "Chờ phê duyệt", count: hoSoChoDuyet, color: "#f59e0b" },
                        { key: "approved", label: "Đã phê duyệt", count: hoSoDaDuyet, color: "#10b981" },
                        { key: "rejected", label: "Đã từ chối", count: hoSoTuChoi, color: "#ef4444" }
                    ]
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy thống kê quản trị: " + error.message
        });
    }
};

/**
 * 2. Lấy danh sách hồ sơ đăng ký chuyên gia cần duyệt / đã xử lý
 */
const getDanhSachHoSo = async (req, res) => {
    try {
        const { trang_thai, loai, search } = req.query;
        let filter = {};

        if (trang_thai && trang_thai !== "all") {
            filter.trang_thai = trang_thai;
        }

        if (loai && loai !== "all") {
            filter.loai = loai;
        }

        if (search) {
            filter.$or = [
                { ho_ten: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { so_dien_thoai: { $regex: search, $options: "i" } },
                { chuyen_mon: { $regex: search, $options: "i" } }
            ];
        }

        const hoSoList = await DangKyChuyenGia.find(filter)
            .populate("user_id", "name email avatar role status createdAt")
            .populate("nguoi_duyet_id", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: hoSoList.length,
            data: hoSoList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách hồ sơ: " + error.message
        });
    }
};

/**
 * 3. Phê duyệt hồ sơ chuyên gia (Gia sư hoặc PT)
 */
const duyetHoSo = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user._id;

        const hoSo = await DangKyChuyenGia.findById(id).populate("user_id");
        if (!hoSo) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy hồ sơ đăng ký chuyên gia."
            });
        }

        if (hoSo.trang_thai === "approved") {
            return res.status(400).json({
                success: false,
                message: "Hồ sơ này đã được phê duyệt trước đó."
            });
        }

        // Cập nhật trạng thái hồ sơ
        hoSo.trang_thai = "approved";
        hoSo.ngay_duyet = new Date();
        hoSo.nguoi_duyet_id = adminId;
        hoSo.ly_do_tu_choi = null;
        await hoSo.save();

        // Nâng cấp quyền người dùng
        const user = await User.findById(hoSo.user_id._id);
        if (user) {
            user.role = hoSo.loai === "gia_su" ? "tutor" : "pt";
            user.is_expert_verified = true;
            if (hoSo.so_dien_thoai && !user.phone) user.phone = hoSo.so_dien_thoai;
            if (hoSo.mo_ta && !user.bio) user.bio = hoSo.mo_ta;
            await user.save();
        }

        // Tạo hoặc đồng bộ dữ liệu vào danh bạ Gia Sư hoặc PT để hiển thị ra cộng đồng
        if (hoSo.loai === "gia_su") {
            let giaSu = await GiaSu.findOne({ user_id: hoSo.user_id._id });
            const giaSuData = {
                user_id: hoSo.user_id._id,
                ho_ten: hoSo.ho_ten,
                mon_hoc_chuyen_mon: hoSo.chuyen_mon,
                so_dien_thoai: hoSo.so_dien_thoai,
                email: hoSo.email,
                gia_theo_gio: hoSo.gia_theo_gio || 200000,
                mo_ta: hoSo.mo_ta || `Gia sư chuyên giảng dạy ${hoSo.chuyen_mon}`,
                rating: 5.0,
                avatar: user?.avatar || "/images/tutors/avatar_default.jpg",
                khung_gio_day: hoSo.khung_gio_day || "Buổi tối & Cuối tuần",
                kinh_nghiem: hoSo.kinh_nghiem || "1+ năm kinh nghiệm",
                khu_vuc: hoSo.khu_vuc || "Online toàn quốc",
                hoc_vi: hoSo.hoc_vi_hoac_the_hinh || "Cử nhân Đại học",
                truong_tot_nghiep: hoSo.truong_tot_nghiep || "Đại học Quốc gia",
                bang_cap: hoSo.chung_chi.map(cc => ({
                    ten_bang: cc.ten_chung_chi,
                    to_chuc: cc.noi_cap || "Đại học / Tổ chức uy tín",
                    nam: cc.nam_cap || "2025",
                    xep_loai: "Xuất sắc",
                    hinh_anh: cc.hinh_anh || "/images/degree_certificate.jpg",
                    da_xac_thuc: true
                })),
                bang_diem: {
                    gpa_he_4: hoSo.bang_diem?.gpa_he_4 || 3.6,
                    gpa_he_10: hoSo.bang_diem?.gpa_he_10 || 8.5,
                    xep_loai: "Giỏi",
                    truong_dai_hoc: hoSo.truong_tot_nghiep || "Đại học",
                    hinh_anh: hoSo.bang_diem?.hinh_anh || "/images/academic_transcript.jpg",
                    da_xac_thuc: true
                }
            };

            if (giaSu) {
                Object.assign(giaSu, giaSuData);
                await giaSu.save();
            } else {
                await GiaSu.create(giaSuData);
            }
        } else if (hoSo.loai === "pt") {
            let hlv = await HuanLuyenVien.findOne({ user_id: hoSo.user_id._id });
            const hlvData = {
                user_id: hoSo.user_id._id,
                ho_ten: hoSo.ho_ten,
                chuyen_mon: hoSo.chuyen_mon,
                so_dien_thoai: hoSo.so_dien_thoai,
                email: hoSo.email,
                gia_theo_gio: hoSo.gia_theo_gio || 250000,
                mo_ta: hoSo.mo_ta || `HLV cá nhân định hướng ${hoSo.chuyen_mon}`,
                rating: 5.0,
                avatar: user?.avatar || "/images/pt/pt_default.jpg",
                khung_gio_tap: hoSo.khung_gio_day || "Sáng & Tối linh hoạt",
                kinh_nghiem: hoSo.kinh_nghiem || "2+ năm kinh nghiệm PT",
                khu_vuc: hoSo.khu_vuc || "Phòng Gym & Online",
                chung_chi_the_hinh: hoSo.hoc_vi_hoac_the_hinh || "Chứng chỉ Huấn Luyện Viên Quốc Gia",
                chung_chi: hoSo.chung_chi.map(cc => ({
                    ten_bang: cc.ten_chung_chi,
                    to_chuc: cc.noi_cap || "Liên đoàn Thể hình",
                    nam: cc.nam_cap || "2025",
                    xep_loai: "Xuất sắc",
                    hinh_anh: cc.hinh_anh || "/images/pt_certificate.jpg",
                    da_xac_thuc: true
                }))
            };

            if (hlv) {
                Object.assign(hlv, hlvData);
                await hlv.save();
            } else {
                await HuanLuyenVien.create(hlvData);
            }
        }

        // Gửi thông báo cho người dùng
        const tenChucDanh = hoSo.loai === "gia_su" ? "Gia Sư Học Tập" : "Huấn Luyện Viên Thể Hình (PT)";
        await ThongBao.create({
            user_id: hoSo.user_id._id,
            tieu_de: `🎉 Hồ sơ ${tenChucDanh} của bạn đã được phê duyệt!`,
            noi_dung: `Chúc mừng bạn! Ban Quản Trị Life Planner đã thẩm định và phê duyệt hồ sơ chuyên môn của bạn. Hồ sơ của bạn hiện đã được xác thực chính thức trên toàn hệ thống.`,
            loai: "success",
            data: { ho_so_id: hoSo._id, role: hoSo.loai }
        });

        res.status(200).json({
            success: true,
            message: `Đã phê duyệt thành công hồ sơ chuyên gia cho ${hoSo.ho_ten}. Người dùng đã được nâng cấp quyền thành [${hoSo.loai.toUpperCase()}].`,
            data: hoSo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi phê duyệt hồ sơ: " + error.message
        });
    }
};

/**
 * 4. Từ chối hồ sơ chuyên gia kèm lý do
 */
const tuChoiHoSo = async (req, res) => {
    try {
        const { id } = req.params;
        const { ly_do } = req.body;
        const adminId = req.user._id;

        const hoSo = await DangKyChuyenGia.findById(id).populate("user_id");
        if (!hoSo) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy hồ sơ đăng ký."
            });
        }

        hoSo.trang_thai = "rejected";
        hoSo.ly_do_tu_choi = ly_do || "Bằng cấp hoặc thông tin xác thực chưa đạt yêu cầu kiểm duyệt của hệ thống.";
        hoSo.ngay_duyet = new Date();
        hoSo.nguoi_duyet_id = adminId;
        await hoSo.save();

        // Gửi thông báo phản hồi
        const tenChucDanh = hoSo.loai === "gia_su" ? "Gia Sư" : "Huấn Luyện Viên PT";
        await ThongBao.create({
            user_id: hoSo.user_id._id,
            tieu_de: `⚠️ Hồ sơ đăng ký ${tenChucDanh} chưa được phê duyệt`,
            noi_dung: `Rất tiếc, hồ sơ đăng ký của bạn chưa được duyệt. Lý do: "${hoSo.ly_do_tu_choi}". Bạn có thể cập nhật thông tin và nộp lại hồ sơ mới.`,
            loai: "warning",
            data: { ho_so_id: hoSo._id }
        });

        res.status(200).json({
            success: true,
            message: "Đã từ chối hồ sơ và gửi thông báo phản hồi tới người dùng.",
            data: hoSo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi từ chối hồ sơ: " + error.message
        });
    }
};

/**
 * 5. Quản lý danh sách người dùng trong hệ thống
 */
const getDanhSachUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        let filter = {};

        if (role && role !== "all") {
            filter.role = role;
        }

        if (status && status !== "all") {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách người dùng: " + error.message
        });
    }
};

/**
 * 6. Cập nhật quyền (role) hoặc khóa/mở khóa tài khoản (status)
 */
const capNhatUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status } = req.body;
        const currentAdminId = req.user._id.toString();

        if (id === currentAdminId && status === "banned") {
            return res.status(400).json({
                success: false,
                message: "Bạn không thể tự khóa tài khoản Admin đang đăng nhập của chính mình!"
            });
        }

        if (id === currentAdminId && role && role !== "admin") {
            return res.status(400).json({
                success: false,
                message: "Bạn không thể tự hạ quyền Admin của chính mình!"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng."
            });
        }

        if (role && ["user", "tutor", "pt", "admin"].includes(role)) {
            user.role = role;
        }

        if (status && ["active", "banned"].includes(status)) {
            user.status = status;
        }

        await user.save();

        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({
            success: true,
            message: "Cập nhật tài khoản người dùng thành công.",
            data: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi cập nhật người dùng: " + error.message
        });
    }
};

/**
 * 7. Phát thông báo từ Admin (Cả server, Người dùng, Gia sư, PT hoặc Cá nhân)
 */
const guiThongBaoAdmin = async (req, res) => {
    try {
        const { target_type, target_user_id, tieu_de, noi_dung, loai } = req.body;

        if (!tieu_de || !tieu_de.trim() || !noi_dung || !noi_dung.trim()) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo."
            });
        }

        let query = { status: { $ne: "banned" } };
        let targetDescription = "toàn bộ máy chủ";

        switch (target_type) {
            case "all":
                targetDescription = "cả server (tất cả thành viên)";
                break;
            case "user":
                query.role = "user";
                targetDescription = "tất cả Học viên / Sinh viên";
                break;
            case "tutor":
                query.role = "tutor";
                targetDescription = "tất cả Gia Sư";
                break;
            case "pt":
                query.role = "pt";
                targetDescription = "tất cả Huấn Luyện Viên PT";
                break;
            case "specific":
                if (!target_user_id) {
                    return res.status(400).json({
                        success: false,
                        message: "Vui lòng chỉ định người dùng nhận thông báo."
                    });
                }
                query = { _id: target_user_id };
                targetDescription = "người dùng được chọn";
                break;
            default:
                targetDescription = "cả server";
                break;
        }

        const targetUsers = await User.find(query, "_id name email role");
        if (!targetUsers || targetUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy người dùng nào thuộc nhóm [${target_type}].`
            });
        }

        const broadcastBatchId = new mongoose.Types.ObjectId().toString();

        const notifications = targetUsers.map(u => ({
            user_id: u._id,
            tieu_de: tieu_de.trim(),
            noi_dung: noi_dung.trim(),
            loai: loai || "info",
            da_doc: false,
            data: {
                is_admin_broadcast: true,
                broadcast_batch_id: broadcastBatchId,
                target_type: target_type || "all",
                target_desc: targetDescription,
                admin_id: req.user._id,
                admin_name: req.user.name || "Ban Quản Trị"
            }
        }));

        await ThongBao.insertMany(notifications);

        // Bắn Push Notification ra điện thoại của tất cả người nhận
        sendPushBroadcast({
            title: `📢 ${tieu_de.trim()}`,
            body: noi_dung.trim(),
            url: "/"
        }, target_type).catch(err => console.error("Lỗi gửi push broadcast:", err));

        res.status(200).json({
            success: true,
            message: `Đã phát thông báo thành công tới ${targetUsers.length} tài khoản (${targetDescription})!`,
            data: {
                batch_id: broadcastBatchId,
                recipient_count: targetUsers.length,
                target_type,
                target_desc: targetDescription,
                tieu_de,
                noi_dung,
                loai: loai || "info",
                sent_at: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi phát thông báo: " + error.message
        });
    }
};

/**
 * 8. Lấy lịch sử các đợt phát thông báo của Admin
 */
const getLichSuThongBaoAdmin = async (req, res) => {
    try {
        const broadcasts = await ThongBao.aggregate([
            {
                $match: {
                    "data.is_admin_broadcast": true
                }
            },
            {
                $group: {
                    _id: "$data.broadcast_batch_id",
                    tieu_de: { $first: "$tieu_de" },
                    noi_dung: { $first: "$noi_dung" },
                    loai: { $first: "$loai" },
                    target_type: { $first: "$data.target_type" },
                    target_desc: { $first: "$data.target_desc" },
                    admin_name: { $first: "$data.admin_name" },
                    createdAt: { $first: "$createdAt" },
                    recipient_count: { $sum: 1 },
                    read_count: {
                        $sum: {
                            $cond: [{ $eq: ["$da_doc", true] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 30 }
        ]);

        res.status(200).json({
            success: true,
            data: broadcasts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy lịch sử thông báo: " + error.message
        });
    }
};

/**
 * 9. Lấy toàn bộ dữ liệu & thông tin cá nhân của một người dùng (Dành riêng cho Admin)
 * Cho phép Admin kiểm tra chi tiết thông tin, lịch học, dự án, ca làm, lịch tập, sự kiện của user (kể cả khi đã bị khóa)
 */
const getChiTietDuLieuUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "ID người dùng không hợp lệ" });
        }

        const user = await User.findById(id).select("-password").lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        const [
            giaSu,
            hlv,
            dangKyList,
            monHocs,
            baiTaps,
            duAns,
            caLams,
            keHoachs,
            soSuKien
        ] = await Promise.all([
            GiaSu.findOne({ user_id: id }).lean(),
            HuanLuyenVien.findOne({ user_id: id }).lean(),
            DangKyChuyenGia.find({ user_id: id }).sort({ createdAt: -1 }).lean(),
            MonHoc.find({ user_id: id }).lean(),
            BaiTap.find({ user_id: id }).lean(),
            DuAn.find({ user_id: id }).lean(),
            CaLamViec.find({ user_id: id }).sort({ ngay_lam: -1 }).lean(),
            KeHoachTapLuyen.find({ user_id: id }).lean(),
            SuKien.countDocuments({ user_id: id })
        ]);

        res.status(200).json({
            success: true,
            data: {
                user,
                chuyen_gia: {
                    gia_su: giaSu,
                    hlv: hlv,
                    dang_ky: dangKyList
                },
                hoc_tap: {
                    mon_hocs: monHocs,
                    bai_taps: baiTaps
                },
                viec_lam: {
                    du_ans: duAns,
                    ca_lam_viecs: caLams
                },
                tap_luyen: {
                    ke_hoachs: keHoachs
                },
                thong_ke: {
                    so_su_kien: soSuKien,
                    so_mon_hoc: monHocs.length,
                    so_bai_tap: baiTaps.length,
                    so_du_an: duAns.length,
                    so_ca_lam: caLams.length,
                    so_giao_an: keHoachs.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi nạp dữ liệu chi tiết người dùng: " + error.message });
    }
};

module.exports = {
    getThongKeAdmin,
    getDanhSachHoSo,
    duyetHoSo,
    tuChoiHoSo,
    getDanhSachUsers,
    capNhatUser,
    guiThongBaoAdmin,
    getLichSuThongBaoAdmin,
    getChiTietDuLieuUser
};
