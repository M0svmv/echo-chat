const express = require('express');
const { protect } =require ("../../auth/auth.middleware.js");

const messageController = require("../controllers/message.controller");

const chatUpload = require("../../../middlewares/chatUpload.middleware");

const {sendMessage, getMessages} = messageController;

const router = express.Router();


router.post("/", protect,chatUpload.single("file") , sendMessage);

router.get("/:conversationId", protect, getMessages);

router.put("/edit/:messageId", protect, messageController.editMessage);
router.post("/react/:messageId", protect, messageController.toggleReaction);
router.delete("/delete/:messageId", protect, messageController.deleteMessage);

module.exports = router;