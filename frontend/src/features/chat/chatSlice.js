import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
  messages: [],
  activeConversation: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },

    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },

    markMessagesSeen: (state, action) => {
  const { conversationId, userId } = action.payload;

  state.messages = state.messages.map((msg) =>
    msg.conversationId === conversationId &&
    msg.sender?._id !== userId
      ? { ...msg, seen: true }
      : msg
  );
},

updateConversation: (state, action) => {
  const updated = action.payload;
  const index = state.conversations.findIndex((c) => c._id === updated._id);
  if (index !== -1) {
    state.conversations[index] = updated;
    // ✅ رتب الـ conversations بالأحدث
    state.conversations.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }
},

    setMessages: (state, action) => {
      state.messages = action.payload;
    },

    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
});

export const {
  setConversations,
  setActiveConversation,
    markMessagesSeen,
    updateConversation,
  setMessages,
  addMessage,
} = chatSlice.actions;

export default chatSlice.reducer;