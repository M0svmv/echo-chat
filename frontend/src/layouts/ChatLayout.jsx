import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function ChatLayout() {
  return (
    <div className="chat-layout">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}