const express = require("express");
const router = express.Router();
const NotificationController = require("../../controllers/admin/notificationController")
const authMiddle = require("../../middleware/authMiddleware")

router.post("/manual", NotificationController.createManualNotification);
router.get("/", authMiddle.authenticateUser, NotificationController.getMyNotifications);
router.patch("/read", authMiddle.authenticateUser, NotificationController.markAsRead);
module.exports = router;