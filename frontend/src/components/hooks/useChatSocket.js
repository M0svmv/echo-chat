import { useEffect } from "react";
import socket from "../../socket/socket";
import {
  addMessage,
  updateEditedMessage,
  updateMessageReactions,
  deleteMessage,
  markMessagesSeen,
  removeConversation,
} from "../../features/chat/chatSlice";

/**
 * هوك مسؤول عن كل اشتراكات الـ socket.io المرتبطة بالمحادثة النشطة:
 * - استقبال رسالة جديدة
 * - تعديل رسالة
 * - تفاعل/ريأكشن على رسالة
 * - حذف رسالة
 * - تحديث حالة "تمت المشاهدة"
 * - أرشفة المحادثة (لو حصلت من جهاز تاني)
 */
export default function useChatSockets({ active, currentUser, dispatch, setShowDropdown }) {
  // إشعار السيرفر إن المستخدم شايف المحادثة
  useEffect(() => {
    if (!active) return;
    socket.emit("markAsSeen", {
      conversationId: active._id,
      userId: currentUser?._id,
    });
  }, [active?._id, currentUser?._id]);

  // الرسايل الجديدة + التعديل + الريأكشن + الحذف
  useEffect(() => {
    if (!active) return;

    socket.on("newMessage", (msg) => {
      if (msg.conversationId === active._id) {
        dispatch(addMessage({ message: msg, currentUserId: currentUser?._id }));
        socket.emit("markAsSeen", {
          conversationId: active._id,
          userId: currentUser?._id,
        });
      }
    });

    socket.on("messageEdited", (data) => {
      if (data.conversationId === active._id) {
        dispatch(updateEditedMessage(data));
      }
    });

    socket.on("messageReactionUpdated", (data) => {
      if (data.conversationId === active._id) {
        dispatch(updateMessageReactions(data));
      }
    });

    socket.on("messageDeleted", ({ messageId, conversationId }) => {
      if (conversationId === active._id) {
        dispatch(deleteMessage(messageId));
      }
    });

    return () => {
      socket.off("newMessage");
      socket.off("messageEdited");
      socket.off("messageReactionUpdated");
      socket.off("messageDeleted");
    };
  }, [active?._id, currentUser?._id, dispatch]);

  // تحديث حالة "تمت المشاهدة" للرسايل
  useEffect(() => {
    socket.on("messagesSeen", (data) => {
      if (active && data.conversationId === active._id) {
        dispatch(markMessagesSeen(data));
      }
    });
    return () => socket.off("messagesSeen");
  }, [active?._id, dispatch]);

  // أرشفة المحادثة من جهاز/تبويب تاني
  useEffect(() => {
    socket.on("conversationArchived", ({ conversationId }) => {
      if (active && conversationId === active._id) {
        dispatch(removeConversation(conversationId));
        setShowDropdown(false);
      }
    });
    return () => socket.off("conversationArchived");
  }, [active?._id, dispatch]);
}