import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { addMessage } from "../features/chat/chatSlice";
import '../styles/messageInput.css';
import { IoPaperPlaneOutline } from "react-icons/io5";
import { FaPaperclip } from "react-icons/fa6";

export default function MessageInput() {
  const textareaRef = useRef(null);
  const dispatch = useDispatch();
  const [text, setText] = useState("");
  const [blockError, setBlockError] = useState("");

  const activeConversation = useSelector(
    (state) => state.chat.activeConversation
  );
  const user = useSelector(
    (state) => state.auth.user
  );

  useEffect(() => {
    setBlockError("");
  }, [activeConversation?._id]);

  if (!activeConversation) return null;

  const handleChange = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleBlur = (e) => {
    if (!text.trim()) {
      e.target.style.height = "var(--avatar-size)";
    }
  };

  const sendMessage = async () => {
    try {
      if (!activeConversation || !text.trim()) return;

      const receiver = activeConversation.participants.find(
        (participant) => participant._id !== user._id
      );

      if (!activeConversation.isGroup && !receiver) return;

      const response = await api.post("/messages", {
        conversationId: activeConversation._id,
        text,
        receiverId: receiver?._id,
      });

      dispatch(addMessage(response.data));
      setText("");
      setBlockError("");
      
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setBlockError(error.response.data.message);
      } else {
        console.error("Send Message Error:", error);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 1. في حالة وجود بلوك: بنستبدل الكونتينر بالكامل بكونتينر البلوك الجديد
  if (blockError) {
    return (
      <div className="message-blocked-container">
        {blockError}
      </div>
    );
  }

  // 2. الحالة الطبيعية: كونتينر الرسائل الأصلي زي ما كان بالظبط
  return (
    <div className="message-input-container">
      <button className="message-attach-button">
        <FaPaperclip />
      </button>
      <textarea
        ref={textareaRef}
        className="message-input"
        placeholder="Type a message..."
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <button className="message-send-button" onClick={sendMessage}>
        <IoPaperPlaneOutline />
      </button>
    </div>
  );
}