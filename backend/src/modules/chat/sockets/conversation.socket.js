const Conversation = require('../../../models/conversation.model');
const Message = require('../../../models/message.model');

module.exports = (io, socket) => {
  
 
  socket.on("markAsSeen", async ({ conversationId, userId }) => {
    try {
      await Conversation.updateOne(
        { _id: conversationId, "unreadCounts.user": userId },
        { $set: { "unreadCounts.$.count": 0 } }
      );

      await Message.updateMany(
        { conversationId, sender: { $ne: userId }, seen: false },
        { $set: { seen: true } }
      );

      const updatedConversation = await Conversation.findById(conversationId)
        .populate("participants", "firstName lastName username avatar")
        .populate("groupAdmin", "firstName lastName username avatar")
        .populate({
          path: "lastMessage",
          populate: { path: "sender", select: "username firstName lastName" },
        });

      if (!updatedConversation) return;

      updatedConversation.participants.forEach((participant) => {
        const participantIdStr = participant._id.toString();
        
        io.to(participantIdStr).emit("conversationUpdated", {
          ...updatedConversation.toObject(),
          hasNewMessage: false,
        });

        if (participantIdStr !== userId.toString()) {
          io.to(participantIdStr).emit("messagesSeen", { conversationId });
        }
      });
    } catch (error) {
      console.error("❌ MarkAsSeen Error:", error);
    }
  });

  socket.on("archiveConversation", async ({ conversationId, userId }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      const isArchived = conversation.archivedBy.some(
        (id) => id.toString() === userId.toString()
      );

      if (isArchived) {
        conversation.archivedBy.pull(userId);
      } else {
        conversation.archivedBy.push(userId);
      }

      await conversation.save();

      io.to(userId.toString()).emit("conversationArchived", {
        conversationId,
        isArchived: !isArchived,
      });
    } catch (error) {
      console.error("❌ Archive Error:", error);
    }
  });
};