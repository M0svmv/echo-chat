import {
  FaStar,
  FaBan,
  FaUserMinus,
  FaUserPlus,
  FaUserTimes,
  FaUnlock,
  FaUserCheck,
} from "react-icons/fa";
import { FaThumbtack } from "react-icons/fa6";
import { FiArchive, FiInfo, FiLogOut } from "react-icons/fi";

/**
 * قايمة خيارات منسدلة (الدروب داون اللي تحت زرار الثلاث نقط) لعنصر محادثة
 * في السايد بار. تدعم 3 سيناريوهات بناءً على props:
 *
 * - محادثة شخصية كاملة (ConversationsList): فيها Pin + كل خيارات الصداقة/الحظر
 * - جروب (GroupsList): فيها Group Info + Archive + Leave Group
 * - عنصر مؤرشف (ArchiveChats): فيها بس Unarchive
 *
 * مرّر فقط الـ props والـ handlers المتعلقة بالسيناريو المطلوب.
 */
export default function ConversationDropdownMenu({
  variant = "personal", // "personal" | "group" | "archived"
  isPinned,
  isArchived,
  isAlreadyFriend,
  isBlocked,
  isCloseFriend,
  sentRequest,
  incomingRequest,
  onArchive,
  onPin,
  onViewGroupInfo,
  onLeaveGroup,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onAddFriend,
  onMakeCloseFriend,
  onRemoveFriend,
  onUnblockUser,
  onBlockUser,
}) {
  if (variant === "archived") {
    return (
      <div className="dropdown-menu conv-dropdown">
        <button className="conv-dropdown-item" onClick={onArchive}>
          <FiArchive />
          <span> Unarchive Chat</span>
        </button>
      </div>
    );
  }

  if (variant === "group") {
    return (
      <div className="dropdown-menu conv-dropdown">
        <button className="conv-dropdown-item" onClick={onViewGroupInfo}>
          <FiInfo />
          <span> Group Info</span>
        </button>
        <button className="conv-dropdown-item" onClick={onArchive}>
          <FiArchive />
          <span>{isArchived ? " Unarchive Group" : " Archive Group"}</span>
        </button>
        <button
          className="conv-dropdown-item leave-group-item"
          onClick={onLeaveGroup}
          style={{ color: "#dc3545" }}
        >
          <FiLogOut />
          <span> Leave Group</span>
        </button>
      </div>
    );
  }

  // variant === "personal"
  return (
    <div className="dropdown-menu conv-dropdown">
      <button className="conv-dropdown-item" onClick={onArchive}>
        <FiArchive />
        <span> Archive Chat</span>
      </button>

      <button className="conv-dropdown-item" onClick={onPin}>
        <FaThumbtack />
        <span>{isPinned ? " Unpin Chat" : " Pin Chat"}</span>
      </button>

      {!isAlreadyFriend ? (
        incomingRequest ? (
          <>
            <button
              className="conv-dropdown-item"
              onClick={onAcceptRequest}
              style={{ color: "#28a745" }}
            >
              <FaUserCheck />
              <span> Accept Request</span>
            </button>
            <button
              className="conv-dropdown-item"
              onClick={onRejectRequest}
              style={{ color: "#dc3545" }}
            >
              <FaUserTimes />
              <span> Decline Request</span>
            </button>
          </>
        ) : sentRequest ? (
          <button
            className="conv-dropdown-item"
            onClick={onCancelRequest}
            style={{ color: "#e0a800" }}
          >
            <FaUserTimes />
            <span> Cancel Request</span>
          </button>
        ) : (
          !isBlocked && (
            <button
              className="conv-dropdown-item"
              onClick={onAddFriend}
              style={{ color: "#007bff" }}
            >
              <FaUserPlus />
              <span> Add Friend</span>
            </button>
          )
        )
      ) : (
        <>
          {!isCloseFriend && (
            <button className="conv-dropdown-item" onClick={onMakeCloseFriend}>
              <FaStar style={{ color: "#ffc107" }} />
              <span> Close Friend</span>
            </button>
          )}
          <button
            className="conv-dropdown-item"
            onClick={onRemoveFriend}
            style={{ color: "#dc3545" }}
          >
            <FaUserMinus />
            <span> Remove Friend</span>
          </button>
        </>
      )}

      {isBlocked ? (
        <button
          className="conv-dropdown-item"
          onClick={onUnblockUser}
          style={{ color: "#28a745" }}
        >
          <FaUnlock />
          <span> Unblock User</span>
        </button>
      ) : (
        <button
          className="conv-dropdown-item"
          onClick={onBlockUser}
          style={{ color: "#dc3545" }}
        >
          <FaBan />
          <span> Block User</span>
        </button>
      )}
    </div>
  );
}