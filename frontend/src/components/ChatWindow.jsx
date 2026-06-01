import MessagesList from "./MessagesList";
import MessageInput from "./MessageInput";

import "../styles/chatWindow.css";
export default function ChatWindow() {
  return (
    <div className="chatWindow" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <MessagesList />
      <MessageInput />
    </div>
  );
}