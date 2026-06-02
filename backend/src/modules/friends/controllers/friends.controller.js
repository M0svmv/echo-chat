const FriendRequest = require("../../../models/friendRequest.model");
const User = require("../../../models/user.model");
const Conversation = require("../../../models/conversation.model");


exports.getAvailableUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query = "" } = req.query;

    // 1. get conversations
    const conversations = await Conversation.find({
      participants: userId,
    }).select("participants");

    // 2. extract chatted users
    const chattedUserIds = conversations.flatMap((conv) =>
      conv.participants
        .map((id) => id.toString())
        .filter((id) => id !== userId.toString())
    );

    // 3. build search filter
    const searchFilter = query
      ? {
          $or: [
            { firstName: { $regex: query, $options: "i" } },
            { lastName: { $regex: query, $options: "i" } },
            { username: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    // 4. final query
    const availableUsers = await User.find({
      _id: {
        $nin: [userId, ...chattedUserIds],
      },
      ...searchFilter,
    })
      .select("firstName lastName username avatar")
      .limit(20);

    return res.status(200).json(availableUsers);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
};


exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    const existingRequest = await FriendRequest.findOne({
        sender: senderId,
        receiver: receiverId,
        status: { $in: ["pending", "accepted"] }
    });

    if (existingRequest) {
        return res.status(400).json({ message: "Friend request already exists" });
    }

    const friendRequest = await FriendRequest.create({
        sender: senderId,
        receiver: receiverId,
    });

    return res.status(201).json(friendRequest);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};


exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendRequests = await FriendRequest.find({ receiver: userId, status: "pending" }).populate("sender", "firstName lastName username avatar");
    return res.status(200).json(friendRequests);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

exports.respondToFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestId } = req.params;
    const { action } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.receiver.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to respond to this friend request" });
    }

    friendRequest.status = action;
    await friendRequest.save();

    if (action === "accepted") {
        await Conversation.create({
            participants: [friendRequest.sender, friendRequest.receiver]
        });
    }

    return res.status(200).json(friendRequest);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMySentRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendRequests = await FriendRequest.find({ sender: userId, status: "pending" }).populate("receiver", "firstName lastName username avatar");
    console.log(friendRequests);
    return res.status(200).json(friendRequests);
    
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};


exports.deleteFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to delete this friend request",
      });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.status(200).json({
      message: "Friend request deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
};