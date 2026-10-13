const BannerModel = require("../../models/Banner");

exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await BannerModel.getActiveBanners();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await BannerModel.getAllBannersForAdmin();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!image_url) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng tải lên hình ảnh banner!" });
    }

    const newBanner = await BannerModel.createBanner({
      title,
      description,
      image_url,
      status,
    });
    res
      .status(201)
      .json({
        success: true,
        message: "Thêm banner thành công!",
        data: newBanner,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await BannerModel.getActiveBanners();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await BannerModel.getAllBannersForAdmin();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!image_url) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng tải lên hình ảnh banner!" });
    }

    const newBanner = await BannerModel.createBanner({
      title,
      description,
      image_url,
      status,
    });
    res.status(201).json({
      success: true,
      message: "Thêm banner thành công!",
      data: newBanner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin banner (Sửa)
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const image_url = req.file ? req.file.filename : null;

    const updated = await BannerModel.updateBanner(id, {
      title,
      description,
      image_url,
      status,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy banner!" });
    }

    res.json({
      success: true,
      message: "Cập nhật banner thành công!",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thay đổi nhanh trạng thái (Bật/Tắt hiển thị)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await BannerModel.updateStatus(id, status);
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy banner!" });
    }

    res.json({
      success: true,
      message: "Thay đổi trạng thái thành công!",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BannerModel.deleteBanner(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy banner!" });
    }
    res.json({ success: true, message: "Xóa banner thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BannerModel.deleteBanner(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy banner!" });
    }
    res.json({ success: true, message: "Xóa banner thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
