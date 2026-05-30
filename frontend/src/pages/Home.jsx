import { useEffect } from "react";
import ConversationsList from "../components/ConversationsList";
import MessagesList from "../components/MessagesList";
import MessageInput from "../components/MessageInput";

import socket  from "../socket/socket";
import { useDispatch } from "react-redux";
import { addMessage } from "../features/chat/chatSlice";

export default function Chat() {
  const dispatch = useDispatch();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("newMessage", (data) => {
      dispatch(addMessage(data.message));
    });

    return () => {
      socket.off("newMessage");
    };
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <ConversationsList />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <MessagesList />
        <MessageInput />
      </div>
    </div>
  );
}