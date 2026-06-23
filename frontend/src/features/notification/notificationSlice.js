import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },

    markAsRead: (state, action) => {
      const id = action.payload;

      const notif = state.items.find((n) => n._id === id);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount -= 1;
      }
    },

    markAllAsRead: (state) => {
      state.items.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },

    setNotifications: (state, action) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter(
        (n) => !n.isRead
      ).length;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  setNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;