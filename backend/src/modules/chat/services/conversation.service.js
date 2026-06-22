const Conversation = require("../../../models/conversation.model");
const User = require("../../../models/user.model");


exports.getOrCreateDirectConversation = async (senderId, receiverId) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
    isGroup: false // لضمان عدم الخلط مع الجروبات الثنائية بالخطأ
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
    });
  }
  return conversation;
};


exports.createGroup = async ({ groupName, participants, adminId }) => {
  // دمج الأدمن وضمان عدم التكرار
  const uniqueParticipants = Array.from(
    new Set([...participants, adminId.toString()])
  );

  const initialUnreadCounts = uniqueParticipants.map((memberId) => ({
    user: memberId,
    count: 0,
  }));

  const conversation = await Conversation.create({
    groupName: groupName.trim(),
    participants: uniqueParticipants,
    isGroup: true,
    groupAdmin: [adminId],
    unreadCounts: initialUnreadCounts,
  });

  return await Conversation.findById(conversation._id)
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar");
};


exports.validateGroupAndAdmin = (conversation, userId, requireAdminPermission = false) => {
  if (!conversation) throw new Error("NOT_FOUND");
  if (!conversation.isGroup) throw new Error("NOT_A_GROUP");

  const isMember = conversation.participants.some(id => id.toString() === userId.toString());
  if (!isMember) throw new Error("NOT_A_MEMBER");

  const isAdmin = conversation.groupAdmin.some(id => id.toString() === userId.toString());
  
  
  if ((conversation.adminPermission || requireAdminPermission) && !isAdmin) {
    throw new Error("NOT_AUTHORIZED_ADMIN");
  }

  return { isAdmin, isMember };
};