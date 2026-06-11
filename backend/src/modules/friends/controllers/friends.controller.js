const FriendRequest = require("../../../models/friendRequest.model");
const User = require("../../../models/user.model");
const Conversation = require("../../../models/conversation.model");
const UserPreference = require("../../../models/userPreference.model");

const mongoose = require("mongoose");


exports.getAvailableUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query = "" } = req.query;

    // 1. نجيب البلوكات وطلبات الصداقة فقط (قمنا بإزالة الـ Conversation لتسمح بظهور من تبادلت معهم المحادثات)
    const [preferences, friendRequests] = await Promise.all([
      UserPreference.find({ $or: [{ user: userId }, { targetUser: userId }], type: "block" }),
      FriendRequest.find({ $or: [{ sender: userId }, { receiver: userId }] })
    ]);

    // 2. استخراج المعرفات (IDs) التي يجب حجبها من البحث تماماً
    
    // استخراج الأشخاص المحظورين (سواء قمت بحظرهم أو قاموا بحظرك)
    const blockedUserIds = preferences.map(pref => 
      pref.user.toString() === userId.toString() ? pref.targetUser.toString() : pref.user.toString()
    );

    // استخراج الأشخاص الذين بينك وبينهم طلب صداقة (سواء مقبول، معلق، إلخ)
    const relatedUserIds = friendRequests.map(req => 
      req.sender.toString() === userId.toString() ? req.receiver.toString() : req.sender.toString()
    );

    // دمج الـ IDs المستبعدة (نفسك + المحظورين + أطراف طلبات الصداقة) في مصفوفة واحدة بدون تكرار
    const excludedUserIds = Array.from(new Set([
      userId.toString(), 
      ...blockedUserIds, 
      ...relatedUserIds
    ]));

    // 3. بناء فلتر البحث النصي
    const searchFilter = query
      ? {
          $or: [
            { firstName: { $regex: query, $options: "i" } },
            { lastName: { $regex: query, $options: "i" } },
            { username: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    // 4. الـ Query النهائي لجلب المستخدمين المتاحين
    const availableUsers = await User.find({
      _id: { $nin: excludedUserIds },
      ...searchFilter,
    })
    .select("firstName lastName username avatar bio")
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
        // 🔥 التعديل هنا: التأكد تماماً أن الطرفين ليس بينهما محادثة ثنائية (Direct Chat) قائمة
        // الفلتر يبحث عن محادثة تحتوي على الطرفين فقط (حجم المصفوفة 2) وغير تصنيفها كـ جروب
        const existingChat = await Conversation.findOne({
          participants: { $all: [friendRequest.sender, friendRequest.receiver] },
          $expr: { $eq: [{ $size: "$participants" }, 2] }, // حماية للتأكد أنه شات ثنائي وليس جروب مشتركين فيه
          isGroup: { $ne: true } // إذا كان موديل الـ Conversation يحتوي على حقل الجروب
        });
        
        // لو مفيش محادثة ثنائية موجودة نهائياً.. كَريِت واحدة جديدة
        if (!existingChat) {
          await Conversation.create({
              participants: [friendRequest.sender, friendRequest.receiver],
              isGroup: false
          });
        }
    }

    return res.status(200).json(friendRequest);
  } catch (error) {
    console.error("Error responding to friend request:", error);
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
  try {
    const userId = req.user._id;
    const { type, targetUserId } = req.body;
    
    let preference = null;

    // 1. حالة الأصدقاء المقربين
    if (type === "close_friend") {
      const isFriend = await FriendRequest.findOne({
        $or: [
          { sender: userId, receiver: targetUserId },
          { sender: targetUserId, receiver: userId }
        ],
        status: "accepted"
      });

      if (!isFriend) {
        return res.status(400).json({ message: "You can only add friends to close friends" });
      }
      
      preference = await UserPreference.findOneAndUpdate(
        { user: userId, targetUser: targetUserId },
        { type: "close_friend" },
        { upsert: true, new: true }
      );
    }

    // 2. حالة الحظر (Block)
    if (type === "block") {
      await Promise.all([
        FriendRequest.findOneAndDelete({
          $or: [{ sender: userId, receiver: targetUserId }, { sender: targetUserId, receiver: userId }]
        }),
        UserPreference.deleteMany({
          $or: [
            { user: userId, targetUser: targetUserId },
            { user: targetUserId, targetUser: userId }
          ]
        })
      ]);

      preference = await UserPreference.findOneAndUpdate(
        { user: userId, targetUser: targetUserId },
        { type: "block" },
        { upsert: true, new: true }
      );
    }

    // 🔥 3. حالة إلغاء الحظر المضافة حديثاً (Unblock)
    if (type === "unblock") {
      await UserPreference.deleteOne({
        user: userId,
        targetUser: targetUserId,
        type: "block"
      });
      
      return res.status(200).json({ message: "User unblocked successfully" });
    }
     
    return res.status(200).json(preference);

  } catch (err) {
    console.error("Error in makePreference:", err);
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


exports.getFriendsSummary = async (req,res) => {

  try{

    const userId = req.user._id;

    const[reqSent,reqReceived,friends,closeFriends,blocked] = await Promise.all([
      FriendRequest.find({sender:userId,status:"pending"}).populate("receiver","firstName lastName username avatar"),
      FriendRequest.find({receiver:userId,status:"pending"}).populate("sender","firstName lastName username avatar"),
      UserPreference.find({user:userId,type:"friend"}).populate("targetUser","firstName lastName username avatar"),
      UserPreference.find({user:userId,type:"close_friend"}).populate("targetUser","firstName lastName username avatar"),
      UserPreference.find({user:userId,type:"block"}).populate("targetUser","firstName lastName username avatar"),
        
    ])

    return res.status(200).json({requestsRes:reqSent,receivedRes:reqReceived,friendsRes:friends,closeFriendsRes:closeFriends,blockedRes:blocked});

  }catch(err){
    return res.status(500).json({ error: err.message || "Internal server error" });
  }

}