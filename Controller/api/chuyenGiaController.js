const DangKyChuyenGia = require("../../Model/DangKyChuyenGia");
const User = require("../../Model/User");

/**
 * Người dùng nộp hồ sơ đăng ký làm Gia sư hoặc PT
 */
const dangKyChuyenGia = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            loai, // "gia_su" hoặc "pt"
            ho_ten,
            so_dien_thoai,
            email,
            chuyen_mon,
            kinh_nghiem,
            khu_vuc,
            gia_theo_gio,
            mo_ta,
            hoc_vi_hoac_the_hinh,
            truong_tot_nghiep,
            khung_gio_day,
            chung_chi,
            bang_diem
        } = req.body;

        if (!loai || !["gia_su", "pt"].includes(loai)) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn loại chuyên môn hợp lệ (gia_su hoặc pt)."
            });
        }

        if (!ho_ten || !so_dien_thoai || !email || !chuyen_mon) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ các thông tin bắt buộc: Họ tên, Số điện thoại, Email và Chuyên môn."
            });
        }

        // Kiểm tra xem người dùng đã là role này chưa
        if (req.user.role === loai) {
            return res.status(400).json({
                success: false,
                message: `Bạn hiện tại đã là ${loai === "gia_su" ? "Gia sư" : "Huấn luyện viên PT"} được xác thực trên hệ thống!`
            });
        }

        // Kiểm tra xem có đơn nào đang chờ duyệt không
        const existingPending = await DangKyChuyenGia.findOne({
            user_id: userId,
            loai,
            trang_thai: "pending"
        });

        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: `Bạn đã có một hồ sơ đăng ký ${loai === "gia_su" ? "Gia sư" : "Huấn luyện viên PT"} đang chờ Admin phê duyệt. Vui lòng chờ phản hồi.`,
                data: existingPending
            });
        }

        const hoSoMoi = await DangKyChuyenGia.create({
            user_id: userId,
            loai,
            ho_ten,
            so_dien_thoai,
            email,
            chuyen_mon,
            kinh_nghiem: kinh_nghiem || "1-2 năm kinh nghiệm",
            khu_vuc: khu_vuc || "Online toàn quốc",
            gia_theo_gio: Number(gia_theo_gio) || 200000,
            mo_ta: mo_ta || "",
            hoc_vi_hoac_the_hinh: hoc_vi_hoac_the_hinh || "",
            truong_tot_nghiep: truong_tot_nghiep || "",
            khung_gio_day: khung_gio_day || "Linh hoạt",
            chung_chi: Array.isArray(chung_chi) ? chung_chi : [],
            bang_diem: bang_diem || {}
        });

        res.status(201).json({
            success: true,
            message: `Nộp hồ sơ đăng ký ${loai === "gia_su" ? "Gia sư" : "Huấn luyện viên PT"} thành công! Ban quản trị sẽ thẩm định bằng cấp của bạn sớm nhất.`,
            data: hoSoMoi
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi nộp hồ sơ chuyên gia: " + error.message
        });
    }
};

/**
 * Lấy lịch sử / trạng thái các hồ sơ đã nộp của tài khoản hiện tại
 */
const getTrangThaiHoSo = async (req, res) => {
    try {
        const userId = req.user._id;
        const hoSoList = await DangKyChuyenGia.find({ user_id: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: hoSoList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi lấy trạng thái hồ sơ: " + error.message
        });
    }
};

/**
 * Hủy hồ sơ đăng ký khi còn đang ở trạng thái pending
 */
const huyHoSo = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const hoSo = await DangKyChuyenGia.findOne({ _id: id, user_id: userId });
        if (!hoSo) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy hồ sơ đăng ký."
            });
        }

        if (hoSo.trang_thai !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể hủy hồ sơ khi đang ở trạng thái chờ duyệt (pending)."
            });
        }

        await DangKyChuyenGia.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Đã hủy hồ sơ đăng ký thành công."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi hủy hồ sơ: " + error.message
        });
    }
};

module.exports = {
    dangKyChuyenGia,
    getTrangThaiHoSo,
    huyHoSo
};
