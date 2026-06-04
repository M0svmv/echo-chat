const Conversation = require("../../../models/conversation.model");
const User = require("../../../models/user.model");

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
    const conversations = await Conversation.find({
  participants: userId,
  archivedBy: { $ne: userId },
})
  .populate("participants", "firstName lastName username")
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
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.searchNewUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }
    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    }).select("firstName lastName username avatar").limit(10);
    return res.status(200).json({
      users,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}


exports.getArchivedConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      archivedBy: userId,
    })
      .populate("participants", "firstName lastName username")
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
    }) .populate("participants", "firstName lastName username")
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