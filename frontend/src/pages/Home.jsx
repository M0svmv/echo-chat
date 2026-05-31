import { useEffect } from "react";
// import ConversationsList from "../components/ConversationsList";
import MessagesList from "../components/MessagesList";
import MessageInput from "../components/MessageInput";

import Sidebar from "../components/Sidebar";

import socket from "../socket/socket";
import { useDispatch, useSelector } from "react-redux";
import { addMessage } from "../features/chat/chatSlice";

export default function Chat() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return;

    // ✅ كونكت الـ socket وسجل اليوزر أونلاين
    socket.connect();
    socket.emit("addUser", user._id);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    // ✅ "receiveMessage" مش "newMessage" — لازم يتطابق مع السيرفر
    socket.on("receiveMessage", (message) => {
  if (message.sender._id !== user._id) {
    dispatch(addMessage(message));
  }
});

    return () => {
      socket.off("connect");
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [user?._id]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <MessagesList />
        <MessageInput />
      </div>
    </div>
  );
}