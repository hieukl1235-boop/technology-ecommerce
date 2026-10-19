const NotificationModel = require("../../models/Notification");

// 1. API lấy danh sách thông báo cho người dùng
const getMyNotifications = async (req, res) => {
  try {
    const  userId  = req.user.id;
    const notifications =
      await NotificationModel.getNotificationsByUser(userId);
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("Lỗi lấy thông báo:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// 2. API cho Admin tự tạo thông báo thủ công (gửi cho 1 user cụ thể hoặc gửi toàn hệ thống với user_id = 0)
const createManualNotification = async (req, res) => {
  try {
    const { user_id, title, content, type, reference_id } = req.body;

    const newNotif = await NotificationModel.createNotification(
      user_id || 0,
      title,
      content,
      type || "system",
      reference_id || null,
    );

    res.json({
      success: true,
      message: "Tạo thông báo thành công",
      data: newNotif,
    });
  } catch (err) {
    console.log("Lỗi tạo thông báo:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// 3. API đánh dấu đã đọc một thông báo
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const updated = await NotificationModel.markAsRead(notificationId);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Lỗi đánh dấu đã đọc:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = {
  getMyNotifications,
  createManualNotification,
  markAsRead,
};
