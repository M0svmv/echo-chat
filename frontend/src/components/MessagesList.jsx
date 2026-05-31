import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../api/axios";

import { setMessages } from "../features/chat/chatSlice";

export default function MessagesList() {
  const dispatch = useDispatch();

  const messages = useSelector((state) => state.chat.messages);
  const active = useSelector((state) => state.chat.activeConversation);
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!active) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${active._id}`);
        dispatch(setMessages(res.data));
      } catch (error) {
        console.error("Fetch Messages Error:", error);
      }
    };

    fetchMessages();
  }, [active?._id, dispatch]);

  if (!active) return <div>Select a chat</div>;

  return (
    <div className="chatContainer">
      {messages.map((msg) => {
        const isMine = msg.sender?._id === currentUser?._id;

        return (
          <div
            key={msg._id}
            className={`message ${isMine ? "mine" : "theirs"}`}
          >
            <div className="sender">
              {msg.sender?.username ?? "Unknown"}
            </div>

            <div className="text">{msg.text}</div>
          </div>
        );
      })}
    </div>
  );
}