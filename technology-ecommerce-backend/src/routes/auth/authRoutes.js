const express = require("express");

const router = express.Router();

const authController = require("../../controllers/auth/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);

module.exports = router;
