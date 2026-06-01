import { useEffect } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setActiveConversation,
} from "../features/chat/chatSlice";

import { FaSearch, FaCheck, FaCheckDouble } from "react-icons/fa";

import "../styles/chat.css";

export default function ConversationsList() {
  const dispatch = useDispatch();
  const conversations = useSelector(
    (state) => state.chat.conversations
  );
  const currentUser = useSelector(
    (state) => state.auth.user
  );

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/chats");
        dispatch(setConversations(res.data));
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    };

    fetchConversations();
  }, [dispatch]);

  return (
    <div className="chatsContainer">
      <div className="searchBar">
        <input type="text" placeholder="Search..." />
        <button className="searchButton">
          <FaSearch />
        </button>
      </div>

      <h3>Chats</h3>

      <ul>
        {conversations.map((conv) => {
          const otherUser = conv.participants.find(
            (p) => p._id !== currentUser?._id
          );

          return (
            <li
              key={conv._id}
              onClick={() =>
                dispatch(setActiveConversation(conv))
              }
              className="chatItem"
            >
              <div className="chatAvatar">
                {!otherUser?.avatar ? (
                  <div className="avatarPlaceholder">
                    {otherUser?.firstName?.charAt(0).toUpperCase()}
                    {otherUser?.lastName?.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <img
                    src={otherUser.avatar}
                    alt={`${otherUser.firstName} ${otherUser.lastName}`}
                    className="avatar"
                  />
                )}
              </div>

              <div className="chat-review">
                <div className="chatInfo">
                  {otherUser?.firstName} {otherUser?.lastName}
                  <span className="username-tag">
                    {" "}
                    @{otherUser?.username}
                  </span>
                </div>

                {conv.lastMessage && (
                  <div className="last-message">
                    <span className="last-message-text">
                      <span className="last-message-name">
                        {conv.lastMessage.sender?._id === currentUser?._id
                          ? "You"
                          : `@${conv.lastMessage.sender?.username}`}
                        :
                      </span>{" "}
                      {conv.lastMessage.text}
                    </span>

                    <span className="last-message-time">
                      {conv.lastMessage.sender?._id === currentUser?._id && (
                        <span className="last-message-seen">
                          {conv.lastMessage.seen ? (
                            <FaCheckDouble />
                          ) : (
                            <FaCheck />
                          )}
                        </span>
                      )}

                      {new Date(
                        conv.lastMessage.createdAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}