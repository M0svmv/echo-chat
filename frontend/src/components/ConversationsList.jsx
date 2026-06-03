import { useEffect } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setActiveConversation,
  updateConversation,
} from "../features/chat/chatSlice";
import socket from "../socket/socket";

import { FaSearch, FaCheck, FaCheckDouble } from "react-icons/fa";

import "../styles/chat.css";

export default function ConversationsList() {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.conversations);
  const currentUser = useSelector((state) => state.auth.user);

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

  // ✅ real-time conversations
  useEffect(() => {
    socket.on("conversationUpdated", (updatedConv) => {
      dispatch(updateConversation(updatedConv));
    });

    return () => {
      socket.off("conversationUpdated");
    };
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
      <div className="chat-items-container">
        <ul>
          {conversations.map((conv) => {
            const otherUser = conv.participants.find(
              (p) => p._id !== currentUser?._id
            );

            // ✅ مقارنة صح بـ _id مش ObjectId مباشرة
            const unreadCount =
              conv.unreadCounts.find(
                (u) => u.user === currentUser?._id || u.user?._id === currentUser?._id
              )?.count || 0;

            return (
              <li
                key={conv._id}
                onClick={() => dispatch(setActiveConversation(conv))}
                className="chatItem"
              >
                <div className="notifications-badge">
                  {unreadCount > 0 && (
                    <span className="badge">{unreadCount}</span>
                  )}
                </div>

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
    </div>
  );
}