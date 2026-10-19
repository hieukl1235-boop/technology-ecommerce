const OrderModel = require("../../models/Order");
const crypto = require("crypto");
const querystring = require("qs");
const pool = require("../../config/db");
const NotificationModel = require("../../models/Notification");

// Hàm tự tạo định dạng thời gian cho VNPay (yyyyMMddHHmmss) chuẩn xác không cần thư viện ngoài
function getVnpayCreateDate(date = new Date()) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}${hour}${minute}${second}`;
}

const OrderController = {
  async placeOrder(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Chưa đăng nhập!" });
      }

      const {
        payment_method_id,
        coupon_id,
        recipient_name,
        phone,
        shipping_address,
        shipping_fee, // 🟢 Lấy shipping_fee từ request gửi lên
        items,
        total_amount,
      } = req.body;

      // --- 1. RÀNG BUỘC ĐẦU VÀO: KIỂM TRA GIỎ HÀNG & THÔNG TIN ---
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Đơn hàng không có sản phẩm nào!" });
      }

      if (!shipping_address || !recipient_name || !phone) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin người nhận hoặc địa chỉ giao hàng!",
        });
      }

      // --- 2. RÀNG BUỘC TỒN KHO (STOCK VALIDATION) ---
      for (let item of items) {
        const variantQuery = `SELECT stock_quantity, sku, cost_price FROM product_variants WHERE id = $1`;
        const variantResult = await pool.query(variantQuery, [item.variant_id]);

        if (variantResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm với mã biến thể ID ${item.variant_id} không tồn tại!`,
          });
        }

        const currentStock = variantResult.rows[0].stock_quantity;
        if (currentStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm (SKU: ${variantResult.rows[0].sku}) không đủ số lượng trong kho. Còn lại: ${currentStock}, bạn đặt: ${item.quantity}`,
          });
        }
      }

      // --- 3. TẠO ĐƠN HÀNG TRONG DATABASE ---
      const orderCode = await OrderModel.createOrder({
        user_id: userId,
        payment_method_id,
        coupon_id,
        recipient_name,
        phone,
        shipping_address,
        shipping_fee: shipping_fee || 0, // 🟢 Truyền vào đây
        total_amount,
        payment_status: 0,
        order_status: 1,
      });

      // Tạo chi tiết đơn hàng (tự động lấy kèm giá vốn cost_price để tính lợi nhuận sau này)
      await OrderModel.createOrderDetails(orderCode, items);

      // Trừ số lượng tồn kho trong bảng product_variants
      for (let item of items) {
        await pool.query(
          `UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
          [item.quantity, item.variant_id],
        );
      }

      // --- 4. XỬ LÝ THANH TOÁN VNPAY NẾU CÓ (ID = 2) ---
      const isVNPay = Number(payment_method_id) === 2;

      if (isVNPay) {
        process.env.TZ = "Asia/Ho_Chi_Minh";
        const date = new Date();
        const createDate = getVnpayCreateDate(date);
        const ipAddr =
          req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        const tmnCode = "FZVQEHXQ";
        const secretKey = "EQZENDRFNHIUDAXGMABALBHIOGDGCKRH";
        const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        const returnUrl = "http://localhost:3000/api/orders/vnpay_return";

        const amount = total_amount * 100; // VNPay yêu cầu nhân số tiền với 100

        let vnp_Params = {};
        vnp_Params["vnp_Version"] = "2.1.0";
        vnp_Params["vnp_Command"] = "pay";
        vnp_Params["vnp_TmnCode"] = tmnCode;
        vnp_Params["vnp_Locale"] = "vn";
        vnp_Params["vnp_CurrCode"] = "VND";
        vnp_Params["vnp_TxnRef"] = orderCode;
        vnp_Params["vnp_OrderInfo"] = "Thanh toan don hang: " + orderCode;
        vnp_Params["vnp_OrderType"] = "billpayment";
        vnp_Params["vnp_Amount"] = amount;
        vnp_Params["vnp_ReturnUrl"] = returnUrl;
        vnp_Params["vnp_IpAddr"] = ipAddr;
        vnp_Params["vnp_CreateDate"] = createDate;

        vnp_Params = sortObject(vnp_Params);
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac
          .update(Buffer.from(signData, "utf-8"))
          .digest("hex");
        vnp_Params["vnp_SecureHash"] = signed;

        const paymentUrl =
          vnpUrl + "?" + querystring.stringify(vnp_Params, { encode: false });

        return res.status(201).json({
          success: true,
          isVNPay: true,
          paymentUrl: paymentUrl,
          order_code: orderCode,
        });
      }

      // Trường hợp thanh toán thông thường (COD)
      return res.status(201).json({
        success: true,
        isVNPay: false,
        message: "Đặt hàng thành công!",
        order_code: orderCode,
      });
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi đặt hàng",
        error: error.message,
      });
    }
  },

  async vnpayReturn(req, res) {
    let vnp_Params = req.query;
    let secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    let secretKey = "EQZENDRFNHIUDAXGMABALBHIOGDGCKRH";

    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      let orderCode = vnp_Params["vnp_TxnRef"];
      let rspCode = vnp_Params["vnp_ResponseCode"];

      if (rspCode === "00") {
        await pool.query(
          "UPDATE orders SET payment_status = 1 WHERE order_code = $1",
          [orderCode],
        );
        return res.redirect(
          `http://localhost:5173/home?status=success&order_code=${orderCode}`,
        );
      } else {
        return res.redirect(
          `http://localhost:5173/home?status=failed&order_code=${orderCode}`,
        );
      }
    } else {
      return res.status(200).json({
        success: false,
        message: "Sai chữ ký bảo mật (Checksum failed)",
      });
    }
  },
  async updateStatus(req, res) {
    try {
      const { orderCode } = req.params;
      const { newStatus } = req.body;

      // Gọi Model để cập nhật trạng thái trong database
      const updatedOrder = await OrderModel.updateOrderStatus(
        orderCode,
        newStatus,
      );

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng cần cập nhật!",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái đơn hàng thành công!",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái",
        error: error.message,
      });
    }
  },
  async cancelMyOrder(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { orderCode } = req.params;

      if (!orderCode) {
        return res.status(400).json({
          success: false,
          message: "Thiếu mã đơn hàng cần hủy.",
        });
      }

      // Kiểm tra xem đơn hàng này có thực sự thuộc về người dùng hiện tại hay không (bảo mật IDOR)
      const isOwner = await OrderModel.checkOrderBelongsToUser(
        orderCode,
        userId,
      );
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền hủy đơn hàng này.",
        });
      }

      // Gọi hàm hoàn kho và cập nhật trạng thái đơn hàng đã viết sẵn ở Model
      await OrderModel.cancelAndRestockOrder(orderCode);
      try {
        await NotificationModel.createNotification(
          userId,
          "Hủy đơn hàng thành công",
          `Đơn hàng #${orderCode} của bạn đã được hủy và hoàn kho thành công.`,
          "order",
          orderCode, // reference_id (có thể là orderCode hoặc id tùy thiết kế bảng orders của bạn)
        );
      } catch (notifError) {
        // Log lỗi thông báo nhưng không làm gián đoạn response trả về cho client
        console.error("Lỗi tạo thông báo hủy đơn:", notifError);
      }

      return res.status(200).json({
        success: true,
        message: "Hủy đơn hàng và hoàn kho thành công!",
      });
    } catch (error) {
      console.error("Lỗi hủy đơn hàng:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi hủy đơn hàng.",
      });
    }
  },

  // Lấy chi tiết một đơn hàng theo mã orderCode
  async getOrderDetail(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { orderCode } = req.params;

      const order = await OrderModel.getOrderByCodeAndUserId(orderCode, userId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng hoặc bạn không có quyền xem.",
        });
      }

      return res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("Lỗi lấy chi tiết đơn hàng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tải chi tiết đơn hàng.",
      });
    }
  },
};

// Hàm sắp xếp tham số an toàn cho VNPay
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

module.exports = OrderController;
