const Notification = require("../../../models/notification.model");
const User = require("../../../models/user.model");
const socketUtil = require("../utils/socket.utils");


exports.createNotification = async ({
  sender,
  recipient,
  type,
  title,
  body,
  data = {},
}) => {
  const notification = await Notification.create({
    sender,
    recipient,
    type,
    title,
    body,
    data,
    isRead: false,
  });

  return notification.populate(
    "sender",
    "username firstName lastName avatar"
  );
};