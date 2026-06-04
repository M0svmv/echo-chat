import app from './app.js';
import connectDB from './config/db.config.js';

import http from 'http';
import { Server } from 'socket.io';

import Message from './models/message.model.js';
import Conversation from './models/conversation.model.js';

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);

const onlineUsers = new Map();
app.set('onlineUsers', onlineUsers);

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  socket.on('addUser', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log('Online Users:', [...onlineUsers]);
  });

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
        .populate({
          path: "lastMessage",
          populate: {
            path: "sender",
            select: "username firstName lastName",
          },
        });

      updatedConversation.participants.forEach((participant) => {
        const socketId = onlineUsers.get(participant._id.toString());
        if (socketId) {
          io.to(socketId).emit("conversationUpdated", {
            ...updatedConversation.toObject(),
            hasNewMessage: false,
          });
        }
      });

      const receiverId = updatedConversation.participants.find(
        (p) => p._id.toString() !== userId
      );

      const receiverSocketId = onlineUsers.get(receiverId._id.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messagesSeen", { conversationId });
      }
    } catch (error) {
      console.log(error);
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

      const userSocketId = onlineUsers.get(userId.toString());
      if (userSocketId) {
        io.to(userSocketId).emit("conversationArchived", {
          conversationId,
          isArchived: !isArchived,
        });
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log('🔴 User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});