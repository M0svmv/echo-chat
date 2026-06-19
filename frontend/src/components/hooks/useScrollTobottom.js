import { useRef, useState, useEffect } from "react";
import api from "../../api/axios";
import { setMessages } from "../../features/chat/chatSlice";

/**
 * هوك مسؤول عن:
 * - جلب رسايل المحادثة النشطة من السيرفر
 * - تتبع وضعية السكرول (في القاعدة ولا لأ)
 * - السكرول التلقائي لآخر الرسايل عند فتح محادثة جديدة أو وصول رسالة جديدة
 */
export default function useScrollToBottom({ active, dispatch, messages }) {
  const messagesRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // جلب الرسايل عند تغيير المحادثة النشطة
  useEffect(() => {
    if (!active) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${active._id}`);
        dispatch(setMessages(res.data));
      } catch (error) {
        console.error("Fetch Messages Error:", error);
      }
    };
    fetchMessages();
  }, [active?._id, dispatch]);

  // مراقبة موضع السكرول لمعرفة هل المستخدم في القاعدة
  useEffect(() => {
    if (!active || !messagesRef.current) return;
    const container = messagesRef.current;
    const handleScroll = () => {
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      setIsAtBottom(atBottom);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [active]);

  // سكرول فوري لآخر الرسايل عند فتح محادثة جديدة
  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [active?._id]);

  // سكرول تلقائي عند وصول رسالة جديدة لو المستخدم أصلاً في القاعدة
  useEffect(() => {
    if (!messagesRef.current) return;
    if (isAtBottom) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  return { messagesRef, isAtBottom };
}