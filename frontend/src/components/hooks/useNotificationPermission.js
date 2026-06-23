import { useEffect } from "react";

export  const useNotificationPermission = () => {
  useEffect(() => {
    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);
};