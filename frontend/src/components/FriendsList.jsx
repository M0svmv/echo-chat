import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setFriends,
  setActiveConversation,
} from "../features/chat/chatSlice";

import { FaSearch } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";
import { FiMoreVertical, FiMessageSquare } from "react-icons/fi";

export default function FriendsList() {
  const dispatch = useDispatch();
  const friends = useSelector((state) => state.chat.friends);
  const currentUser = useSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // بدأ محادثة مع فريند عن طريق الـ API
const handleStartConversation = async (e, friend) => {
  e.stopPropagation();
  try {
    const res = await api.get(`/chats/${friend._id}`);
    dispatch(setActiveConversation(res.data));
  } catch (err) {
    console.error("Failed to start conversation:", err);
  }
  setOpenMenuId(null);
};

  const toggleMenu = (e, friendId) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === friendId ? null : friendId));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get("/friends/all");
        dispatch(setFriends(res.data));
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      }
    };
    fetchFriends();
  }, [dispatch]);

  const filteredFriends = friends.filter((friend) => {
    if (!activeSearch) return true;
    const fullName = `${friend.firstName} ${friend.lastName}`.toLowerCase();
    const username = friend.username?.toLowerCase() || "";
    return fullName.includes(activeSearch.toLowerCase())
      || username.includes(activeSearch.toLowerCase());
  });

  return (
    <div className="chatsContainer">
      <div className="searchBar">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setActiveSearch(searchQuery); }}
        />
        {searchQuery && (
          <button className="clearButton" onClick={() => { setSearchQuery(""); setActiveSearch(""); }}>
            <IoCloseCircle />
          </button>
        )}
        <button className="searchButton" onClick={() => setActiveSearch(searchQuery)}>
          <FaSearch />
        </button>
      </div>

      <h3>Friends</h3>
      <div className="chat-items-container">
        <ul>
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <li key={friend.requestId} className="chatItem">

                <div className={friend?.avatar ? "chatAvatar avatar-bg" : "chatAvatar"}>
                  {!friend.avatar ? (
                    <div className="avatarPlaceholder">
                      {friend.firstName?.charAt(0).toUpperCase()}
                      {friend.lastName?.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <img
                      src={friend.avatar}
                      alt={`${friend.firstName} ${friend.lastName}`}
                      className="avatar"
                    />
                  )}
                </div>

                <div className="chat-review">
                  <div className="chatInfo">
                    {friend.firstName} {friend.lastName}
                    <span className="username-tag"> @{friend.username}</span>
                  </div>
                </div>

                <div
                  className="conv-more-options"
                  ref={openMenuId === friend.requestId ? menuRef : null}
                >
                  <button
                    className="conv-more-btn"
                    onClick={(e) => toggleMenu(e, friend.requestId)}
                  >
                    <FiMoreVertical />
                  </button>

                  {openMenuId === friend.requestId && (
                    <div className="dropdown-menu conv-dropdown">
                      <button
                        className="conv-dropdown-item"
                        onClick={(e) => handleStartConversation(e, friend)}
                      >
                        <FiMessageSquare />
                        <span> Start Conversation</span>
                      </button>
                    </div>
                  )}
                </div>

              </li>
            ))
          ) : (
            <div className="no-results">No friends found</div>
          )}
        </ul>
      </div>
    </div>
  );
}