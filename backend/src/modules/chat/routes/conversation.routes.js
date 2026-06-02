const express = require("express");


const conversationController = require("../controllers/conversation.controller");

const { protect } = require("../../auth/auth.middleware");
const router = express.Router();


router.post("/", protect, conversationController.createConversation);

router.get("/", protect, conversationController.getUserConversations);

router.get("/archive", protect, conversationController.getArchivedConversations);

router.get("/search", protect, conversationController.searchNewUsers);

module.exports = router;