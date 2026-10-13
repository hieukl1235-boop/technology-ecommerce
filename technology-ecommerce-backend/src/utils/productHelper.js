// src/utils/productHelper.js

// Hàm giải mã JSON variants và gắn file ảnh tương ứng cho từng biến thể
const parseVariants = (variantsJson, variantImagesFiles) => {
  try {
    const variants = JSON.parse(variantsJson || "[]");
    let fileIndex = 0; // 🟢 KHAI BÁO BIẾN ĐẾM ĐỘC LẬP CHO FILE

    return variants.map((variant) => {
      // Mặc định lấy lại tên ảnh cũ do Frontend gửi lên
      let finalImageUrl = variant.image_url || null;

      // 🟢 Nếu Frontend báo là CÓ ẢNH MỚI -> Nhặt 1 file từ mảng Multer ra
      if (
        variant.has_new_image &&
        variantImagesFiles &&
        variantImagesFiles[fileIndex]
      ) {
        finalImageUrl = variantImagesFiles[fileIndex].filename; // Lấy tên file thực tế vừa upload
        fileIndex++; // Tăng biến đếm để dành file tiếp theo cho biến thể sau
      }

      return {
        id: variant.id || null,
        sku: variant.sku,
        selling_price: Number(variant.selling_price),
        sale_price: variant.sale_price ? Number(variant.sale_price) : null,
        status: variant.status !== undefined ? variant.status : 1,
        attributes: variant.attributes || [],
        image_url: finalImageUrl, // 🟢 Đã khớp chính xác 100%, không bao giờ đè ảnh!
      };
    });
  } catch (err) {
    throw new Error("Dữ liệu biến thể không hợp lệ (JSON parse error)");
  }
};

// Hàm kiểm tra các thông tin chung bắt buộc của sản phẩm
const validateProductInput = (body) => {
  const { category_id, brand_id, name } = body;
  if (!category_id || !brand_id || !name) {
    return "Vui lòng nhập đầy đủ thông tin sản phẩm";
  }
  return null;
};

module.exports = { parseVariants, validateProductInput };
