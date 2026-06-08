import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setFriends,
  setActiveConversation,
} from "../features/chat/chatSlice";

import { FaSearch, FaUserFriends, FaStar, FaBan, FaUserMinus, FaCheckCircle } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";
import { FiMoreVertical, FiMessageSquare } from "react-icons/fi";

export default function FriendsList() {
  const dispatch = useDispatch();
  const friends = useSelector((state) => state.chat.friends);
  const currentUser = useSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // الفلتر النشط حالياً: 'all' | 'close' | 'blocked'
  const [activeTab, setActiveTab] = useState("all"); 
  
  const menuRef = useRef(null);

  // بدء محادثة
  const handleStartConversation = async (e, friend) => {
    e.stopPropagation();
    try {
      const friendId = friend.targetUser?._id || friend._id;
      const res = await api.get(`/chats/${friendId}`);
      dispatch(setActiveConversation(res.data));
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
    setOpenMenuId(null);
  };

  // حذف صديق
  const handleRemoveFriend = async (e, friend) => {
    e.stopPropagation();
    const friendId = friend._id;
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    try {
      await api.delete("/friends/remove", { data: { friendId } });
      dispatch(setFriends(friends.filter((f) => f._id !== friendId)));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  // إدارة التفضيلات (حظر - مقربين - إلغاء حظر)
  const handleMakePreference = async (e, friend, type) => {
    e.stopPropagation();
    const targetUserId = friend.targetUser?._id || friend._id; 
    
    if (type === "block" && !window.confirm("Are you sure you want to block this user?")) return;
    if (type === "unblock" && !window.confirm("Are you sure you want to unblock this user?")) return;

    try {
      await api.post("/friends/preference", { type, targetUserId });
      
      // ✅ تحديث الحالة المحلية لحذف الشخص من القائمة النشطة فوراً
      const uniqueId = friend.requestId || friend._id;
      dispatch(setFriends(friends.filter((f) => (f.requestId || f._id) !== uniqueId)));
      
      setOpenMenuId(null);
      
      // رسالة تنبيه للمستخدم بحسب العملية
      if (type === "block") alert("User blocked successfully");
      else if (type === "unblock") alert("User unblocked successfully");
      else alert("Added to close friends");

    } catch (err) {
      console.error(`Failed to perform preference action (${type}):`, err);
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const toggleMenu = (e, uniqueId) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === uniqueId ? null : uniqueId));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // جلب البيانات عند تغيير التبويب النشط (Tab)
  useEffect(() => {
    const fetchData = async () => {
      try {
        let endpoint = "/friends/all";
        if (activeTab === "close") endpoint = "/friends/close-friends";
        if (activeTab === "blocked") endpoint = "/friends/blocked";

        const res = await api.get(endpoint);
        dispatch(setFriends(res.data));
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
    setSearchQuery("");
    setActiveSearch("");
  }, [activeTab, dispatch]);

  // الفلترة النصية
  const filteredFriends = friends.filter((item) => {
    if (!activeSearch) return true;
    
    const userObj = (activeTab === "close" || activeTab === "blocked") ? item.targetUser : item;
    if (!userObj) return false;

    const fullName = `${userObj.firstName || ""} ${userObj.lastName || ""}`.toLowerCase();
    const username = userObj.username?.toLowerCase() || "";
    const query = activeSearch.toLowerCase();

    return fullName.includes(query) || username.includes(query);
  });

  return (
    <div className="chatsContainer">
      {/* سيكشن البحث */}
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

      {/* أزرار الفلاتر */}
      <div style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
        <button 
          onClick={() => setActiveTab("all")} 
          style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", border: "none", borderRadius: "20px", cursor: "pointer", background: activeTab === "all" ? "#007bff" : "#e4e6eb", color: activeTab === "all" ? "#fff" : "#000" }}
        >
          <FaUserFriends size={14} /> All
        </button>
        <button 
          onClick={() => setActiveTab("close")} 
          style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", border: "none", borderRadius: "20px", cursor: "pointer", background: activeTab === "close" ? "#28a745" : "#e4e6eb", color: activeTab === "close" ? "#fff" : "#000" }}
        >
          <FaStar size={14} /> Close Friends
        </button>
        <button 
          onClick={() => setActiveTab("blocked")} 
          style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", border: "none", borderRadius: "20px", cursor: "pointer", background: activeTab === "blocked" ? "#dc3545" : "#e4e6eb", color: activeTab === "blocked" ? "#fff" : "#000" }}
        >
          <FaBan size={14} /> Blocked
        </button>
      </div>

      <h3>
        {activeTab === "all" && "Friends"}
        {activeTab === "close" && "Close Friends"}
        {activeTab === "blocked" && "Blocked Users"}
      </h3>

      {/* عرض القائمة */}
      <div className="chat-items-container">
        <ul>
          {filteredFriends.length > 0 ? (
            filteredFriends.map((item) => {
              const actualUser = (activeTab === "close" || activeTab === "blocked") ? item.targetUser : item;
              const uniqueId = item.requestId || item._id;

              if (!actualUser) return null;

              return (
                <li key={uniqueId} className="chatItem">
                  
                  <div className={actualUser?.avatar ? "chatAvatar avatar-bg" : "chatAvatar"}>
                    {!actualUser.avatar ? (
                      <div className="avatarPlaceholder">
                        {actualUser.firstName?.charAt(0).toUpperCase()}
                        {actualUser.lastName?.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <img
                        src={actualUser.avatar}
                        alt={`${actualUser.firstName} ${actualUser.lastName}`}
                        className="avatar"
                      />
                    )}
                  </div>

                  <div className="chat-review">
                    <div className="chatInfo">
                      {actualUser.firstName} {actualUser.lastName}
                      <span className="username-tag"> @{actualUser.username}</span>
                    </div>
                  </div>

                  <div
                    className="conv-more-options"
                    ref={openMenuId === uniqueId ? menuRef : null}
                  >
                    <button
                      className="conv-more-btn"
                      onClick={(e) => toggleMenu(e, uniqueId)}
                    >
                      <FiMoreVertical />
                    </button>

                    {openMenuId === uniqueId && (
                      <div className="dropdown-menu conv-dropdown">
                        
                        {/* 1. خيار بدء محادثة: يختفي تماماً في تبويب الحظر */}
                        {activeTab !== "blocked" && (
                          <button
                            className="conv-dropdown-item"
                            onClick={(e) => handleStartConversation(e, item)}
                          >
                            <FiMessageSquare />
                            <span> Start Conversation</span>
                          </button>
                        )}

                        {/* 2. خيار إضافة للمقربين: متاح في تبويب الأصدقاء فقط */}
                        {activeTab === "all" && (
                          <button
                            className="conv-dropdown-item"
                            onClick={(e) => handleMakePreference(e, item, "close_friend")}
                          >
                            <FaStar style={{ color: "#ffc107" }} />
                            <span> Close Friend</span>
                          </button>
                        )}

                        {/* 3. خيار حذف صديق */}
                        {activeTab === "all" && (
                          <button
                            className="conv-dropdown-item"
                            onClick={(e) => handleRemoveFriend(e, item)}
                            style={{ color: "#dc3545" }}
                          >
                            <FaUserMinus />
                            <span> Remove Friend</span>
                          </button>
                        )}

                        {/* 4. خيار الحظر (Block): يظهر في كل الحالات ما عدا تبويب المحظورين */}
                        {activeTab !== "blocked" && (
                          <button
                            className="conv-dropdown-item"
                            onClick={(e) => handleMakePreference(e, item, "block")}
                            style={{ color: "#dc3545" }}
                          >
                            <FaBan />
                            <span> Block</span>
                          </button>
                        )}

                        {/* 🔥 5. خيار إلغاء الحظر (Unblock): يظهر فقط عندما نكون داخل قائمة المحظورين باللون الأخضر */}
                        {activeTab === "blocked" && (
                          <button
                            className="conv-dropdown-item"
                            onClick={(e) => handleMakePreference(e, item, "unblock")}
                            style={{ color: "#28a745" }}
                          >
                            <FaCheckCircle />
                            <span> Unblock</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </li>
              );
            })
          ) : (
            <div className="no-results">
              {activeTab === "all" && "No friends found"}
              {activeTab === "close" && "No close friends found"}
              {activeTab === "blocked" && "No blocked users found"}
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}