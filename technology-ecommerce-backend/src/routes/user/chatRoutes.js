const express = require("express");
const router = express.Router();

const chatController = require("../../controllers/user/chatController");

// Dùng middleware đăng nhập hiện có
const {
  authenticate,
  authenticateUser,
} = require("../../middleware/authMiddleware");

// Khách hàng
router.post(
  "/conversations",
  authenticateUser,
  chatController.openConversation,
);

router.get(
  "/my-conversations",
  authenticateUser,
  chatController.getMyConversations,
);

router.get(
  "/conversations/:id/messages",
  authenticateUser,
  chatController.getMessages,
);

// Nhân viên
router.get(
  "/employee/conversations",
  authenticate,
  chatController.getEmployeeConversations,
);

router.post(
  "/conversations/:id/assign",
  authenticate,
  chatController.assignConversation,
);

router.post(
  "/conversations/:id/close",
  authenticate,
  chatController.closeConversation,
);

router.get(
  "/employee/conversations/:id/messages",
  authenticate,
  chatController.getEmployeeMessages,
);

module.exports = router;
