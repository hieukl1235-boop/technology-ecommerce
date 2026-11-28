const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendResetOtp = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Mã xác minh ",
    text: `Mã OTP của bạn là ${otp}. Mã có hiệu lực trong 5 phút.`,
  });
};

exports.remindUser = async (email) => {
  const link = "http://localhost:5173/account";

  await transporter.sendMail({
    from: `"TeachStore" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Vui lòng cập nhật thông tin tài khoản ngân hàng",
    html: `
      <h3>Thông báo cập nhật thông tin</h3>

      <p>Quý khách vui lòng hoàn thành thông tin tài khoản ngân hàng
      để chúng tôi có thể thực hiện hoàn tiền.</p>

      <p>
        <a href="${link}" 
           style="background-color: #0d6efd; color: white; 
           padding: 10px 20px; text-decoration: none; 
           border-radius: 5px;">
          Cập nhật ngay
        </a>
      </p>

      <p>Trân trọng!</p>
    `,
  });
};

exports.sendOrderStatusEmail = async (email, orderCode, status) => {
  const link = `http://localhost:5173/order/${orderCode}`;

  // Định nghĩa tiêu đề và màu sắc/nội dung tương ứng với từng trạng thái đơn hàng
  let statusText = "";
  let badgeColor = "#0d6efd"; // Mặc định xanh dương

  switch (status) {
    case 1:
      statusText = "Đang chờ xử lý";
      badgeColor = "#ffc107"; // Vàng
      break;
    case 2:
      statusText = "Đang chuẩn bị hàng / Đóng gói";
      badgeColor = "#17a2b8"; // Xanh ngọc
      break;
    case 3:
      statusText = "Đang giao hàng";
      badgeColor = "#0d6efd"; // Xanh dương
      break;
    case 4:
      statusText = "Đã giao hàng thành công";
      badgeColor = "#28a745"; // Xanh lá
      break;
    case 5:
      statusText = "Đã hủy đơn hàng";
      badgeColor = "#dc3545"; // Đỏ
      break;
    default:
      statusText = status;
  }

  await transporter.sendMail({
    from: `"TeachStore" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Cập nhật trạng thái đơn hàng #${orderCode}: ${statusText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h3 style="color: #333;">Thông báo trạng thái đơn hàng</h3>
        
        <p>Xin chào quý khách,</p>
        
        <p>Đơn hàng <strong>#${orderCode}</strong> của bạn đã được cập nhật trạng thái mới:</p>
        
        <p style="margin: 20px 0;">
          <span style="background-color: ${badgeColor}; color: white; padding: 8px 15px; font-weight: bold; border-radius: 4px; display: inline-block;">
            ${statusText}
          </span>
        </p>

        <p>Bạn có thể bấm vào nút bên dưới để xem chi tiết tiến trình đơn hàng:</p>

        <p style="margin: 20px 0;">
          <a href="${link}" 
             style="background-color: #0d6efd; color: white; 
             padding: 10px 20px; text-decoration: none; 
             border-radius: 5px; display: inline-block;">
            Xem chi tiết đơn hàng
          </a>
        </p>

        <p>Cảm ơn bạn đã mua sắm cùng chúng tôi!</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `,
  });
};


exports.sendRefundSuccessEmail = async (
  email,
  orderCode,
  refundAmount,
  bankInfo,
) => {
  const link = `http://localhost:5173/order/${orderCode}`;

  await transporter.sendMail({
    from: `"TeachStore" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Hoàn tiền thành công cho đơn hàng #${orderCode}`,
    html: `
      <h3>Thông báo hoàn tiền thành công</h3>
      
      <p>Chúng tôi đã hoàn tiền cho đơn hàng <strong>#${orderCode}</strong> của bạn.</p>
      
      <p><strong>Số tiền:</strong> ${refundAmount} VNĐ</p>
      <p><strong>Ngân hàng:</strong> ${bankInfo?.bank_name} - ${bankInfo?.bank_account_number}</p>
      <p><strong>Chủ tài khoản:</strong> ${bankInfo?.bank_account_name}</p>

      <p>
        <a href="${link}" 
           style="background-color: #198754; color: white; 
           padding: 10px 20px; text-decoration: none; 
           border-radius: 5px; display: inline-block;">
          Xem đơn hàng
        </a>
      </p>

      <p>Trân trọng!</p>
    `,
  });
};