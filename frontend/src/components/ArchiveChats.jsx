import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setActiveConversation,
  updateConversation,
  removeConversation,
} from "../features/chat/chatSlice";
import socket from "../socket/socket";

import { FaSearch, FaCheck, FaCheckDouble, FaUsers } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";
import { FiMoreVertical, FiArchive } from "react-icons/fi";

import "../styles/chat.css";

export default function ArchiveChats() {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.conversations);
  const currentUser = useSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  const handleSearch = () => setActiveSearch(searchQuery);

  const handleClear = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  const handleArchive = (e, conversationId) => {
    e.stopPropagation();
    socket.emit("archiveConversation", {
      conversationId,
      userId: currentUser?._id,
    });
    setOpenMenuId(null);
  };

  const toggleMenu = (e, convId) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === convId ? null : convId));
  };

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // الفلترة الذكية تدعم البحث باسم الشخص أو اسم الجروب
  const filteredConversations = conversations.filter((conv) => {
    if (!activeSearch) return true;
    const query = activeSearch.toLowerCase();

    if (conv.isGroup) {
      return conv.groupName?.toLowerCase().includes(query);
    } else {
      const otherUser = conv.participants?.find((p) => (p._id || p) !== currentUser?._id);
      const fullName = `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.toLowerCase();
      const username = otherUser?.username?.toLowerCase() || "";
      return fullName.includes(query) || username.includes(query);
    }
  });

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/chats/archive");
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
    return () => socket.off("conversationUpdated");
  }, [dispatch]);

  useEffect(() => {
    socket.on("conversationArchived", ({ conversationId, isArchived }) => {
      if (!isArchived) {
        dispatch(removeConversation(conversationId));
      }
    });
    return () => socket.off("conversationArchived");
  }, [dispatch]);

  return (
    <div className="chatsContainer">
      <div className="searchBar">
        <input
          type="text"
          placeholder="Search archived chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        />
        {searchQuery && (
          <button className="clearButton" onClick={handleClear}>
            <IoCloseCircle />
          </button>
        )}
        <button className="searchButton" onClick={handleSearch}>
          <FaSearch />
        </button>
      </div>

      <h3>Archived Chats</h3>
      <div className="chat-items-container">
        <ul>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              // تحديد بيانات العرض بناءً على نوع المحادثة (شخصية أم جروب)
              const isGroup = conv.isGroup;
              const otherUser = !isGroup ? conv.participants?.find((p) => (p._id || p) !== currentUser?._id) : null;
              
              const chatTitle = isGroup ? conv.groupName : `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`;
              const chatAvatar = isGroup ? conv.groupImage : otherUser?.avatar;
              const avatarLetter = isGroup ? conv.groupName?.charAt(0).toUpperCase() : otherUser?.firstName?.charAt(0).toUpperCase();

              const unreadCount = conv.unreadCounts?.find(
                (u) => (u.user?._id || u.user) === currentUser?._id
              )?.count || 0;

              return (
                <li
                  key={conv._id}
                  onClick={() => dispatch(setActiveConversation(conv))}
                  className="chatItem"
                >
                  <div className="notifications-badge">
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                  </div>

                  {/* رندرة الآفاتار بحسب الحالة */}
                  <div className={chatAvatar ? "chatAvatar avatar-bg" : "chatAvatar"}>
                    {!chatAvatar ? (
                      <div className="avatarPlaceholder">
                        {isGroup ? <FaUsers size={16} /> : avatarLetter}
                      </div>
                    ) : (
                      <img
                        src={chatAvatar}
                        alt={chatTitle}
                        className="avatar"
                      />
                    )}
                  </div>

                  <div className="chat-review">
                    <div className="chatInfo">
                      {chatTitle}
                      {!isGroup && otherUser?.username && (
                        <span className="username-tag"> @{otherUser.username}</span>
                      )}
                      {isGroup && (
                        <span className="username-tag" style={{ background: "#e0e0e0", padding: "2px 6px", borderRadius: "10px", fontSize: "10px" }}>
                          Group
                        </span>
                      )}
                    </div>

                    {conv.lastMessage && (
                      <div className="last-message">
                        <span className="last-message-text">
                          <span className="last-message-name">
                            {String(conv.lastMessage.sender?._id || conv.lastMessage.sender) === String(currentUser?._id)
                              ? "You"
                              : conv.lastMessage.sender?.firstName || `@${conv.lastMessage.sender?.username || "user"}`}:
                          </span>{" "}
                          {conv.lastMessage.text}
                        </span>
                        <span className="last-message-time">
                          {String(conv.lastMessage.sender?._id || conv.lastMessage.sender) === String(currentUser?._id) && (
                            <span className="last-message-seen">
                              {conv.lastMessage.seen ? <FaCheckDouble /> : <FaCheck />}
                            </span>
                          )}
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* الـ Dropdown Menu المصلح برمجياً لـ ESLint */}
                  <div
                    className="conv-more-options"
                    ref={openMenuId === conv._id ? menuRef : null}
                  >
                    <button
                      className="conv-more-btn"
                      onClick={(e) => toggleMenu(e, conv._id)}
                      title="More options"
                    >
                      <FiMoreVertical />
                    </button>

                    {openMenuId === conv._id && (
                      <div className="dropdown-menu conv-dropdown">
                        <button
                          className="conv-dropdown-item"
                          onClick={(e) => handleArchive(e, conv._id)}
                        >
                          <FiArchive />
                          <span> Unarchive Chat</span>
                        </button>
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