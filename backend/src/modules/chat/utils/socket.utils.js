/**
 * إرسال حدث سوكت لجميع المشتركين المتصلين في محادثة معينة
 */
exports.emitToParticipants = ({ req, participants, eventName, data, skipUserId = null }) => {
  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");

  if (!io || !onlineUsers) return;

  participants.forEach((participantId) => {
    const pIdStr = participantId.toString();
    
    // لو حابين نتخطى مستخدم معين (مثل المرسل في بعض الأحداث)
    if (skipUserId && pIdStr === skipUserId.toString()) return;

    const socketId = onlineUsers.get(pIdStr);
    if (socketId) {
      io.to(socketId).emit(eventName, data);
    }
  });
};