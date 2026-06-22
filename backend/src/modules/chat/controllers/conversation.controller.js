const Conversation = require("../../../models/conversation.model");
const User = require("../../../models/user.model");
const conversationService = require("../services/conversation.service");
const socketUtil = require("../utils/socket.utils");

exports.createConversation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId)
      return res
        .status(400)
        .json({ message: "The Person you try to chat with does not exist" });

    const conversation =
      await conversationService.getOrCreateDirectConversation(
        senderId,
        receiverId,
      );
    return res.status(200).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId },
    })
      .populate("participants", "firstName lastName username avatar")
      .populate("unreadCounts.user", "_id")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username firstName lastName" },
      })
      .sort({ pinnedBy: -1, updatedAt: -1 });

    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getArchivedConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      archivedBy: userId,
    })
      .populate("participants", "firstName lastName username avatar")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username firstName lastName",
        },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.toggleArchiveConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.archivedBy.includes(userId)) {
      conversation.archivedBy.pull(userId);
    } else {
      conversation.archivedBy.push(userId);
    }

    await conversation.save();

    return res.status(200).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getConversationByFriendId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, friendId] },
    })
      .populate("participants", "firstName lastName username avatar")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username firstName lastName",
        },
      });
    return res.status(200).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.makeGroupChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupName, participants } = req.body;

    if (
      !groupName ||
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return res
        .status(400)
        .json({
          message: "Group name and at least one participant are required",
        });
    }

    const populatedGroup = await conversationService.createGroup({
      groupName,
      participants,
      adminId: userId,
    });
    return res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error creating group chat:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

