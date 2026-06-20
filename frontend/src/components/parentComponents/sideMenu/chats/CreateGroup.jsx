import { useEffect, useState, memo } from "react"; // 👈 ضفنا memo هنا
import api from "../../../../api/axios";
import { useDispatch } from "react-redux";
import { setActiveConversation } from "../../../../features/chat/chatSlice";
import { IoArrowBack } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import "../../../styles/chat.css";

// 👈 مكون الأفتار الذكي لعرض صور المستخدمين أو الحرف الأول
const MemberAvatar = memo(({ avatar, name }) => {
  return (
    <div className="chatAvatar">
      {avatar ? (
        <img src={avatar} alt={name} className="avatar" loading="lazy" />
      ) : (
        <div className="avatarPlaceholder">{name?.charAt(0).toUpperCase()}</div>
      )}
    </div>
  );
});
MemberAvatar.displayName = "MemberAvatar";

export default function CreateGroup({ onBack }) {
  const dispatch = useDispatch();
  const [friends, setFriends] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. جلب الأصدقاء من الـ API
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

    setLoading(true); 
    setError("");

    try {
      const response = await api.post("/chats/group", {
        groupName: groupName.trim(),
        participants: selectedFriends,
      });

      // جعل الجروب المنشأ حديثاً هو النشط تلقائياً والعودة
      dispatch(setActiveConversation(response.data));
      onBack(); 
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatsContainer">
      <div className="create-group-header">
        <button type="button" className="back-btn" onClick={onBack}>
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
            required
          />
        </div>

        {error && <div className="form-error-message">{error}</div>}

        <h4 className="select-friends-title">Select Friends:</h4>
        
        <div className="chat-items-container group-members-list">
          {friends.length > 0 ? (
            <ul>
              {friends.map((friend) => {
                const isChecked = selectedFriends.includes(friend._id);
                return (
                  <li
                    key={friend._id}
                    className={`chatItem friend-selection-item ${isChecked ? "selectedFriend" : ""}`}
                    onClick={() => toggleFriend(friend._id)}
                  >
                    <div className="friend-info-block">
                      
                      {/* 👈 تم استدعاء المكون هنا ليعرض الافتارات بشكل صحيح */}
                      <MemberAvatar avatar={friend.avatar} name={friend.firstName || "User"} />

                      <div className="chatInfo">
                        {friend.firstName} {friend.lastName}
                        {friend.username && <span className="username-tag"> @{friend.username}</span>}
                      </div>
                    </div>
                    
                    {/* مؤشر الاختيار الدائري */}
                    <div className={`circle-checkbox-indicator ${isChecked ? "checked" : ""}`}>
                      {isChecked && <FaCheck size={10} />}
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
          className="submit-group-btn" 
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
      </form>
    </div>
  );
}