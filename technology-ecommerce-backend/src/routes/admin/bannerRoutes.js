const express = require("express");
const router = express.Router();
const bannerController = require("../../controllers/admin/bannerController");
const upload = require("../../middleware/upload"); // Middleware multer của bạn

// Route cho Client lấy banner hiển thị trang chủ (có thể để route này ở file riêng hoặc chung)
router.get("/", bannerController.getActiveBanners);

// --- CÁC ROUTE DÀNH CHO ADMIN ---
// Lấy tất cả banner cho trang quản lý
router.get("/all", bannerController.getAllBanners);

// Thêm banner mới
router.post("/", upload.single("image"), bannerController.createBanner);

// Sửa banner (Cập nhật thông tin và hình ảnh nếu có)
router.put("/:id", upload.single("image"), bannerController.updateBanner);

// Thay đổi nhanh trạng thái hiển thị (Bật/Tắt)
router.patch("/:id/status", bannerController.updateStatus);

// Xóa banner
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;

// Ở file server.js chính của bạn sẽ đăng ký như thế này:
// app.use("/api/banners", bannerRoutes); (hoặc phân ra client riêng và admin riêng tùy cấu trúc dự án)
