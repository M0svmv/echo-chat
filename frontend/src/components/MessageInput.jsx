import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import api from "../api/axios";
import { addMessage } from "../features/chat/chatSlice";

import '../styles/messageInput.css';

export default function MessageInput() {
  const dispatch = useDispatch();

  const [text, setText] = useState("");

  const activeConversation = useSelector(
    (state) => state.chat.activeConversation
  );

  const user = useSelector(
    (state) => state.auth.user
  );

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
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="message-input-container"
      
    >
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      />

      <button
        onClick={sendMessage}
        style={{
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
}