const socketUtil = require("../utils/socket.utils");

exports.emitNotification = ({ req, notification }) => {
  socketUtil.emitToUser({
    req,
    userId: notification.recipient,
    eventName: "newNotification",
    data: notification,
  });
};