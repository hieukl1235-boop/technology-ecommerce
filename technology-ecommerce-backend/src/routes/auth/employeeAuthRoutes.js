const express = require("express");

const router = express.Router();

const employeeAuthController = require("../../controllers/auth/employeeAuthController");

router.post("/login", employeeAuthController.login);

module.exports = router;
