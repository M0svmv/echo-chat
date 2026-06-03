import { useEffect, useState } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setActiveConversation,
  updateConversation,
} from "../features/chat/chatSlice";
import socket from "../socket/socket";

import { FaSearch, FaCheck, FaCheckDouble } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";

import "../styles/chat.css";

export default function ConversationsList() {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.conversations);
  const currentUser = useSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // ✅ السيرش بيشتغل بس لما يدوس Search أو Enter
  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  // ✅ كلير السيرش
  const handleClear = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!activeSearch) return true;

    const otherUser = conv.participants.find(
      (p) => p._id !== currentUser?._id
    );

    const fullName = `${otherUser?.firstName} ${otherUser?.lastName}`.toLowerCase();
    const username = otherUser?.username?.toLowerCase() || "";
    const query = activeSearch.toLowerCase();

    return fullName.includes(query) || username.includes(query);
  });

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
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />

        {/* ✅ زرار الكلير — بيظهر بس لو في نص */}
        {searchQuery && (
          <button className="clearButton" onClick={handleClear}>
            <IoCloseCircle />
          </button>
        )}

        <button className="searchButton" onClick={handleSearch}>
          <FaSearch />
        </button>
      </div>

      <h3>Chats</h3>
      <div className="chat-items-container">
        <ul>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const otherUser = conv.participants.find(
                (p) => p._id !== currentUser?._id
              );

              const unreadCount =
                conv.unreadCounts.find(
                  (u) =>
                    u.user === currentUser?._id ||
                    u.user?._id === currentUser?._id
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
                          {conv.lastMessage.sender?._id ===
                            currentUser?._id && (
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
            })
          ) : (
            <div className="no-results">No conversations found</div>
          )}
        </ul>
      </div>
    </div>
  );
}