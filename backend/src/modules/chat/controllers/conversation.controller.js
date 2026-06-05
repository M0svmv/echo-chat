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
  .populate("participants", "firstName lastName username avatar")
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
      .populate("participants", "firstName lastName username avatar")
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
    }) .populate("participants", "firstName lastName username avatar")
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


exports.makeGroupChat = async (req, res) => {
  const userId = req.user._id;

  try {
    
    const { groupName, participants } = req.body;

    if (!groupName || !participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: "Group name and at least one participant are required" });
    }

    // 2. دمج منشئ الجروب (Admin) داخل مصفوفة المشاركين تلقائياً لو لم يكن موجوداً
    // واستخدام Set لضمان عدم تكرار الـ IDs
    const uniqueParticipants = Array.from(
      new Set([...participants, userId.toString()])
    );

    // 3. تهيئة مصفوفة الـ unreadCounts لكل مشارك بـ 0
    const initialUnreadCounts = uniqueParticipants.map((memberId) => ({
      user: memberId,
      count: 0,
    }));

    // 4. إنشاء الجروب في قاعدة البيانات
    const conversation = await Conversation.create({
      groupName: groupName.trim(),
      participants: uniqueParticipants,
      isGroup: true,
      groupAdmin: [userId], // تعيين منشئ الجروب كأدمن
      unreadCounts: initialUnreadCounts, // تهيئة العدادات لتجنب الـ undefined لاحقاً
    });

    // 5. عمل Populate لبيانات الأعضاء والأدمن لترجع للفيرونت إند كاملة وجاهزة للعرض
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar");

    return res.status(201).json(populatedConversation);

  } catch (error) {
    console.error("Error creating group chat:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

exports.addMembersToGroupChat = async (req, res) => {
  try {
    const userId = req.user._id; // جلب الـ ID الخاص بالمستخدم الحالي من الـ Middleware
    const { conversationId } = req.params;
    const { members } = req.body; // مصفوفة تحتوي على الـ IDs للمستخدمين الجدد

    // 1. التحقق من المدخلات الأساسية
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "Members must be a non-empty array" });
    }

    // 2. جلب المحادثة أولاً للتحقق من الشروط والصلاحيات
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 3. التأكد من أنها مجموعة (Group) وليست محادثة فردية
    if (!conversation.isGroup) {
      return res.status(400).json({ message: "This conversation is not a group chat" });
    }

    // 4. 🔒 تحسين الأمان: التأكد أولاً أن المستخدم الحالي هو عضو داخل هذا الجروب
    const isMember = conversation.participants.some(partId => partId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // 5. التحقق من الصلاحيات بناءً على adminPermission
    const adminPerm = conversation.adminPermission;
    if (adminPerm) {
      const isAdmin = conversation.groupAdmin.some(adminId => adminId.toString() === userId.toString());
      if (!isAdmin) {
        return res.status(403).json({ message: "Only group admins can add members" });
      }
    }

    // 6. تصفية الـ IDs المرسلة (لإضافة الأشخاص غير الموجودين في الجروب فقط)
    const newMembers = members.filter(
      (memberId) => !conversation.participants.some(partId => partId.toString() === memberId.toString())
    );

    // إذا كان كل الأعضاء المرسلون موجودين بالفعل في الجروب
    if (newMembers.length === 0) {
      return res.status(400).json({ message: "All provided users are already in this group" });
    }

    // 7. التحديث في قاعدة البيانات باستخدام الميزات الذكية لـ MongoDB
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { participants: { $each: newMembers } },
        $push: {
          unreadCounts: {
            $each: newMembers.map((id) => ({ user: id, count: 0 })),
          },
        },
      },
      { new: true }
    )
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar")
    .populate("lastMessage");

    // 8. إرجاع النتيجة النهائية المحدثة للفرونت إند
    return res.status(200).json(updatedConversation);

  } catch (err) {
    console.error("Error in addMembersToGroupChat:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};


exports.removeMemberFromGroupChat = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { conversationId } = req.params;
    const { memberIdToRemove } = req.body; 

   
    if (!conversationId || !memberIdToRemove) {
      return res.status(400).json({ message: "Conversation ID and Member ID to remove are required" });
    }

    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    
    if (!conversation.isGroup) {
      return res.status(400).json({ message: "This conversation is not a group chat" });
    }

    
    const isMemberToRemove = conversation.participants.some(partId => partId.toString() === memberIdToRemove.toString());
    if (!isMemberToRemove) {
      return res.status(400).json({ message: "The user is not a member of this group" });
    }

    
    const isAdmin = conversation.groupAdmin.some(adminId => adminId.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: "Only group admins can remove members from the chat" });
    }

    
    if (userId.toString() === memberIdToRemove.toString()) {
      return res.status(400).json({ message: "You cannot remove yourself. Use leave group option instead" });
    }

    
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $pull: {
          participants: memberIdToRemove, 
          groupAdmin: memberIdToRemove,   
          unreadCounts: { user: memberIdToRemove } 
        }
      },
      { new: true } 
    )
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar")
    .populate("lastMessage");

    
    return res.status(200).json(updatedConversation);

  } catch (err) {
    console.error("Error in removeMemberFromGroupChat:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};


exports.leaveGroupChat = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { conversationId } = req.params;

    
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    
    if (!conversation.isGroup) {
      return res.status(400).json({ message: "You can only leave group chats" });
    }

    
    const isMember = conversation.participants.some(partId => partId.toString() === userId.toString());
    if (!isMember) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    
    conversation.participants = conversation.participants.filter(id => id.toString() !== userId.toString());
    conversation.unreadCounts = conversation.unreadCounts.filter(item => item.user.toString() !== userId.toString());
    
    const wasAdmin = conversation.groupAdmin.some(adminId => adminId.toString() === userId.toString());
    conversation.groupAdmin = conversation.groupAdmin.filter(id => id.toString() !== userId.toString());

    
    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);
      return res.status(200).json({ message: "You left the group, and the group has been deleted because it became empty" });
    }

    
    if (wasAdmin && conversation.groupAdmin.length === 0) {
      
      const newAdminId = conversation.participants[0];
      conversation.groupAdmin.push(newAdminId);
    }
   
    await conversation.save();

    
    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("lastMessage");

    return res.status(200).json({ 
      message: "You have left the group successfully", 
      conversation: updatedConversation 
    });

  } catch (err) {
    console.error("Error in leaveGroupChat:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.addGroupAdmin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { targetUserId } = req.body;

    if (!conversationId || !targetUserId) {
      return res.status(400).json({ message: "Conversation ID and Target User ID are required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "This conversation is not a group chat" });
    }

    const isAdmin = conversation.groupAdmin.some(id => id.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: "Only current group admins can assign new admins" });
    }

    const isMember = conversation.participants.some(id => id.toString() === targetUserId.toString());
    if (!isMember) {
      return res.status(400).json({ message: "User must be a member of the group first" });
    }

    const isAlreadyAdmin = conversation.groupAdmin.some(id => id.toString() === targetUserId.toString());
    if (isAlreadyAdmin) {
      return res.status(400).json({ message: "User is already an admin in this group" });
    }

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { groupAdmin: targetUserId } },
      { new: true }
    )
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar")
    .populate("lastMessage");

    return res.status(200).json(updatedConversation);

  } catch (err) {
    console.error("Error in addGroupAdmin:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.updateGroupDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { groupName, groupDescription, adminPermission } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "This conversation is not a group chat" });
    }

    const isMember = conversation.participants.some(id => id.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const isAdmin = conversation.groupAdmin.some(id => id.toString() === userId.toString());
    if (conversation.adminPermission && !isAdmin) {
      return res.status(403).json({ message: "Only admins are allowed to edit group details" });
    }

    const updateData = {};
    if (groupName !== undefined) updateData.groupName = groupName.trim();
    if (groupDescription !== undefined) updateData.groupDescription = groupDescription.trim();
    
    if (req.file) {
      updateData.groupImage = req.file.path || req.file.secure_url;
    }

    if (adminPermission !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can change group permission settings" });
      }
      updateData.adminPermission = adminPermission;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No data provided for update" });
    }

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: updateData },
      { new: true }
    )
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar")
    .populate("lastMessage");

    return res.status(200).json(updatedConversation);

  } catch (error) {
    console.error("Error in updateGroupDetails:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};


exports.demoteAdmin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { targetUserId } = req.body;

    if (!conversationId || !targetUserId) {
      return res.status(400).json({ message: "Conversation ID and Target User ID are required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Group not found" });
    if (!conversation.isGroup) return res.status(400).json({ message: "This is not a group chat" });

    const isAdmin = conversation.groupAdmin.some(id => id.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: "Only group admins can demote other admins" });
    }

    const isTargetAdmin = conversation.groupAdmin.some(id => id.toString() === targetUserId.toString());
    if (!isTargetAdmin) {
      return res.status(400).json({ message: "User is not an admin in this group" });
    }

    if (conversation.groupAdmin.length === 1 && userId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: "You are the only admin. You cannot demote yourself before assigning another admin" });
    }

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $pull: { groupAdmin: targetUserId } },
      { new: true }
    )
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar")
    .populate("lastMessage");

    return res.status(200).json(updatedConversation);
  } catch (err) {
    console.error("Error in demoteAdmin:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};


exports.clearGroupUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Group not found" });

    const isMember = conversation.participants.some(id => id.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, "unreadCounts.user": userId },
      { $set: { "unreadCounts.$.count": 0 } },
      { new: true }
    )
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar")
    .populate("lastMessage");

    return res.status(200).json(updatedConversation);
  } catch (err) {
    console.error("Error in clearGroupUnreadCount:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.getGroupDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar")
    .populate("lastMessage");

    const isMember = conversation.participants.some(id => id.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    if (!conversation) return res.status(404).json({ message: "Group not found" });
    if (!conversation.isGroup) return res.status(400).json({ message: "This is not a group chat" });

    return res.status(200).json(conversation);
  } catch (err) {
    console.error("Error in getGroupDetails:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.getMyGroupChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Conversation.find({
      isGroup: true,
      participants: userId
    })
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

    return res.status(200).json(groups);
  } catch (err) {
    console.error("Error in getMyGroupChats:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.deleteGroupChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Group not found" });
    if (!conversation.isGroup) return res.status(400).json({ message: "This is not a group chat" });

    const isAdmin = conversation.groupAdmin.some(id => id.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: "Only group admins can delete the entire chat" });
    }

    await Conversation.findByIdAndDelete(conversationId);

    return res.status(200).json({ message: "Group chat deleted permanently for all members" });
  } catch (err) {
    console.error("Error in deleteGroupChat:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};



