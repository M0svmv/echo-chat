import { useState, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import api from "../api/axios";
import { addMessage } from "../features/chat/chatSlice";

import '../styles/messageInput.css';

import { IoPaperPlaneOutline }  from "react-icons/io5" ;

import { FaPaperclip } from "react-icons/fa6";

export default function MessageInput() {

  const textareaRef = useRef(null);

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
  const dispatch = useDispatch();

  const [text, setText] = useState("");

  const activeConversation = useSelector(
    (state) => state.chat.activeConversation
  );

  const user = useSelector(
    (state) => state.auth.user
  );

  if (!activeConversation) return;

  const sendMessage = async () => {
    try {
      if (!activeConversation) return;

      if (!text.trim()) return;

      const receiver = activeConversation.participants.find(
        (participant) => participant._id !== user._id
      );

      if (!receiver) {
        console.error("Receiver not found");
        return;
      }

      const response = await api.post("/messages", {
        conversationId: activeConversation._id,
        text,
        receiverId: receiver._id,
      });

      dispatch(addMessage(response.data));

      setText("");
    } catch (error) {
      console.error("Send Message Error:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;

  if (e.shiftKey) return;

  e.preventDefault();
  sendMessage();
  };

  return (
    <div className="message-input-container"
      
    >
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

      <button className="message-send-button"
        onClick={sendMessage}
        
      >
        <IoPaperPlaneOutline />
      </button>
    </div>
  );
}