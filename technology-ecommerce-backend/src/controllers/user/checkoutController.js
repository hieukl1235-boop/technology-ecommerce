const CheckoutModel = require("../../models/Checkout");

const CheckoutController = {
  async getCheckoutItems(req, res) {
    try {
      const { items } = req.body; // items = [{ variant_id, quantity }, ...]

      if (!items || items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Danh sách sản phẩm trống!" });
      }

      // 1. Trích xuất mảng các variant_id
      const variantIds = items.map((i) => i.variant_id);

      // 2. Gọi Model để lấy dữ liệu từ Database
      const dbRows = await CheckoutModel.getItemsByVariantIds(variantIds);

      // 3. Ghép lại số lượng (quantity) tương ứng vào dữ liệu thực tế từ DB
      const finalItems = dbRows.map((row) => {
        const matchedItem = items.find((i) => i.variant_id === row.variant_id);
        return {
          ...row,
          quantity: matchedItem ? matchedItem.quantity : 1,
        };
      });

      return res.json({ success: true, items: finalItems });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Lỗi server", error: error.message });
    }
  },
};

module.exports = CheckoutController;
