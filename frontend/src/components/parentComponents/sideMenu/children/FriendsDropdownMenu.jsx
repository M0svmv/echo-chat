import { FaStar, FaBan, FaUserMinus, FaCheckCircle } from "react-icons/fa";
import { FiMessageSquare } from "react-icons/fi";

/**
 * دروب داون قائمة الأصدقاء، بيتغير محتواه بناءً على التاب النشط
 * (all / close / blocked) بعكس ConversationDropdownMenu العام.
 */
export default function FriendsDropdownMenu({
  activeTab,
  onStartConversation,
  onMakeCloseFriend,
  onRemoveFriend,
  onBlock,
  onUnblock,
}) {
  return (
    <div className="dropdown-menu conv-dropdown">
      {activeTab !== "blocked" && (
        <button className="conv-dropdown-item" onClick={onStartConversation}>
          <FiMessageSquare />
          <span> Start Conversation</span>
        </button>
      )}

      {activeTab === "all" && (
        <button className="conv-dropdown-item" onClick={onMakeCloseFriend}>
          <FaStar style={{ color: "#ffc107" }} />
          <span> Close Friend</span>
        </button>
      )}

      {activeTab === "all" && (
        <button
          className="conv-dropdown-item"
          onClick={onRemoveFriend}
          style={{ color: "#dc3545" }}
        >
          <FaUserMinus />
          <span> Remove Friend</span>
        </button>
      )}

      {activeTab !== "blocked" && (
        <button className="conv-dropdown-item" onClick={onBlock} style={{ color: "#dc3545" }}>
          <FaBan />
          <span> Block</span>
        </button>
      )}

      {activeTab === "blocked" && (
        <button className="conv-dropdown-item" onClick={onUnblock} style={{ color: "#28a745" }}>
          <FaCheckCircle />
          <span> Unblock</span>
        </button>
      )}
    </div>
  );
}