const VariantSupplier = require("../../models/VariantSupplier");

// [GET] /api/variants/:variant_id/suppliers
// Lấy danh sách nhà cung cấp của một variant
const getSuppliersForVariant = async (req, res) => {
  try {
    const { variant_id } = req.params;

    const suppliers = await VariantSupplier.getSuppliers(variant_id);

    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách nhà cung cấp của variant",
      error: error.message,
    });
  }
};

// [POST] /api/variants/:variant_id/suppliers
// Gán một nhà cung cấp cho một variant
const assignSupplierToVariant = async (req, res) => {
  try {
    const { variant_id } = req.params;
    const { supplier_id } = req.body;

    if (!supplier_id) {
      return res.status(400).json({
        message: "Vui lòng chọn nhà cung cấp",
      });
    }

    const assigned = await VariantSupplier.addSupplier(variant_id, supplier_id);

    // Đã tồn tại liên kết
    if (!assigned) {
      return res.status(409).json({
        message: "Nhà cung cấp này đã được gán cho variant",
      });
    }

    res.status(201).json({
      message: "Gán nhà cung cấp thành công",
      data: assigned,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi gán nhà cung cấp",
      error: error.message,
    });
  }
};

// [DELETE] /api/variants/:variant_id/suppliers/:supplier_id
// Gỡ nhà cung cấp khỏi variant
const removeSupplierFromVariant = async (req, res) => {
  try {
    const { variant_id, supplier_id } = req.params;

    const isRemoved = await VariantSupplier.removeSupplier(
      variant_id,
      supplier_id,
    );

    if (!isRemoved) {
      return res.status(404).json({
        message: "Không tìm thấy liên kết nhà cung cấp với variant",
      });
    }

    res.status(200).json({
      message: "Đã gỡ nhà cung cấp khỏi variant",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi gỡ nhà cung cấp khỏi variant",
      error: error.message,
    });
  }
};

module.exports = {
  getSuppliersForVariant,
  assignSupplierToVariant,
  removeSupplierFromVariant,
};
