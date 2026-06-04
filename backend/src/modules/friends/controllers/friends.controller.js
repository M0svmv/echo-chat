const FriendRequest = require("../../../models/friendRequest.model");
const User = require("../../../models/user.model");
const Conversation = require("../../../models/conversation.model");
const UserPreference = require("../../../models/userPreference.model");

const mongoose = require("mongoose");


exports.getAvailableUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query = "" } = req.query;

    // 1. تجيب المحادثات، البلوكات، وطلبات الصداقة المعلقة أو المقبولة
    const [conversations, preferences, friendRequests] = await Promise.all([
      Conversation.find({ participants: userId }).select("participants"),
      UserPreference.find({ $or: [{ user: userId }, { targetUser: userId }], type: "block" }),
      FriendRequest.find({ $or: [{ sender: userId }, { receiver: userId }] })
    ]);

    // 2. استخراج كل الـ IDs اللي المفروض متظهرش في البحث
    const chattedUserIds = conversations.flatMap(conv => 
      conv.participants.map(id => id.toString()).filter(id => id !== userId.toString())
    );

    const blockedUserIds = preferences.map(pref => 
      pref.user.toString() === userId.toString() ? pref.targetUser.toString() : pref.user.toString()
    );

    const relatedUserIds = friendRequests.map(req => 
      req.sender.toString() === userId.toString() ? req.receiver.toString() : req.sender.toString()
    );

    // دمج كل الـ IDs المستبعدة في مصفوفة واحدة بدون تكرار
    const excludedUserIds = Array.from(new Set([userId.toString(), ...chattedUserIds, ...blockedUserIds, ...relatedUserIds]));

    // 3. بناء فلتر البحث
    const searchFilter = query
      ? {
          $or: [
            { firstName: { $regex: query, $options: "i" } },
            { lastName: { $regex: query, $options: "i" } },
            { username: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    // 4. الـ Query النهائي
    const availableUsers = await User.find({
      _id: { $nin: excludedUserIds },
      ...searchFilter,
    })
    .select("firstName lastName username avatar")
    .limit(20);

    return res.status(200).json(availableUsers);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
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
    const { action } = req.body; // 'accepted' or 'rejected'

    if (!requestId) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to respond to this friend request" });
    }

    // حماية: التأكد إن الطلب مش مقبول أو مرفوض قبل كدة
    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "This request has already been responded to" });
    }

    friendRequest.status = action;
    await friendRequest.save();

    if (action === "accepted") {
        // التأكد إن مفيش كونفرزيشن قديمة بين الطرفين قبل الكريت
        const existingChat = await Conversation.findOne({
          participants: { $all: [friendRequest.sender, friendRequest.receiver] }
        });
        
        if (!existingChat) {
          await Conversation.create({
              participants: [friendRequest.sender, friendRequest.receiver]
          });
        }
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


exports.getFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await FriendRequest.find({
    $or: [{ sender: userId }, { receiver: userId }],
    status: "accepted"
})
.populate("sender", "firstName lastName username avatar")
.populate("receiver", "firstName lastName username avatar");


const friends = requests.map(doc => {
    
    if (doc.sender._id.toString() === userId.toString()) {
        return {
            requestId: doc._id, 
            ...doc.receiver._doc  
        };
    } else {
        
        return {
            requestId: doc._id,
            ...doc.sender._doc 
        };
    }
});


    return res.status(200).json(friends);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}


exports.getCloseFriends = async (req,res)=>{
  try{
    const userId = req.user._id;
     const closeFriends = await UserPreference.find({user:userId,type:"close_friend"}).populate("targetUser","firstName lastName username avatar");
     return res.status(200).json(closeFriends);

  }catch(err){

    return res.status(500).json({ error: err.message || "Internal server error" });

  }
}

exports.getBlockedUsers = async (req,res)=>{
  try{
    const userId = req.user._id;
     const blockedUsers = await UserPreference.find({user:userId,type:"block"}).populate("targetUser","firstName lastName username avatar");
     return res.status(200).json(blockedUsers);

  }catch(err){

    return res.status(500).json({ error: err.message || "Internal server error" });

  }
}

exports.makePreference = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user._id;
    const { type, targetUserId } = req.body; // تعديل الـ syntax error هنا
    
    let preference = null;

    // التأكد إن الطرفين أصدقاء فعلاً قبل إضافة close_friend
    const isFriend = await FriendRequest.findOne({
      $or: [
        { sender: userId, receiver: targetUserId },
        { sender: targetUserId, receiver: userId }
      ],
      status: "accepted"
    });

    if (type === "close_friend") {
      if (!isFriend) {
        return res.status(400).json({ message: "You can only add friends to close friends" });
      }
      
      preference = await UserPreference.findOneAndUpdate(
        { user: userId, targetUser: targetUserId },
        { type: "close_friend" },
        { upsert: true, new: true }
      );
    }

    if (type === "block") {
      session.startTransaction();

      // لو فيه صداقة أو طلب معلق أو كلوز فريند، يتم مسحهم فوراً
      await Promise.all([
        FriendRequest.findOneAndDelete({
          $or: [{ sender: userId, receiver: targetUserId }, { sender: targetUserId, receiver: userId }]
        }, { session }),
        UserPreference.deleteMany({
          $or: [
            { user: userId, targetUser: targetUserId },
            { user: targetUserId, targetUser: userId }
          ]
        }, { session })
      ]);

      // إنشاء علاقة البلوك الجديدة
      preference = await UserPreference.create([{
        user: userId,
        targetUser: targetUserId,
        type: "block"
      }], { session });

      await session.commitTransaction();
      preference = preference[0]; // لأن create مع session بترجع array
    }
     
    session.endSession();
    return res.status(200).json(preference);

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.body;
    
    // مسح الصداقة والكلوز فريند المتبادل بين الطرفين
    await Promise.all([
      FriendRequest.findOneAndDelete({
        $or: [{ sender: userId, receiver: friendId }, { sender: friendId, receiver: userId }]
      }),
      UserPreference.deleteMany({
        $or: [
          { user: userId, targetUser: friendId },
          { user: friendId, targetUser: userId }
        ]
      })
    ]);

    return res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};
