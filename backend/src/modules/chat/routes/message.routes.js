const express = require('express');
const { protect } =require ("../../auth/auth.middleware.js");

const messageController = require("../controllers/message.controller");

const {sendMessage, getMessages} = messageController;

const router = express.Router();


router.post("/", protect, sendMessage);

router.get("/:conversationId", protect, getMessages);

module.exports = router;