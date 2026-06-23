const Message = require("../../../models/message.model");
const Conversation = require("../../../models/conversation.model");
const UserPreference = require("../../../models/userPreference.model");

exports.checkBlockStatus = async (conversation, senderId) => {
  if (conversation.isGroup) return;

  const targetUserId = conversation.participants.find(
    (id) => id.toString() !== senderId.toString()
  );

  if (!targetUserId) return;

  const iBlockedThem = await UserPreference.findOne({
    user: senderId,
    targetUser: targetUserId,
    type: "block",
  });

  if (iBlockedThem) throw new Error("BLOCKED_BY_ME");

  const theyBlockedMe = await UserPreference.findOne({
    user: targetUserId,
    targetUser: senderId,
    type: "block",
  });

  if (theyBlockedMe) throw new Error("BLOCKED_BY_THEM");
};

exports.getFileDetails = (file) => {
  if (!file) return { fileUrl: "", fileType: "text" };

  const fileUrl = file.path;
  const mime = file.mimetype;

  let fileType = "file";

  if (mime.startsWith("image/")) fileType = "image";
  else if (mime.startsWith("video/")) fileType = "video";
  else if (mime.startsWith("audio/")) fileType = "audio";

  return { fileUrl, fileType };
};

exports.createMessage = async ({
  conversationId,
  senderId,
  text,
  fileUrl,
  fileType,
  replyTo,
}) => {
  const message = await Message.create({
    conversationId,
    sender: senderId,
    text: text || "",
    fileUrl,
    fileType,
    replyTo: replyTo || null,
  });

  return message.populate([
    {
      path: "sender",
      select: "firstName lastName username avatar",
    },
    {
      path: "replyTo",
      populate: {
        path: "sender",
        select: "firstName lastName username",
      },
    },
  ]);
};

exports.updateConversationMetadata = async (conversation, message, senderId) => {
  if (!conversation.unreadCounts) conversation.unreadCounts = [];

  conversation.participants.forEach((participantId) => {
    if (participantId.toString() === senderId.toString()) return;

    let unread = conversation.unreadCounts.find(
      (u) => u.user.toString() === participantId.toString()
    );

    if (!unread) {
      conversation.unreadCounts.push({
        user: participantId,
        count: 1,
      });
    } else {
      unread.count += 1;
    }
  });

  conversation.lastMessage = message._id;
  conversation.updatedAt = new Date();

  await conversation.save();

  return Conversation.findById(conversation._id)
    .populate("participants", "firstName lastName username avatar")
    .populate("groupAdmin", "firstName lastName username avatar")
    .populate("unreadCounts.user", "_id")
    .populate("pinnedBy", "_id")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "username firstName lastName",
      },
    });
};