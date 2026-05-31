import { useEffect } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setActiveConversation,
} from "../features/chat/chatSlice";

import { FaSearch} from "react-icons/fa"

import '../styles/chat.css';

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
    
    <div className="chatsContainer">
    <div className="searchBar">
      <input type="text" placeholder="Search..." />
      <button className="searchButton"><FaSearch /></button>

    </div>
      <h3>Chats</h3>

    <ul>
      {conversations.map((conv) => (
        
        <li
          key={conv._id}
          onClick={() => dispatch(setActiveConversation(conv))}
          className="chatItem"
        >
        <div className="chatAvatar">
        {!conv.participants[0].avatar? (
            <div className="avatarPlaceholder">
              {conv.participants[0].firstName[0].toUpperCase().slice(0, 1)}
              {conv.participants[0].lastName[0].toUpperCase().slice(0, 1)}
            </div>
          ) : (
            <img
              src={conv.participants[0].avatarUrl}
              alt="Avatar"
              className="avatar"
            />
          )}
        </div>
          {conv.participants.map((p) => `${p.firstName } ${p.lastName}` ).join(", ")}
        </li>
        
      ))}
    </ul>
    </div>
  );
}