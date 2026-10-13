const Supplier = require("../../models/Supplier");
const VariantSupplier = require("../../models/VariantSupplier");

// [GET] /api/suppliers
// Lấy danh sách tất cả nhà cung cấp
const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.getAll();

    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách nhà cung cấp",
      error: error.message,
    });
  }
};

// [GET] /api/suppliers/:id
// Lấy thông tin một nhà cung cấp
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.getById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        message: "Không tìm thấy nhà cung cấp",
      });
    }

    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết nhà cung cấp",
      error: error.message,
    });
  }
};

// [POST] /api/suppliers
// Thêm nhà cung cấp và gán các variant đã có
const createSupplier = async (req, res) => {
  try {
    const { name, phone, address, email, variant_ids } = req.body;

    // Kiểm tra tên nhà cung cấp
    if (!name) {
      return res.status(400).json({
        message: "Tên nhà cung cấp là bắt buộc",
      });
    }

    // 1. Tạo nhà cung cấp
    const newSupplier = await Supplier.create(name, phone, address, email);

    // 2. Gán nhà cung cấp cho các variant đã chọn
    if (Array.isArray(variant_ids)) {
      for (const variant_id of variant_ids) {
        await VariantSupplier.addSupplier(variant_id, newSupplier.id);
      }
    }

    res.status(201).json({
      message: "Thêm nhà cung cấp thành công",
      supplier: newSupplier,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi tạo nhà cung cấp",
      error: error.message,
    });
  }
};

// [PUT] /api/suppliers/:id
// Cập nhật thông tin nhà cung cấp
const updateSupplier = async (req, res) => {
  try {
    const supplierId = req.params.id; // 🟢 Lấy ID nhà cung cấp từ URL params
    const { name, phone, address, email, variant_ids } = req.body;

    // 1. Cập nhật thông tin nhà cung cấp
    const updatedSupplier = await Supplier.update(
      supplierId,
      name,
      phone,
      address,
      email,
    );

    if (!updatedSupplier) {
      return res.status(404).json({
        message: "Không tìm thấy nhà cung cấp",
      });
    }

    // 2. Nếu frontend gửi variant_ids thì cập nhật lại danh sách variant
    if (Array.isArray(variant_ids)) {
      // Xóa liên kết cũ theo supplierId
      await VariantSupplier.removeAllBySupplier(supplierId);

      // Thêm liên kết mới (Đảm bảo truyền đúng thứ tự: variant_id trước, supplierId sau)
      for (const variant_id of variant_ids) {
        if (variant_id) {
          // 🟢 Kiểm tra tránh truyền giá trị null/undefined
          await VariantSupplier.addSupplier(variant_id, supplierId);
        }
      }
    }

    res.status(200).json({
      message: "Cập nhật nhà cung cấp thành công",
      supplier: updatedSupplier,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật nhà cung cấp",
      error: error.message,
    });
  }
};

// [PATCH] /api/suppliers/:id/status
// Cập nhật trạng thái nhà cung cấp
const updateSupplierStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updatedSupplier = await Supplier.updateStatus(req.params.id, status);

    if (!updatedSupplier) {
      return res.status(404).json({
        message: "Không tìm thấy nhà cung cấp",
      });
    }

    res.status(200).json({
      message: "Cập nhật trạng thái thành công",
      supplier: updatedSupplier,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật trạng thái",
      error: error.message,
    });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
};
