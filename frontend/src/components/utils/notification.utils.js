export const showBrowserNotification = (notification) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.body,
      icon: "/logo.png",
    });
  }
};