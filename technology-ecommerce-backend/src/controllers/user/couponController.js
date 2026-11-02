const CouponModel = require("../../models/Coupon");
const pool = require("../../config/db");
const CouponController = {
  async applyCoupon(req, res) {
    try {
      const { code, items } = req.body;

      // 1. Kiểm tra giỏ hàng
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Giỏ hàng trống!",
        });
      }

      // 2. Kiểm tra mã giảm giá
      const coupon = await CouponModel.getValidCoupon(code);

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message:
            "Mã giảm giá không tồn tại, hết hạn hoặc đã hết lượt sử dụng!",
        });
      }

      // 3. Lấy danh sách danh mục được áp dụng
      const allowedCategoryIds = await CouponModel.getCouponCategories(
        coupon.id,
      );

      // Nếu không có danh mục thì áp dụng cho tất cả sản phẩm
      const isAllCategories = allowedCategoryIds.length === 0;

      // 4. Tính tổng tiền sản phẩm đủ điều kiện
      let eligibleSubTotal = 0;

      for (const item of items) {
        // Kiểm tra thông tin sản phẩm
        if (
          !item.variant_id ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Thông tin sản phẩm trong giỏ hàng không hợp lệ!",
          });
        }

        // Lấy danh mục và giá bán thực tế từ Database
        const productQuery = `
        SELECT
          p.category_id,
          v.selling_price,
          v.sale_price
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = $1
      `;

        const prodResult = await pool.query(productQuery, [item.variant_id]);

        const product = prodResult.rows[0];

        if (!product) {
          return res.status(400).json({
            success: false,
            message: "Sản phẩm trong giỏ hàng không tồn tại!",
          });
        }

        const categoryId = Number(product.category_id);

        // Kiểm tra sản phẩm có thuộc danh mục được áp dụng không
        const isEligible =
          isAllCategories ||
          allowedCategoryIds.some((id) => Number(id) === categoryId);

        if (!isEligible) continue;

        // Lấy giá bán từ Database, không sử dụng giá Frontend gửi lên
        const price =
          product.sale_price != null
            ? Number(product.sale_price)
            : Number(product.selling_price);

        eligibleSubTotal += price * Number(item.quantity);
      }

      // 5. Kiểm tra có sản phẩm phù hợp không
      if (eligibleSubTotal <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Mã giảm giá này không áp dụng cho sản phẩm nào trong giỏ hàng của bạn!",
        });
      }

      // 6. Kiểm tra giá trị đơn hàng tối thiểu
      if (eligibleSubTotal < Number(coupon.min_order_value || 0)) {
        const remainingAmount =
          Number(coupon.min_order_value) - eligibleSubTotal;

        return res.status(400).json({
          success: false,
          eligibleSubTotal,
          remainingAmount,
          message: `Bạn cần mua thêm ${remainingAmount.toLocaleString("vi-VN")}đ sản phẩm phù hợp để sử dụng mã này!`,
        });
      }

      // 7. Tính số tiền giảm giá
      let discountAmount = 0;

      if (Number(coupon.discount_type) === 1) {
        // Giảm theo phần trăm
        discountAmount =
          (eligibleSubTotal * Number(coupon.discount_value)) / 100;

        // Kiểm tra mức giảm tối đa
        if (
          coupon.max_discount != null &&
          discountAmount > Number(coupon.max_discount)
        ) {
          discountAmount = Number(coupon.max_discount);
        }
      } else if (Number(coupon.discount_type) === 2) {
        // Giảm số tiền cố định
        discountAmount = Number(coupon.discount_value);
      }

      // Không cho phép giảm vượt quá tổng tiền đủ điều kiện
      discountAmount = Math.min(discountAmount, eligibleSubTotal);

      // 8. Trả kết quả
      return res.json({
        success: true,
        coupon_id: coupon.id,
        code: coupon.code,
        eligibleSubTotal,
        discountAmount,
        message: "Áp dụng mã giảm giá thành công!",
      });
    } catch (error) {
      console.error("Lỗi áp dụng mã giảm giá:", error);

      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi áp dụng mã giảm giá!",
        error: error.message,
      });
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
