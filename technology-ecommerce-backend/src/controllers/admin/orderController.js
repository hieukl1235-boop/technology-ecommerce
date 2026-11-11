const OrderModel = require("../../models/Order");
const NotificationModel = require("../../models/Notification");
const fs = require("fs");

const OrderController = {
  async getAllOrders(req, res) {
    try {
      const orders = await OrderModel.getAllOrders();
      return res.status(200).json({
        success: true,
        orders: orders,
      });
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách đơn hàng",
        error: error.message,
      });
    }
  },

  async updateStatus(req, res) {
    try {
      const { orderCode } = req.params;
      const { newStatus } = req.body;
      const updatedOrder = await OrderModel.updateOrderStatus(
        orderCode,
        newStatus,
      );

      if (!updatedOrder) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đơn hàng!" });
      }

      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái thành công!",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  async assignShipper(req, res) {
    try {
      const { orderCode } = req.params;
      const { newStatus, shipperId } = req.body;
      // Gọi hàm model vừa viết
      const updatedOrder = await OrderModel.assignShipperAndStatus(
        orderCode,
        newStatus,
        shipperId,
      );

      if (!updatedOrder) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đơn hàng!" });
      }
      const user = await OrderModel.getUserByOrderCode(orderCode);

      if (!user) {
        console.error("Không tìm thấy khách hàng của đơn:", orderCode);
        return;
      }
      try {
        await NotificationModel.createNotification(
          user.user_id,
          "Đơn hàng của bạn bắt đầu vận chuyển",
          `Đơn hàng #${orderCode} của bạn đã giao cho shipper.`,
          "order",
          orderCode, // reference_id (có thể là orderCode hoặc id tùy thiết kế bảng orders của bạn)
        );
      } catch (notifError) {
        // Log lỗi thông báo nhưng không làm gián đoạn response trả về cho client
        console.error("Lỗi tạo thông báo hủy đơn:", notifError);
      }

      return res.status(200).json({
        success: true,
        message: "Phân công shipper thành công!",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Lỗi phân công shipper:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  async completeOrder(req, res) {
    try {
      const { orderCode } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng tải lên hình ảnh minh chứng giao hàng!",
        });
      }

      const result = await OrderModel.completeOrderWithProof(
        orderCode,
        req.file.filename,
        req.employee.id,
      );

      if (!result) {
        // Xóa ảnh vừa upload vì không dùng nữa
        fs.unlink(req.file.path, () => {});
        return res.status(409).json({
          success: false,
          message:
            "Đơn hàng đã được chuyển cho shipper khác hoặc không còn ở trạng thái đang giao. Vui lòng tải lại danh sách!",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "🎉 Đã xác nhận giao hàng thành công và cập nhật ảnh minh chứng!",
        data: { order: result.order, proof: result.proof },
      });
    } catch (error) {
      console.error("Lỗi khi hoàn thành đơn hàng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xử lý hoàn thành đơn hàng",
      });
    }
  },

  async cancelOrder(req, res) {
    try {
      const { orderCode } = req.params;
      const user = await OrderModel.getUserByOrderCode(orderCode);

      if (!user) {
        console.error("Không tìm thấy khách hàng của đơn:", orderCode);
        return;
      }

      // Gọi hàm trong Model thực hiện Transaction: Hủy đơn, hoàn trả kho và tính lại giá gốc bình quân
      const result = await OrderModel.cancelAndRestockOrder(orderCode);
      try {
        await NotificationModel.createNotification(
          user.user_id,
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
        message:
          "🚫 Hủy đơn hàng, hoàn trả kho và tính lại giá vốn thành công!",
        data: {
          order: result.updatedOrder,
          needsRefund: result.needsRefund, // Cờ báo hiệu cho frontend/admin biết đơn này có cần hoàn tiền hay không
        },
      });
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng hoàn kho:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Lỗi server khi hủy đơn hàng",
      });
    }
  },

  async getShipperOrders(req, res) {
    try {
      // Giả sử middleware xác thực token đã gán thông tin nhân viên vào req.user (hoặc req.employee)
      const shipperId = req.employee.id;
      const orders = await OrderModel.getShipperOrders(shipperId);

      return res.status(200).json({
        success: true,
        orders: orders,
      });
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn của shipper:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách đơn hàng",
        error: error.message,
      });
    }
  },

  async failOrder(req, res) {
    try {
      const { orderCode } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do giao thất bại!",
        });
      }

      // Chỉ shipper đang được gán và đơn đang ở trạng thái 3 mới cập nhật được
      const updatedOrder = await OrderModel.failOrderWithReason(
        orderCode,
        reason.trim(),
        req.employee.id,
      );

      if (!updatedOrder) {
        return res.status(409).json({
          success: false,
          message:
            "Đơn hàng đã được chuyển cho shipper khác hoặc không còn ở trạng thái đang giao. Vui lòng tải lại danh sách!",
        });
      }

      // Gửi thông báo: lỗi ở đây không làm hỏng response
      try {
        const user = await OrderModel.getUserByOrderCode(orderCode);
        if (user) {
          await NotificationModel.createNotification(
            user.user_id,
            "Giao hàng không thành công",
            `Đơn hàng #${orderCode} giao không thành công. Vui lòng kiểm tra điện thoại để chúng tôi sớm giao lại cho quý khách.`,
            "order",
            orderCode,
          );
        } else {
          console.error("Không tìm thấy khách hàng của đơn:", orderCode);
        }
      } catch (notifError) {
        console.error("Lỗi tạo thông báo giao thất bại:", notifError);
      }

      return res.status(200).json({
        success: true,
        message: "⚠️ Đã ghi nhận trạng thái giao thất bại và lưu lý do!",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Lỗi khi xử lý giao thất bại:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xử lý giao thất bại",
      });
    }
  },

  async refundOrder(req, res) {
    try {
      const { orderCode } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng tải lên hình ảnh biên lai hoàn tiền!",
        });
      }

      const refundImageFilename = req.file.filename;

      const updatedOrder = await OrderModel.refundOrder(
        orderCode,
        refundImageFilename,
      );

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng!",
        });
      }
      const user = await OrderModel.getUserByOrderCode(orderCode);

      if (!user) {
        console.error("Không tìm thấy khách hàng của đơn:", orderCode);
        return;
      }
      try {
        await NotificationModel.createNotification(
          user.user_id,
          "Hoàn tiền đơn hàng",
          `Đơn hàng #${orderCode} của bạn đã được hoàn tiền thành công.`,
          "order",
          orderCode, // reference_id (có thể là orderCode hoặc id tùy thiết kế bảng orders của bạn)
        );
      } catch (notifError) {
        // Log lỗi thông báo nhưng không làm gián đoạn response trả về cho client
        console.error("Lỗi tạo thông báo hủy đơn:", notifError);
      }

      return res.status(200).json({
        success: true,
        message: "💸 Đã xác nhận hoàn tiền và lưu biên lai thành công!",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Lỗi khi xử lý hoàn tiền:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xử lý hoàn tiền",
      });
    }
  },

  async getUserByOrderCode(req, res) {
    try {
      const { order_code } = req.query;

      const user = await OrderModel.getUserByOrderCode(order_code);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
      }

      return res.json({
        success: true,
        user_id: user.user_id,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ",
      });
    }
  },
};

module.exports = OrderController;
