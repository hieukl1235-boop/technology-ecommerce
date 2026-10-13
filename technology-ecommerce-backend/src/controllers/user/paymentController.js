const PaymentModel = require("../../models/payment");

const PaymentController = {
  async getPaymentMethods(req, res) {
    try {
      const methods = await PaymentModel.getAllMethods();
      res.json({ success: true, methods });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Lỗi tải phương thức thanh toán",
          error: error.message,
        });
    }
  },
};

module.exports = PaymentController;
