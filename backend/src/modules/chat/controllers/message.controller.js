const Message = require("../../../models/message.model");
const Conversation = require("../../../models/conversation.model");
const UserPreference = require("../../../models/userPreference.model");
const messageService = require("../services/message.service");
const socketUtil = require("../utils/socket.utils");

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { conversationId, text, replyTo } = req.body;

    if (!conversationId) return res.status(400).json({ message: "Conversation ID is required" });

    const { fileUrl, fileType } = messageService.getFileDetails(req.file);
    if (!text && !fileUrl) return res.status(400).json({ message: "Cannot send an empty message" });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    // فحص الحظر
    try {
      await messageService.checkBlockStatus(conversation, senderId);
    } catch (blockError) {
      if (blockError.message === "BLOCKED_BY_ME") {
        return res.status(403).json({ message: "You have blocked this user. Unblock them to send messages." });
      }
      if (blockError.message === "BLOCKED_BY_THEM") {
        return res.status(403).json({ message: "Cannot send message. This user has blocked you." });
      }
    }

    // إنشاء الرسالة وتحديث المحادثة
    const message = await messageService.createMessage({ conversationId, senderId, text, fileUrl, fileType, replyTo });
    const updatedConversation = await messageService.updateConversationMetadata(conversation, message, senderId);

    // إرسال السوكتس عبر الـ Utility
    socketUtil.emitToParticipants({
      req,
      participants: conversation.participants,
      eventName: "conversationUpdated",
      data: { ...updatedConversation.toObject(), hasNewMessage: true }
    });

    socketUtil.emitToParticipants({
      req,
      participants: conversation.participants,
      eventName: "newMessage",
      data: { ...message.toObject(), conversationId },
      skipUserId: senderId // الطرف التاني بس اللي يستقبل الـ newMessage
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const messages = await Message.find({ conversationId })
      .populate("sender", "firstName lastName username")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "firstName lastName username",
        },
      });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.editMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { messageId } = req.params;
    const { newText } = req.body;

    if (!newText) return res.status(400).json({ message: "Text is required" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== senderId.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this message" });
    }

    message.text = newText;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);

    socketUtil.emitToParticipants({
      req,
      participants: conversation.participants,
      eventName: "messageEdited",
      data: {
        messageId: message._id,
        conversationId: message.conversationId,
        newText: message.text,
        isEdited: true
      }
    });

    return res.status(200).json(message);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (!message.reactions) message.reactions = [];

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId, username: req.user.username, emoji });
    }

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);

    socketUtil.emitToParticipants({
      req,
      participants: conversation.participants,
      eventName: "messageReactionUpdated",
      data: {
        messageId: message._id,
        conversationId: message.conversationId,
        reactions: message.reactions
      }
    });

    return res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.deleteMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== senderId.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this message" });
    }

    const conversationId = message.conversationId;
    await Message.findByIdAndDelete(messageId);

    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.lastMessage?.toString() === messageId.toString()) {
      const lastMessage = await Message.findOne({ conversationId }).sort({ createdAt: -1 });
      conversation.lastMessage = lastMessage ? lastMessage._id : null;
      await conversation.save();
    }

    if (conversation) {
      socketUtil.emitToParticipants({
        req,
        participants: conversation.participants,
        eventName: "messageDeleted",
        data: { messageId, conversationId }
      });
    }

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};