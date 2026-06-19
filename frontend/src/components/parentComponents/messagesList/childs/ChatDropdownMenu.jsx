import {
  FaStar,
  FaBan,
  FaUserMinus,
  FaUserPlus,
  FaUserTimes,
  FaUnlock,
  FaUserCheck,
} from "react-icons/fa";
import { FiArchive, FiInfo, FiLogOut } from "react-icons/fi";

/**
 * مكون الدروب داون منيو بتاع الشات (تحت زر الثلاث نقط).
 * يعرض خيارات الأرشفة، إدارة الصداقة، الحظر، الحذف، الخروج من الجروب...
 * كل المنطق (handlers) جاي من الأب عبر props، المكون ده بس مسؤول عن العرض.
 */
export default function ChatDropdownMenu({
  active,
  receiver,
  isArchived,
  isAlreadyFriend,
  isBlocked,
  isCloseFriend,
  sentRequest,
  incomingRequest,
  onViewGroupInfo,
  onArchive,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onAddFriend,
  onMakeCloseFriend,
  onRemoveFriend,
  onUnblockUser,
  onBlockUser,
  onDeleteChat,
  onLeaveGroup,
}) {
  return (
    <div className="dropdown-menu chat-more-options">
      {active.isGroup && (
        <button className="dropdown-item" onClick={onViewGroupInfo}>
          <FiInfo />
          <span>Group Info</span>
        </button>
      )}

      <button className="dropdown-item" onClick={onArchive}>
        <FiArchive />
        <span>
          {isArchived
            ? active.isGroup
              ? "Unarchive Group"
              : "Unarchive Chat"
            : active.isGroup
              ? "Archive Group"
              : "Archive Chat"}
        </span>
      </button>

      {!active.isGroup && receiver && (
        <>
          {!isAlreadyFriend ? (
            incomingRequest ? (
              <>
                <button
                  className="dropdown-item"
                  onClick={() => onAcceptRequest(incomingRequest._id)}
                  style={{ color: "#28a745" }}
                >
                  <FaUserCheck />
                  <span>Accept Friend Request</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => onRejectRequest(incomingRequest._id)}
                  style={{ color: "#dc3545" }}
                >
                  <FaUserTimes />
                  <span>Decline Friend Request</span>
                </button>
              </>
            ) : sentRequest ? (
              <button
                className="dropdown-item"
                onClick={() => onCancelRequest(sentRequest._id)}
                style={{ color: "#e0a800" }}
              >
                <FaUserTimes />
                <span>Cancel Sent Request</span>
              </button>
            ) : (
              !isBlocked && (
                <button
                  className="dropdown-item"
                  onClick={onAddFriend}
                  style={{ color: "#007bff" }}
                >
                  <FaUserPlus />
                  <span>Add Friend</span>
                </button>
              )
            )
          ) : (
            <>
              {!isCloseFriend && (
                <button className="dropdown-item" onClick={onMakeCloseFriend}>
                  <FaStar style={{ color: "#ffc107" }} />
                  <span>Mark Close Friend</span>
                </button>
              )}
              <button
                className="dropdown-item"
                onClick={onRemoveFriend}
                style={{ color: "#dc3545" }}
              >
                <FaUserMinus />
                <span>Remove Friend</span>
              </button>
            </>
          )}

          {isBlocked ? (
            <button
              className="dropdown-item"
              onClick={onUnblockUser}
              style={{ color: "#28a745" }}
            >
              <FaUnlock />
              <span>Unblock User</span>
            </button>
          ) : (
            <button
              className="dropdown-item"
              onClick={onBlockUser}
              style={{ color: "#dc3545" }}
            >
              <FaBan />
              <span>Block User</span>
            </button>
          )}
        </>
      )}

      {!active.isGroup && (
        <button className="dropdown-item" onClick={onDeleteChat}>
          <FaUserMinus style={{ color: "#dc3545" }} />
          <span style={{ color: "#dc3545" }}>Delete Chat</span>
        </button>
      )}

      {active.isGroup && (
        <button
          className="dropdown-item"
          onClick={onLeaveGroup}
          style={{ color: "#dc3545" }}
        >
          <FiLogOut />
          <span>Leave Group</span>
        </button>
      )}
    </div>
  );
}