const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

module.exports = (io) => {
  // 1. Xác thực tài khoản khi kết nối Socket.IO
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Chưa đăng nhập"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.id || !["user", "employee"].includes(decoded.account_type)) {
        return next(new Error("Thông tin tài khoản không hợp lệ"));
      }

      socket.account = decoded;

      next();
    } catch (error) {
      next(new Error("Token không hợp lệ"));
    }
  });

  // 2. Xử lý khi tài khoản kết nối
  io.on("connection", (socket) => {
    console.log("Socket đã kết nối:", socket.id);

    const account = socket.account;

    // 3. Tham gia phòng trò chuyện
    socket.on("join_conversation", async (data, callback) => {
      try {
        const conversationId = Number(data?.conversationId);

        if (!Number.isInteger(conversationId) || conversationId <= 0) {
          throw new Error("Mã cuộc trò chuyện không hợp lệ");
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation || conversation.status === 0) {
          throw new Error("Cuộc trò chuyện không tồn tại hoặc đã đóng");
        }

        // Khách hàng chỉ được vào cuộc trò chuyện của mình
        if (
          account.account_type === "user" &&
          conversation.user_id !== account.id
        ) {
          throw new Error("Bạn không có quyền vào cuộc trò chuyện này");
        }

        // Nhân viên chỉ được vào cuộc trò chuyện được phân công
        if (
          account.account_type === "employee" &&
          (conversation.employee_id !== account.id || conversation.status !== 2)
        ) {
          throw new Error("Bạn chưa được phân công cuộc trò chuyện này");
        }

        socket.join(`conversation_${conversationId}`);

        if (typeof callback === "function") {
          callback({
            success: true,
            message: "Đã tham gia cuộc trò chuyện",
          });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    });

    // 4. Gửi tin nhắn
    socket.on("send_message", async (data, callback) => {
      try {
        const conversationId = Number(data?.conversationId);
        const content =
          typeof data?.content === "string" ? data.content.trim() : "";

        if (!Number.isInteger(conversationId) || conversationId <= 0) {
          throw new Error("Mã cuộc trò chuyện không hợp lệ");
        }

        if (!content) {
          throw new Error("Tin nhắn không được để trống");
        }

        if (content.length > 2000) {
          throw new Error("Tin nhắn không được vượt quá 2000 ký tự");
        }

        const room = `conversation_${conversationId}`;

        // Phải tham gia phòng trước khi gửi
        if (!socket.rooms.has(room)) {
          throw new Error("Bạn chưa tham gia cuộc trò chuyện");
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation || conversation.status === 0) {
          throw new Error("Cuộc trò chuyện đã đóng hoặc không tồn tại");
        }

        // Kiểm tra quyền gửi tin nhắn
        if (account.account_type === "user") {
          if (conversation.user_id !== account.id) {
            throw new Error("Bạn không có quyền gửi tin nhắn ở đây");
          }
        } else if (
          conversation.employee_id !== account.id ||
          conversation.status !== 2
        ) {
          throw new Error("Bạn không phụ trách cuộc trò chuyện này");
        }

        // Lưu tin nhắn vào PostgreSQL
        const message = await Message.create(
          conversationId,
          account.id,
          account.account_type,
          content,
        );

        // Gửi tin nhắn đến tất cả thành viên trong phòng
        io.to(room).emit("new_message", {
          ...message,
          sender_type: account.account_type,
        });

        if (typeof callback === "function") {
          callback({
            success: true,
            message: "Gửi tin nhắn thành công",
          });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    });

    // 5. Ngắt kết nối
    socket.on("disconnect", () => {
      console.log("Socket đã ngắt kết nối:", socket.id);
    });
  });
};
