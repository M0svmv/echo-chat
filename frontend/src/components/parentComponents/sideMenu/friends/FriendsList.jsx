import { useEffect, useState } from "react";
import api from "../../../../api/axios";
import { useDispatch, useSelector } from "react-redux";
import { setFriends, setActiveConversation } from "../../../../features/chat/chatSlice";

import { FaUserFriends, FaStar, FaBan } from "react-icons/fa";

import Avatar from "../children/Avatar";
import SidebarSearchBar from "../children/SidebarSearchBar";
import EmptyState from "../../../shared/EmptyState";
import MoreOptionsButton from "../children/MoreOptionsButton";
import FriendsDropdownMenu from "../children/FriendsDropdownMenu";

import useSearchFilter from "../../../hooks/useSearchFilter";
import useListDropdown from "../../../hooks/useListDropdown";

export default function FriendsList() {
  const dispatch = useDispatch();
  const friends = useSelector((state) => state.chat.friends);
  const currentUser = useSelector((state) => state.auth.user);

  const { searchQuery, setSearchQuery, activeSearch, setActiveSearch, handleSearch, handleClear, handleKeyDown } =
    useSearchFilter();
  const { openMenuId, menuRef, toggleMenu, closeMenu } = useListDropdown();

  // الفلتر النشط حالياً: 'all' | 'close' | 'blocked'
  const [activeTab, setActiveTab] = useState("all");

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
    closeMenu();
  };

  // حذف صديق
  const handleRemoveFriend = async (e, friend) => {
    e.stopPropagation();
    const friendId = friend._id;
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    try {
      await api.delete("/friends/remove", { data: { friendId } });
      dispatch(setFriends(friends.filter((f) => f._id !== friendId)));
      closeMenu();
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

      const uniqueId = friend.requestId || friend._id;
      dispatch(setFriends(friends.filter((f) => (f.requestId || f._id) !== uniqueId)));

      closeMenu();

      if (type === "block") alert("User blocked successfully");
      else if (type === "unblock") alert("User unblocked successfully");
      else alert("Added to close friends");
    } catch (err) {
      console.error(`Failed to perform preference action (${type}):`, err);
      alert(err.response?.data?.message || "Action failed");
    }
  };

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

    const userObj = activeTab === "close" || activeTab === "blocked" ? item.targetUser : item;
    if (!userObj) return false;

    const fullName = `${userObj.firstName || ""} ${userObj.lastName || ""}`.toLowerCase();
    const username = userObj.username?.toLowerCase() || "";
    const query = activeSearch.toLowerCase();

    return fullName.includes(query) || username.includes(query);
  });

  return (
    <div className="chatsContainer">
      <SidebarSearchBar
        placeholder="Search..."
        searchQuery={searchQuery}
        onChange={setSearchQuery}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        onSearch={handleSearch}
      />

      {/* أزرار الفلاتر */}
      <div style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
        <button
          onClick={() => setActiveTab("all")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            background: activeTab === "all" ? "#007bff" : "#e4e6eb",
            color: activeTab === "all" ? "#fff" : "#000",
          }}
        >
          <FaUserFriends size={14} /> All
        </button>
        <button
          onClick={() => setActiveTab("close")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            background: activeTab === "close" ? "#28a745" : "#e4e6eb",
            color: activeTab === "close" ? "#fff" : "#000",
          }}
        >
          <FaStar size={14} /> Close Friends
        </button>
        <button
          onClick={() => setActiveTab("blocked")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            background: activeTab === "blocked" ? "#dc3545" : "#e4e6eb",
            color: activeTab === "blocked" ? "#fff" : "#000",
          }}
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
              const actualUser =
                activeTab === "close" || activeTab === "blocked" ? item.targetUser : item;
              const uniqueId = item.requestId || item._id;

              if (!actualUser) return null;

              return (
                <li key={uniqueId} className="chatItem">
                  <Avatar
                    image={actualUser.avatar}
                    firstName={actualUser.firstName}
                    lastName={actualUser.lastName}
                  />

                  <div className="chat-review">
                    <div className="chatInfo">
                      {actualUser.firstName} {actualUser.lastName}
                      <span className="username-tag"> @{actualUser.username}</span>
                    </div>
                  </div>

                  <MoreOptionsButton
                    menuRef={menuRef}
                    isOpen={openMenuId === uniqueId}
                    onToggle={(e) => toggleMenu(e, uniqueId)}
                  >
                    <FriendsDropdownMenu
                      activeTab={activeTab}
                      onStartConversation={(e) => handleStartConversation(e, item)}
                      onMakeCloseFriend={(e) => handleMakePreference(e, item, "close_friend")}
                      onRemoveFriend={(e) => handleRemoveFriend(e, item)}
                      onBlock={(e) => handleMakePreference(e, item, "block")}
                      onUnblock={(e) => handleMakePreference(e, item, "unblock")}
                    />
                  </MoreOptionsButton>
                </li>
              );
            })
          ) : (
            <EmptyState
              message={
                activeTab === "all"
                  ? "No friends found"
                  : activeTab === "close"
                    ? "No close friends found"
                    : "No blocked users found"
              }
            />
          )}
        </ul>
      </div>
    </div>
  );
}