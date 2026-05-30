export default function ChatWindow() {
  return (
    <section className="chat-window">
      <div className="chat-header">
        Select a conversation
      </div>

      <div className="messages">
        No chat selected
      </div>

      <div className="message-input">
        <input
          type="text"
          placeholder="Type a message..."
        />

        <button>Send</button>
      </div>
    </section>
  );
}