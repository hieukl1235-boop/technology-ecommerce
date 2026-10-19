const express = require("express");
const router = express.Router();
const statisticsController = require("../../controllers/admin/statisticsController");

router.get("/dashboard", statisticsController.getAllStatistics);

module.exports = router;
