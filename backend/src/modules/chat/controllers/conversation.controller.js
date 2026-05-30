const Conversation = require("../../../models/conversation.model");

exports.createConversation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res
        .status(400)
        .json({ message: "The Person you try to chat with does not exist" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (conversation) {
      return res.status(200).json(conversation);
    }

    conversation = await Conversation.create({
      participants: [senderId, receiverId],
    });

    return res.status(201).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "firstName lastName username")
      .sort({ updatedAt: -1 });
    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
