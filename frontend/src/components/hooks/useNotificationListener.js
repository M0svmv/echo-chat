import { useEffect } from "react";
import { socket } from "../../socket/socket";

export const useNotificationListener = (onNewNotification) => {
  useEffect(() => {
    if (!socket) return;

    socket.on("newNotification", (notification) => {
      onNewNotification(notification);
    });

    return () => {
      socket.off("newNotification");
    };
  }, [onNewNotification]);
};