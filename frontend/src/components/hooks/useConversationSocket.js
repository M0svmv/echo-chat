import { useEffect } from "react";
import socket from "../../socket/socket";
import { updateConversation, removeConversation } from "../../features/chat/chatSlice";

/**
 * هوك مسؤول عن اشتراكات السوكيت المشتركة بين قوايم المحادثات (الشات الرئيسي،
 * الأرشيف): تحديث بيانات محادثة، وأرشفة/إلغاء أرشفة محادثة.
 *
 * @param {Object} options
 * @param {Function} options.dispatch - دالة الـ redux dispatch
 * @param {"archived"|"active"} options.mode - لو "archived": هيشيل المحادثة من
 *   الليستة لما يحصل لها Unarchive، ولو "active": هيشيلها لما تتأرشف.
 */
export default function useConversationSockets({ dispatch, mode = "active" }) {
  useEffect(() => {
    socket.on("conversationUpdated", (updatedConv) => {
      dispatch(updateConversation(updatedConv));
    });
    return () => socket.off("conversationUpdated");
  }, [dispatch]);

  useEffect(() => {
    socket.on("conversationArchived", ({ conversationId, isArchived }) => {
      const shouldRemove = mode === "active" ? isArchived : !isArchived;
      if (shouldRemove) {
        dispatch(removeConversation(conversationId));
      }
    });
    return () => socket.off("conversationArchived");
  }, [dispatch, mode]);
}