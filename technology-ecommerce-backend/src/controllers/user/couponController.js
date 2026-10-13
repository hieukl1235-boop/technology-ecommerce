const CouponModel = require("../../models/Coupon");
const pool = require("../../config/db"); 
const CouponController = {
  async applyCoupon(req, res) {
    try {
      const { code, items } = req.body;

      if (!items || items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Giỏ hàng trống!" });
      }

      // 1. Kiểm tra mã giảm giá
      const coupon = await CouponModel.getValidCoupon(code);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Mã giảm giá không tồn tại hoặc đã hết hạn!",
        });
      }

      // 2. Lấy danh sách category_id mà mã này được phép áp dụng
      const allowedCategoryIds = await CouponModel.getCouponCategories(
        coupon.id,
      );

      // 3. TỰ ĐỘNG TRA CỨU category_id CHO TỪNG VARIANT TRONG GIỎ HÀNG
      let eligibleSubTotal = 0;
      for (let item of items) {
        // Query lấy category_id từ database dựa vào variant_id
        const productQuery = `
          SELECT p.category_id 
          FROM product_variants v
          JOIN products p ON v.product_id = p.id
          WHERE v.id = $1
        `;
        const prodResult = await pool.query(productQuery, [item.variant_id]);
        const categoryId = prodResult.rows[0]?.category_id;

        // Nếu sản phẩm thuộc danh mục được phép giảm thì mới cộng tiền vào
        if (categoryId && allowedCategoryIds.includes(categoryId)) {
          const price = item.sale_price
            ? Number(item.sale_price)
            : Number(item.selling_price);
          eligibleSubTotal += price * item.quantity;
        }
      }

      if (eligibleSubTotal === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Mã giảm giá này không áp dụng cho sản phẩm nào trong giỏ hàng của bạn!",
        });
      }

      // 4. Tính số tiền giảm (giống như logic cũ...)
      let discountAmount = 0;
      if (coupon.discount_type === 1) {
        discountAmount =
          (eligibleSubTotal * Number(coupon.discount_value)) / 100;
        if (
          coupon.max_discount &&
          discountAmount > Number(coupon.max_discount)
        ) {
          discountAmount = Number(coupon.max_discount);
        }
      } else if (coupon.discount_type === 2) {
        discountAmount = Number(coupon.discount_value);
      }

      if (discountAmount > eligibleSubTotal) discountAmount = eligibleSubTotal;

      res.json({
        success: true,
        coupon_id: coupon.id,
        discountAmount,
        message: "Áp dụng mã giảm giá thành công!",
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  async getAvailableCoupons(req, res) {
    try {
      const coupons = await CouponModel.getAvailableCoupons();
      res.json({ success: true, coupons });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = CouponController;
