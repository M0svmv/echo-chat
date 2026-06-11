const Message = require("../../../models/message.model");
const Conversation = require("../../../models/conversation.model");
const UserPreference = require("../../../models/userPreference.model");

exports.sendMessage = async (req, res) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    const senderId = req.user._id;
    const { conversationId, text } = req.body;

    if (!conversationId) return res.status(400).json({ message: "Conversation ID is required" });
    if (!text) return res.status(400).json({ message: "Message cannot be empty" });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    // ==================== [منطق التفرقة في الحظر] ====================
    if (!conversation.isGroup) {
      // إيجاد الطرف التاني في المحادثة الخاصّة
      const targetUserId = conversation.participants.find(
        (id) => id.toString() !== senderId.toString()
      );

      if (targetUserId) {
        // 1. فحص هل المرسل الحالي هو اللي عامل بلوك؟
        const iBlockedThem = await UserPreference.findOne({
          user: senderId,
          targetUser: targetUserId,
          type: "block"
        });

        if (iBlockedThem) {
          return res.status(403).json({ 
            message: "You have blocked this user. Unblock them to send messages." 
          });
        }

        // 2. فحص هل الطرف الثاني هو اللي عامل بلوك للمرسل؟
        const theyBlockedMe = await UserPreference.findOne({
          user: targetUserId,
          targetUser: senderId,
          type: "block"
        });

        if (theyBlockedMe) {
          return res.status(403).json({ 
            message: "Cannot send message. This user has blocked you." 
          });
        }
      }
    }
    // =============================================================

    // كود الحفظ والإرسال الطبيعي (يكمل لو مفيش بلوك أو لو كانت المحادثة جروب)
    const newMessage = await Message.create({
      conversationId,
      sender: senderId,
      text,
    });

    const message = await newMessage.populate("sender", "firstName lastName username");

    await Conversation.updateOne(
      { _id: conversationId },
      {
        $set: { lastMessage: message._id, updatedAt: new Date() },
        $inc: { "unreadCounts.$[elem].count": 1 }
      },
      {
        arrayFilters: [{ "elem.user": { $ne: senderId } }]
      }
    );

    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username firstName lastName",
        },
      });

    conversation.participants.forEach((participantId) => {
      const socketId = onlineUsers?.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("conversationUpdated", {
          ...updatedConversation.toObject(),
          hasNewMessage: true,
        });

        if (participantId.toString() !== senderId.toString()) {
          io.to(socketId).emit("newMessage", {
            ...message.toObject(),
            conversationId,
          });
        }
      }
    });

    return res.status(201).json(message);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const messages = await Message.find({ conversationId })
      .populate("sender", "firstName lastName username");

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};