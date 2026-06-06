import { useEffect, useState } from "react";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { setActiveConversation } from "../features/chat/chatSlice";
import {  IoArrowBack } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import "../styles/chat.css"; // أو أي ملف ستايل تفضله

export default function CreateGroup({ onBack }) {
  const dispatch = useDispatch();
  const [friends, setFriends] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. جلب الأصدقاء من الـ API الخاص بك
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get("/friends/all");
        setFriends(res.data);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
        setError("Could not load friends list");
      }
    };
    fetchFriends();
  }, []);

  // 2. اختيار أو إلغاء اختيار صديق
  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  // 3. إرسال الطلب لإنشاء الجروب بالباك إند
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return setError("Please enter a group name");
    if (selectedFriends.length === 0) return setError("Please select at least one friend");

    setLoading(false);
    setError("");

    try {
      const response = await api.post("/chats/group", {
        groupName: groupName.trim(),
        participants: selectedFriends, // مصفوفة الـ IDs للأصدقاء المحددين
      });

      // جعل الجروب المنشأ حديثاً هو النشط تلقائياً والعودة
      dispatch(setActiveConversation(response.data));
      onBack(); 
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err.response?.data?.message || "Failed to create group");
    }
  };

  return (
    <div className="chatsContainer">
      <div className="create-group-header">
        <button className="back-btn" onClick={onBack}>
          <IoArrowBack size={20} />
        </button>
        <h3>Create New Group</h3>
      </div>

      <form onSubmit={handleCreateGroup} className="create-group-form">
        <div className="searchBar">
          <input
            type="text"
            placeholder="Enter group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        {error && <div className="error-message" style={{ color: "red", padding: "5px 10px" }}>{error}</div>}

        <h4 style={{ padding: "10px 0 5px 10px" }}>Select Friends:</h4>
        
        <div className="chat-items-container" style={{ maxHeight: "300px", overflowY: "auto" }}>
          {friends.length > 0 ? (
            <ul>
              {friends.map((friend) => {
                const isChecked = selectedFriends.includes(friend._id);
                return (
                  <li
                    key={friend._id}
                    className={`chatItem ${isChecked ? "selectedFriend" : ""}`}
                    onClick={() => toggleFriend(friend._id)}
                    style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="avatarPlaceholder">
                        {friend.firstName?.charAt(0).toUpperCase()}
                        {friend.lastName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="chatInfo">
                        {friend.firstName} {friend.lastName}
                        <span className="username-tag"> @{friend.username}</span>
                      </div>
                    </div>
                    
                    <div className={`checkbox-indicator ${isChecked ? "checked" : ""}`} style={{
                      width: "20px", height: "20px", border: "2px solid #ccc", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      backgroundColor: isChecked ? "#007bff" : "transparent"
                    }}>
                      {isChecked && <FaCheck size={10} color="white" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="no-results">No friends available to add</div>
          )}
        </div>

        <button 
          type="submit" 
          className="searchButton" 
          disabled={loading}
          style={{ width: "90%", margin: "15px auto", display: "block", borderRadius: "8px", padding: "10px", float: "none", background: "#007bff", color: "white" }}
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
      </form>
    </div>
  );
}