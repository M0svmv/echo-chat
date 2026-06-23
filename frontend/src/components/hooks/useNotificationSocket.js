import { useEffect } from "react";
import  socket  from "../../socket/socket";
import { useDispatch } from "react-redux";
import { addNotification } from "../../features/notification/notificationSlice";
import { showBrowserNotification } from "../utils/notification.utils";

export const useNotificationSocket = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket) return;

    socket.on("newNotification", (notification) => {
      dispatch(addNotification(notification));

      showBrowserNotification(notification);
    });

    return () => {
      socket.off("newNotification");
    };
  }, [dispatch]);
};