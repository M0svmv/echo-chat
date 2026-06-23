
exports.emitToParticipants = ({
  req,
  participants,
  eventName,
  data,
  skipUserId = null,
}) => {
  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");

  if (!io || !onlineUsers) return;

  participants.forEach((participantId) => {
    const pIdStr = participantId.toString();

    if (skipUserId && pIdStr === skipUserId.toString()) return;

    const socketId = onlineUsers.get(pIdStr);

    if (socketId) {
      io.to(socketId).emit(eventName, data);
    }
  });
};

exports.emitToUser = ({
  req,
  userId,
  eventName,
  data,
}) => {
  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");

  if (!io || !onlineUsers) return;

  const socketId = onlineUsers.get(userId.toString());

  if (!socketId) return;

  io.to(socketId).emit(eventName, data);
};
