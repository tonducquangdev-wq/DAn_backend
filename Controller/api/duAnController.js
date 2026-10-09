const DuAn = require("../../Model/DuAn");
const CongViec = require("../../Model/CongViec");

// 1. Quản lý Dự án
const getDuAn = async (req, res) => {
    try {
        const duAns = await DuAn.find({ user_id: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: duAns });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy dự án: " + error.message });
    }
};

const createDuAn = async (req, res) => {
    try {
        const { ten_du_an, mo_ta, mau_sac, trang_thai, ngay_bat_dau, ngay_ket_thuc } = req.body;
        if (!ten_du_an) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Tên dự án" });
        }

        const duAn = await DuAn.create({
            user_id: req.user._id,
            ten_du_an,
            mo_ta: mo_ta || null,
            mau_sac: mau_sac || "#6366F1",
            trang_thai: trang_thai || "dang_thuc_hien",
            ngay_bat_dau: ngay_bat_dau || null,
            ngay_ket_thuc: ngay_ket_thuc || null
        });

        res.status(201).json({ success: true, message: "Tạo dự án thành công", data: duAn });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo dự án: " + error.message });
    }
};

const updateDuAn = async (req, res) => {
    try {
        const { id } = req.params;
        const duAn = await DuAn.findOne({ _id: id, user_id: req.user._id });
        if (!duAn) return res.status(404).json({ success: false, message: "Không tìm thấy dự án" });

        Object.assign(duAn, req.body);
        await duAn.save();

        res.status(200).json({ success: true, message: "Cập nhật dự án thành công", data: duAn });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật dự án: " + error.message });
    }
};

const deleteDuAn = async (req, res) => {
    try {
        const { id } = req.params;
        await DuAn.deleteOne({ _id: id, user_id: req.user._id });
        await CongViec.deleteMany({ du_an_id: id, user_id: req.user._id });
        res.status(200).json({ success: true, message: "Xóa dự án thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa dự án: " + error.message });
    }
};

// 2. Quản lý Công việc / Task
const getCongViec = async (req, res) => {
    try {
        const { du_an_id, trang_thai } = req.query;
        const query = { user_id: req.user._id };

        if (du_an_id) query.du_an_id = du_an_id;
        if (trang_thai) query.trang_thai = trang_thai;

        const congViecs = await CongViec.find(query)
            .populate("du_an_id", "ten_du_an mau_sac")
            .sort({ han_chot: 1 });

        res.status(200).json({ success: true, data: congViecs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy công việc: " + error.message });
    }
};

const createCongViec = async (req, res) => {
    try {
        const { tieu_de, du_an_id, mo_ta, do_uu_tien, trang_thai, tien_do, han_chot } = req.body;
        if (!tieu_de) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Tiêu đề công việc" });
        }

        const congViec = await CongViec.create({
            user_id: req.user._id,
            du_an_id: du_an_id || null,
            tieu_de,
            mo_ta: mo_ta || null,
            do_uu_tien: do_uu_tien || "trung_binh",
            trang_thai: trang_thai || "chua_lam",
            tien_do: tien_do ? Number(tien_do) : 0,
            han_chot: han_chot || null
        });

        res.status(201).json({ success: true, message: "Tạo công việc thành công", data: congViec });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tạo công việc: " + error.message });
    }
};

const updateCongViec = async (req, res) => {
    try {
        const { id } = req.params;
        const congViec = await CongViec.findOne({ _id: id, user_id: req.user._id });
        if (!congViec) return res.status(404).json({ success: false, message: "Không tìm thấy công việc" });

        Object.assign(congViec, req.body);
        await congViec.save();

        res.status(200).json({ success: true, message: "Cập nhật công việc thành công", data: congViec });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật công việc: " + error.message });
    }
};

const deleteCongViec = async (req, res) => {
    try {
        const { id } = req.params;
        await CongViec.deleteOne({ _id: id, user_id: req.user._id });
        res.status(200).json({ success: true, message: "Xóa công việc thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa công việc: " + error.message });
    }
};

module.exports = {
    getDuAn,
    createDuAn,
    updateDuAn,
    deleteDuAn,
    getCongViec,
    createCongViec,
    updateCongViec,
    deleteCongViec
};
