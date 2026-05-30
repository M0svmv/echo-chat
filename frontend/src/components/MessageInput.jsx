import { useState } from "react";
import api from "../api/axios";
import { useSelector } from "react-redux";
import  socket  from "../socket/socket";

export default function MessageInput() {
  const [text, setText] = useState("");
  const active = useSelector(
    (state) => state.chat.activeConversation
  );

  const sendMessage = async () => {
    if (!active || !text) return;

    const receiverId = active.participants.find(
      (p) => p._id !== "MY_USER_ID"
    );

    const res = await api.post("/messages", {
      conversationId: active._id,
      text,
      receiverId: receiverId._id,
    });

    socket.emit("test-message", {
      message: text,
    });

    setText("");
  };

  return (
    <div style={{ display: "flex", padding: 10 }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ flex: 1 }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}