const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");

// Khách hàng mở cuộc trò chuyện
exports.openConversation = async (req, res) => {
  try {
    const userId = req.user.id;

    let conversation = await Conversation.findActiveByUser(userId);

    if (!conversation) {
      conversation = await Conversation.create(userId);
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Không thể mở cuộc trò chuyện",
    });
  }
};

// Khách hàng xem các cuộc trò chuyện của mình
exports.getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.getByUser(req.user.id);

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Không thể lấy danh sách cuộc trò chuyện",
    });
  }
};

// Nhân viên xem danh sách cuộc trò chuyện
exports.getEmployeeConversations = async (req, res) => {
  try {
    const conversations = await Conversation.getForEmployee(req.employee.id);

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Không thể lấy danh sách cuộc trò chuyện",
    });
  }
};

// Lấy lịch sử tin nhắn
// Khách hàng xem lịch sử tin nhắn
exports.getMessages = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = req.user.id;

    const conversation =
      await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }

    if (String(conversation.user_id) !== String(userId)) {
      return res.status(403).json({
        message: "Bạn không có quyền xem cuộc trò chuyện này",
      });
    }

    const messages =
      await Message.getByConversation(conversationId);

    return res.status(200).json(messages);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Không thể lấy lịch sử tin nhắn",
    });
  }
};
// Nhân viên nhận xử lý cuộc trò chuyện
exports.assignConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const employeeId = req.employee.id;

    const conversation = await Conversation.assignEmployee(
      conversationId,
      employeeId,
    );

    if (!conversation) {
      return res.status(400).json({
        message: "Cuộc trò chuyện không còn khả dụng",
      });
    }

    res.json({
      message: "Nhận cuộc trò chuyện thành công",
      conversation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Không thể nhận cuộc trò chuyện",
    });
  }
};

// Nhân viên đóng cuộc trò chuyện
exports.closeConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }

    if (conversation.employee_id !== req.employee.id) {
      return res.status(403).json({
        message: "Bạn không phụ trách cuộc trò chuyện này",
      });
    }

    const result = await Conversation.close(req.params.id);

    res.json({
      message: "Đã đóng cuộc trò chuyện",
      conversation: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Không thể đóng cuộc trò chuyện",
    });
  }
};
exports.getEmployeeMessages = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const employeeId = req.employee.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }

    if (
      String(conversation.employee_id) !== String(employeeId) ||
      Number(conversation.status) !== 2
    ) {
      return res.status(403).json({
        message: "Bạn chưa được phân công cuộc trò chuyện này",
      });
    }

    const messages = await Message.getByConversation(conversationId);

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Lỗi lấy tin nhắn:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};