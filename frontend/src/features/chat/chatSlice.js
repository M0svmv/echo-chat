import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
  messages: [],
  friends: [],  
  activeConversation: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setFriends: (state, action) => {
  state.friends = action.payload;
},
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },

    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },

    setMessages: (state, action) => {
      state.messages = action.payload;
    },

    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },

    markMessagesSeen: (state, action) => {
      const { conversationId, userId } = action.payload;
      state.messages = state.messages.map((msg) =>
        msg.conversationId === conversationId && msg.sender?._id !== userId
          ? { ...msg, seen: true }
          : msg
      );
    },

    updateConversation: (state, action) => {
      const { hasNewMessage, ...updated } = action.payload;
      const index = state.conversations.findIndex((c) => c._id === updated._id);
      if (index !== -1) {
        state.conversations[index] = updated;
        if (hasNewMessage) {
          state.conversations.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
        }
      }
    },

    removeConversation: (state, action) => {
      const conversationId = action.payload;
      state.conversations = state.conversations.filter(
        (c) => c._id !== conversationId
      );
      if (state.activeConversation?._id === conversationId) {
        state.activeConversation = null;
      }
    },

    addConversation: (state, action) => {
      const exists = state.conversations.find(
        (c) => c._id === action.payload._id
      );
      if (!exists) {
        state.conversations.unshift(action.payload);
        state.conversations.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      }
    },
  },
});

export const {
  setConversations,
  setActiveConversation,
  markMessagesSeen,
  updateConversation,
  removeConversation,
  addConversation,
  setFriends,
  setMessages,
  addMessage,
} = chatSlice.actions;

export default chatSlice.reducer;