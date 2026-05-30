import { useEffect } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setActiveConversation,
} from "../features/chat/chatSlice";

export default function ConversationsList() {
  const dispatch = useDispatch();
  const conversations = useSelector(
    (state) => state.chat.conversations
  );

  useEffect(() => {
    const fetchConversations = async () => {
      const res = await api.get("/chats");
      dispatch(setConversations(res.data));
    };

    fetchConversations();
  }, []);

  return (
    <div style={{ width: "30%", borderRight: "1px solid #ccc" }}>
      <h3>Chats</h3>

      {conversations.map((conv) => (
        <div
          key={conv._id}
          onClick={() => dispatch(setActiveConversation(conv))}
          style={{ padding: 10, cursor: "pointer" }}
        >
          {conv.participants.map((p) => p.username).join(", ")}
        </div>
      ))}
    </div>
  );
}