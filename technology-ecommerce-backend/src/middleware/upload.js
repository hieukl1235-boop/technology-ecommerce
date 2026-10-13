const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (
      file.fieldname === "main_image" ||
      file.fieldname === "gallery_images"
    ) {
      cb(null, "src/uploads/products");
    } else if (file.fieldname === "variant_images") {
      cb(null, "src/uploads/variants");
    } else if (file.fieldname === "image") {
      cb(null, "src/uploads/banners"); // Thư mục lưu hình ảnh banner
    } else if (file.fieldname === "proof_image") {
      cb(null, "src/uploads/proofs");
    } else if (file.fieldname === "refund_image") {
      cb(null, "src/uploads/refunds");
    } else if (file.fieldname === "images_review") {
      cb(null, "src/uploads/images_review");
    } else {
      cb(null, "src/uploads/others"); // Thư mục dự phòng nếu có trường hợp khác
    }
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + "-" + file.originalname;
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
});

module.exports = upload;
