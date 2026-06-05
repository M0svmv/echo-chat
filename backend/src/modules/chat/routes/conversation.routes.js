const express = require("express");


const conversationController = require("../controllers/conversation.controller");

const { protect } = require("../../auth/auth.middleware");
const upload = require("../../../middlewares/upload.middleware")
const router = express.Router();


router.post("/", protect, conversationController.createConversation);

router.get("/", protect, conversationController.getUserConversations);

router.get("/archive", protect, conversationController.getArchivedConversations);



router.get("/search", protect, conversationController.searchNewUsers);

// group chat

router.post("/group", protect, conversationController.makeGroupChat);

router.get("/group/myGroups", protect, conversationController.getMyGroupChats);

router.put("/group/leave/:conversationId", protect, conversationController.leaveGroupChat);

router.put("/group/add/:conversationId", protect, conversationController.addMembersToGroupChat);

router.put("/group/remove/:conversationId", protect, conversationController.removeMemberFromGroupChat);

router.put("/group/admin-add/:conversationId", protect, conversationController.addGroupAdmin);

router.put("/group/admin-remove/:conversationId", protect, conversationController.demoteAdmin);

router.put("/group/update/:conversationId", protect,upload.single("image"), conversationController.updateGroupDetails);

router.get("/:friendId", protect, conversationController.getConversationByFriendId);

module.exports = router;