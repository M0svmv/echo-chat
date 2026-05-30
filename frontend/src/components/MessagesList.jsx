import { useSelector } from "react-redux";

export default function MessagesList() {
  const messages = useSelector((state) => state.chat.messages);
  const active = useSelector(
    (state) => state.chat.activeConversation
  );

  if (!active) return <div>Select a chat</div>;

  return (
    <div style={{ flex: 1, padding: 10 }}>
      {messages.map((msg) => (
        <div key={msg._id}>
          <b>{msg.sender}</b>: {msg.text}
        </div>
      ))}
    </div>
  );
}