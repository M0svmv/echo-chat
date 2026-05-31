import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../api/axios";

import { setMessages } from "../features/chat/chatSlice";

export default function MessagesList() {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat.messages);
  const active = useSelector((state) => state.chat.activeConversation);

  // ✅ جيب الـ messages من الـ DB لما الـ conversation تتغير
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
  }, [active?._id]);

  // ✅ اسمع على الـ messages الجاية من الـ socket
  

  if (!active) return <div>Select a chat</div>;

  return (
    <div style={{ flex: 1, padding: 10 }}>
      {messages.map((msg) => (
        <div key={msg._id}>
          <b>{msg.sender?.username ?? msg.sender}</b>: {msg.text}
        </div>
      ))}
    </div>
  );
}