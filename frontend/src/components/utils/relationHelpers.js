/**
 * يفحص هل otherUser صديق فعلاً بناءً على قايمة friends
 * (بتدعم شكلين من الداتا: FriendRequest object أو Preference/string flat)
 */
export function checkIsAlreadyFriend(otherUserId, currentUser, friendsList) {
  if (!otherUserId) return false;

  return friendsList.some((f) => {
    if (!f) return false;

    if (f.sender && f.receiver) {
      const senderId = f.sender._id || f.sender;
      const receiverId = f.receiver._id || f.receiver;
      const friendId =
        senderId.toString() === currentUser?._id?.toString()
          ? receiverId
          : senderId;
      return friendId.toString() === otherUserId.toString();
    }

    const friendId =
      f.targetUser?._id ||
      f._id ||
      f.user?._id ||
      (typeof f === "string" ? f : null);
    return friendId && friendId.toString() === otherUserId.toString();
  });
}

/** يلاقي طلب صداقة مرسل من المستخدم الحالي لـ otherUser */
export function findSentRequest(otherUser, currentUser, pendingRequests) {
  if (!otherUser || !currentUser) return null;
  return pendingRequests.find((req) => {
    const reqSenderId = (req.sender?._id || req.sender || "").toString();
    const reqReceiverId = (req.receiver?._id || req.receiver || "").toString();
    return (
      reqSenderId === currentUser._id.toString() &&
      reqReceiverId === otherUser._id.toString()
    );
  });
}

/** يلاقي طلب صداقة وارد من otherUser للمستخدم الحالي */
export function findIncomingRequest(otherUser, currentUser, receivedRequests) {
  if (!otherUser || !currentUser) return null;
  return receivedRequests.find((req) => {
    const reqSenderId = (req.sender?._id || req.sender || "").toString();
    const reqReceiverId = (req.receiver?._id || req.receiver || "").toString();
    return (
      reqSenderId === otherUser._id.toString() &&
      reqReceiverId === currentUser._id.toString()
    );
  });
}