exports.addMembersToGroupChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { members } = req.body;

    if (!conversationId)
      return res.status(400).json({ message: "Conversation ID is required" });
    if (!Array.isArray(members) || members.length === 0)
      return res
        .status(400)
        .json({ message: "Members must be a non-empty array" });

    const conversation = await Conversation.findById(conversationId);

    // التعامل مع الأخطاء القادمة من الـ Validation في السيرفيس
    try {
      conversationService.validateGroupAndAdmin(conversation, userId);
    } catch (err) {
      if (err.message === "NOT_FOUND")
        return res.status(404).json({ message: "Conversation not found" });
      if (err.message === "NOT_A_GROUP")
        return res
          .status(400)
          .json({ message: "This conversation is not a group chat" });
      if (err.message === "NOT_A_MEMBER")
        return res
          .status(403)
          .json({ message: "You are not a member of this group" });
      if (err.message === "NOT_AUTHORIZED_ADMIN")
        return res
          .status(403)
          .json({ message: "Only group admins can add members" });
    }

    const newMembers = members.filter(
      (memberId) =>
        !conversation.participants.some(
          (partId) => partId.toString() === memberId.toString(),
        ),
    );

    if (newMembers.length === 0)
      return res
        .status(400)
        .json({ message: "All provided users are already in this group" });

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { participants: { $each: newMembers } },
        $push: {
          unreadCounts: {
            $each: newMembers.map((id) => ({ user: id, count: 0 })),
          },
        },
      },
      { new: true },
    )
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage");

    return res.status(200).json(updatedConversation);
  } catch (err) {
    console.error("Error in addMembersToGroupChat:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

exports.removeMemberFromGroupChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { memberIdToRemove } = req.body;

    if (!conversationId || !memberIdToRemove)
      return res
        .status(400)
        .json({
          message: "Conversation ID and Member ID to remove are required",
        });

    const conversation = await Conversation.findById(conversationId);

    try {
      conversationService.validateGroupAndAdmin(conversation, userId, true); // إجبارية الأدمن هنا لحذف عضو
    } catch (err) {
      if (err.message === "NOT_FOUND")
        return res.status(404).json({ message: "Conversation not found" });
      if (err.message === "NOT_A_GROUP")
        return res
          .status(400)
          .json({ message: "This conversation is not a group chat" });
      if (err.message === "NOT_A_MEMBER")
        return res
          .status(403)
          .json({ message: "You are not a member of this group" });
      if (err.message === "NOT_AUTHORIZED_ADMIN")
        return res
          .status(403)
          .json({
            message: "Only group admins can remove members from the chat",
          });
    }

    const isMemberToRemove = conversation.participants.some(
      (partId) => partId.toString() === memberIdToRemove.toString(),
    );
    if (!isMemberToRemove)
      return res
        .status(400)
        .json({ message: "The user is not a member of this group" });

    if (userId.toString() === memberIdToRemove.toString()) {
      return res
        .status(400)
        .json({
          message: "You cannot remove yourself. Use leave group option instead",
        });
    }

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $pull: {
          participants: memberIdToRemove,
          groupAdmin: memberIdToRemove,
          unreadCounts: { user: memberIdToRemove },
        },
      },
      { new: true },
    )
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage");

    return res.status(200).json(updatedConversation);
  } catch (err) {
    console.error("Error in removeMemberFromGroupChat:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

exports.leaveGroupChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    if (!conversationId)
      return res.status(400).json({ message: "Conversation ID is required" });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ message: "Group chat not found" });
    if (!conversation.isGroup)
      return res
        .status(400)
        .json({ message: "You can only leave group chats" });

    const isMember = conversation.participants.some(
      (partId) => partId.toString() === userId.toString(),
    );
    if (!isMember)
      return res
        .status(400)
        .json({ message: "You are not a member of this group" });

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== userId.toString(),
    );
    conversation.unreadCounts = conversation.unreadCounts.filter(
      (item) => item.user.toString() !== userId.toString(),
    );

    const wasAdmin = conversation.groupAdmin.some(
      (adminId) => adminId.toString() === userId.toString(),
    );
    conversation.groupAdmin = conversation.groupAdmin.filter(
      (id) => id.toString() !== userId.toString(),
    );

    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);
      return res
        .status(200)
        .json({
          message:
            "You left the group, and the group has been deleted because it became empty",
        });
    }

    if (wasAdmin && conversation.groupAdmin.length === 0) {
      const newAdminId = conversation.participants[0];
      conversation.groupAdmin.push(newAdminId);
    }

    await conversation.save();

    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage");

    return res
      .status(200)
      .json({
        message: "You have left the group successfully",
        conversation: updatedConversation,
      });
  } catch (err) {
    console.error("Error in leaveGroupChat:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

exports.addGroupAdmin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { targetUserId } = req.body;

    if (!conversationId || !targetUserId)
      return res
        .status(400)
        .json({ message: "Conversation ID and Target User ID are required" });

    const conversation = await Conversation.findById(conversationId);

    try {
      conversationService.validateGroupAndAdmin(conversation, userId, true);
    } catch (err) {
      if (err.message === "NOT_FOUND")
        return res.status(404).json({ message: "Conversation not found" });
      if (err.message === "NOT_A_GROUP")
        return res
          .status(400)
          .json({ message: "This conversation is not a group chat" });
      if (err.message === "NOT_A_MEMBER")
        return res
          .status(403)
          .json({ message: "You are not a member of this group" });
      if (err.message === "NOT_AUTHORIZED_ADMIN")
        return res
          .status(403)
          .json({ message: "Only current group admins can assign new admins" });
    }

    const isMember = conversation.participants.some(
      (id) => id.toString() === targetUserId.toString(),
    );
    if (!isMember)
      return res
        .status(400)
        .json({ message: "User must be a member of the group first" });

    const isAlreadyAdmin = conversation.groupAdmin.some(
      (id) => id.toString() === targetUserId.toString(),
    );
    if (isAlreadyAdmin)
      return res
        .status(400)
        .json({ message: "User is already an admin in this group" });

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { groupAdmin: targetUserId } },
      { new: true },
    )
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage");

    return res.status(200).json(updatedConversation);
  } catch (err) {
    console.error("Error in addGroupAdmin:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

exports.updateGroupDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { groupName, groupDescription, adminPermission } = req.body;

    if (!conversationId)
      return res.status(400).json({ message: "Conversation ID is required" });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ message: "Group not found" });

    const { isAdmin } = conversationService.validateGroupAndAdmin(
      conversation,
      userId,
    );

    const updateData = {};
    if (groupName !== undefined) updateData.groupName = groupName.trim();
    if (groupDescription !== undefined)
      updateData.groupDescription = groupDescription.trim();
    if (req.file) updateData.groupImage = req.file.path || req.file.secure_url;

    if (adminPermission !== undefined) {
      if (!isAdmin)
        return res
          .status(403)
          .json({
            message: "Only admins can change group permission settings",
          });
      updateData.adminPermission = adminPermission;
    }

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ message: "No data provided for update" });

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: updateData },
      { new: true },
    )
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage");

    return res.status(200).json(updatedConversation);
  } catch (error) {
    console.error("Error in updateGroupDetails:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

exports.demoteAdmin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { targetUserId } = req.body;

    if (!conversationId || !targetUserId)
      return res
        .status(400)
        .json({ message: "Conversation ID and Target User ID are required" });

    const conversation = await Conversation.findById(conversationId);

    try {
      conversationService.validateGroupAndAdmin(conversation, userId, true);
    } catch (err) {
      if (err.message === "NOT_FOUND")
        return res.status(404).json({ message: "Group not found" });
      if (err.message === "NOT_A_GROUP")
        return res.status(400).json({ message: "This is not a group chat" });
      if (err.message === "NOT_AUTHORIZED_ADMIN")
        return res
          .status(403)
          .json({ message: "Only group admins can demote other admins" });
    }

    const isTargetAdmin = conversation.groupAdmin.some(
      (id) => id.toString() === targetUserId.toString(),
    );
    if (!isTargetAdmin)
      return res
        .status(400)
        .json({ message: "User is not an admin in this group" });

    if (
      conversation.groupAdmin.length === 1 &&
      userId.toString() === targetUserId.toString()
    ) {
      return res
        .status(400)
        .json({
          message:
            "You are the only admin. You cannot demote yourself before assigning another admin",
        });
    }

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $pull: { groupAdmin: targetUserId } },
      { new: true },
    )
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage");

    return res.status(200).json(updatedConversation);
  } catch (err) {
    console.error("Error in demoteAdmin:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

exports.clearGroupUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    conversationService.validateGroupAndAdmin(conversation, userId);

    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, "unreadCounts.user": userId },
      { $set: { "unreadCounts.$.count": 0 } },
      { new: true },
    )
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage");

    return res.status(200).json(updatedConversation);
  } catch (err) {
    console.error("Error in clearGroupUnreadCount:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

exports.getGroupDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage");

    conversationService.validateGroupAndAdmin(conversation, userId);

    return res.status(200).json(conversation);
  } catch (err) {
    console.error("Error in getGroupDetails:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

exports.getMyGroupChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Conversation.find({
      isGroup: true,
      participants: userId,
    })
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return res.status(200).json(groups);
  } catch (err) {
    console.error("Error in getMyGroupChats:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

exports.deleteGroupChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    conversationService.validateGroupAndAdmin(conversation, userId, true);

    await Conversation.findByIdAndDelete(conversationId);
    return res
      .status(200)
      .json({ message: "Group chat deleted permanently for all members" });
  } catch (err) {
    console.error("Error in deleteGroupChat:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

exports.togglePinConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    const isPinned = conversation.pinnedBy.includes(userId);
    if (isPinned) {
      conversation.pinnedBy = conversation.pinnedBy.filter(
        (id) => id.toString() !== userId.toString(),
      );
    } else {
      conversation.pinnedBy.push(userId);
    }
    await conversation.save();

    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName username avatar")
      .populate("pinnedBy", "_id");

    // استخدام الـ socket utility اللي عملناها لتحديث الترتيب فوراً في الفرونت إيند
    socketUtil.emitToParticipants({
      req,
      participants: conversation.participants,
      eventName: "conversationUpdated",
      data: updatedConversation,
    });

    return res.status(200).json({ isPinned: !isPinned });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
