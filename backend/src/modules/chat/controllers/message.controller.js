const Message = require("../../../models/message.model");
const Conversation = require("../../../models/conversation.model");

exports.sendMessage = async (req, res) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    const senderId = req.user._id;
    const { conversationId, text } = req.body;

    if (!conversationId)
      return res.status(400).json({ message: "Conversation ID is required" });

    if (!text)
      return res.status(400).json({ message: "Message cannot be empty" });

    const conversation = await Conversation.findById(conversationId);

    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    const newMessage = await Message.create({
      conversationId,
      sender: senderId,
      text,
    });

    const message = await newMessage.populate(
      "sender",
      "firstName lastName username"
    );

    const receiverIdFinal = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
    );

    const hasEntry = conversation.unreadCounts.some(
      (u) => u.user.toString() === receiverIdFinal.toString()
    );

    if (hasEntry) {
      await Conversation.updateOne(
        { _id: conversationId, "unreadCounts.user": receiverIdFinal },
        {
          $inc: { "unreadCounts.$.count": 1 },
          $set: { lastMessage: message._id, updatedAt: new Date() },
        }
      );
    } else {
      await Conversation.updateOne(
        { _id: conversationId },
        {
          $push: { unreadCounts: { user: receiverIdFinal, count: 1 } },
          $set: { lastMessage: message._id, updatedAt: new Date() },
        }
      );
    }

    // ✅ جيب الـ conversation بعد التحديث
    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName username")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username firstName lastName",
        },
      });

    // ✅ emit لكل المشاركين
    conversation.participants.forEach((participantId) => {
      const socketId = onlineUsers?.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("conversationUpdated", updatedConversation);
      }
    });

    // ✅ emit الرسالة للـ receiver
    const receiverSocketId = onlineUsers?.get(receiverIdFinal.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        ...message.toObject(),
        conversationId,
      });
    }

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
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const messages = await Message.find({ conversationId })
            .populate("sender", "firstName lastName username");

        return res.status(200).json(messages);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};