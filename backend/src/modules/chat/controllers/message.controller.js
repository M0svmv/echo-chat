const Message = require("../../../models/message.model");
const Conversation = require("../../../models/conversation.model");

exports.sendMessage = async (req, res) => {
    try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');

        const senderId = req.user._id;
        const { conversationId, text, receiverId } = req.body;

        if (!conversationId) {
            return res.status(400).json({ message: "Conversation ID is required" });
        }

        if (!text) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const newMessage = await Message.create({
            conversationId,
            sender: senderId,
            text
        });

        // ✅ populate بعد الـ create عشان الاسم يييجي من أول مرة
        const message = await newMessage.populate("sender", "firstName lastName username");

        conversation.updatedAt = Date.now();
        conversation.lastMessage = message._id;
        await conversation.save();

        

        if (receiverId) {
            const receiverSocketId = onlineUsers?.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receiveMessage", message);
            }
        }

        return res.status(201).json(message);
    } catch (error) {
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