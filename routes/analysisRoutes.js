const express = require("express");
const router = express.Router();
const { getSOAP } = require("../controllers/chatbotController");
const { protect } = require("../middlewares/authMiddleware");

router.route("/soap-analysis").post(getSOAP);

module.exports = router;
