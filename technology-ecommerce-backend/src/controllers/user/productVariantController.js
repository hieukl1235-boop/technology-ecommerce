const productVariantModel = require("../../models/ProductVariant");

exports.getVariantsByProductId = async (req, res) => {
    try{
         const { productId } = req.params;
  const variants = await productVariantModel.getVariantsByProductId(productId);
  if (!variants) {
    return res.status(404).json({ message: "Không tìm thấy biến thể nào cho sản phẩm này" });
  }
    res.status(200).json(variants);

    }
    catch (error) {
        console.error("Lỗi lấy biến thể sản phẩm:", error);
        res.status(500).json({ message: "Lỗi server khi lấy biến thể sản phẩm", error: error.message });
    }
 
}

exports.getVariantById = async(req, res) =>
{
  try{
    const id = req.params.id
    const variant = await productVariantModel.getVariantById(id)
    res.status(200).json(variant)
  }
  catch(error)
  {
    console.log(error)
  }
}