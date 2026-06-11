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

    // ===== تحديث دالة إضافة الرسالة لمنع التكرار ودعم الـ Optimistic UI =====
    addMessage: (state, action) => {
      // دعم استقبال الرسالة سواء مبعوتة كـ Object صريح أو مدمج مع الـ currentUserId
      const payloadData = action.payload?.message ? action.payload : { message: action.payload, currentUserId: null };
      const incomingMsg = payloadData.message;
      const currentUserId = payloadData.currentUserId;
      
      let isOptimisticReplace = false;

      // 1. استبدال الرسالة المؤقتة بالرسالة الحقيقية القادمة من الباك إيند
      if (incomingMsg.tempId) {
        const index = state.messages.findIndex((m) => m._id === incomingMsg.tempId);
        if (index !== -1) {
          state.messages[index] = incomingMsg;
          isOptimisticReplace = true;
        }
      }

      if (!isOptimisticReplace) {
        const exists = state.messages.some((m) => m._id === incomingMsg._id);
        if (!exists) {
          state.messages.push(incomingMsg);
        }
      }

      // 2. تحديث السايدبار والعدادات
      const convIndex = state.conversations.findIndex(
        (c) => c._id === incomingMsg.conversationId
      );

      if (convIndex !== -1) {
        state.conversations[convIndex].lastMessage = incomingMsg;
        state.conversations[convIndex].updatedAt = incomingMsg.createdAt || new Date().toISOString();

        // فحص لو أنا مش المرسل (الرسالة جاية من حد تاني)، نزود العداد فوري
        const senderId = incomingMsg.sender?._id || incomingMsg.sender;
        
        // جلب معرف المستخدم الحالي (إما ممرر أو من محادثة الشات النشط)
        const myId = currentUserId || state.activeConversation?.participants?.find(p => (p._id || p) !== senderId)?._id;

        // إذا لم أكن أنا المرسل والمحادثة الحالية مش مفتوحة (أو حتى لو مفتوحة وبنحدث العداد لضمان الزيادة لايف)
        if (myId && senderId !== myId) {
          if (!state.conversations[convIndex].unreadCounts) {
            state.conversations[convIndex].unreadCounts = [];
          }

          const myUnreadObj = state.conversations[convIndex].unreadCounts.find(
            (u) => (u.user?._id || u.user) === myId
          );

          if (myUnreadObj) {
            myUnreadObj.count += 1;
          } else {
            state.conversations[convIndex].unreadCounts.push({ user: myId, count: 1 });
          }
        }

        // ترتيب المحادثات لتظهر الأحدث في الأعلى فوري
        state.conversations.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      }
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
        // حماية العداد: بنحتفظ بالـ unreadCounts اللي موجود حالياً في الفرونت إيند 
        // عشان نمنع السوكت لما ييجي متأخر إنه يصفره أو يمسحه بالقيمة القديمة
        const currentUnreadCounts = state.conversations[index].unreadCounts;

        // تحديث الداتا
        state.conversations[index] = {
          ...state.conversations[index],
          ...updated,
          // لو الـ payload اللي جاي من برة مفيهوش unreadCounts محدث، بنثبت العداد بتاع الفرونت إيند
          unreadCounts: updated.unreadCounts && updated.unreadCounts.length > 0 
            ? updated.unreadCounts 
            : currentUnreadCounts
        };

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