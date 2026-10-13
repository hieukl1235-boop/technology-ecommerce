const Var = require("../../models/ProductVariant");

exports.getVariants = async (req, res) => {
  try {
    const variants = await Var.getAll();
    if (!variants) {
      return res.status(404).json({ message: "Không tìm thấy biến thể nào" });
    }
    res.status(200).json(variants);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách biến thể", error: error.message });
  }
}