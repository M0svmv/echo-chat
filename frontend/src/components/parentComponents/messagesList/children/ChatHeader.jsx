import { useRef, useState } from "react";
import { FaSearch, FaStar } from "react-icons/fa";
import { FaPhone, FaVideo } from "react-icons/fa6";
import { FiMoreVertical } from "react-icons/fi";
import { MdArrowBack as BackIcon } from "react-icons/md";
import ChatAvatar from "./ChatAvatar";
import ChatDropdownMenu from "./ChatDropdownMenu";
import useClickOutside from "../../../hooks/useClickOutside";

/**
 * هيدر الشات: الأفاتار + اسم المحادثة + أزرار الكول/الفيديو/البحث + الدروب داون منيو.
 * كل بيانات العلاقات (صداقة/حظر) والـ handlers جايين من الأب.
 */
export default function ChatHeader({
  active,
  receiver,
  isCloseFriend,
  isArchived,
  isAlreadyFriend,
  isBlocked,
  sentRequest,
  incomingRequest,
  onBack,
  onToggleSearch,
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
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useClickOutside(dropdownRef, () => setShowDropdown(false));

  // نلف الـ handlers اللي محتاجة تقفل الدروب داون بعد التنفيذ
  const wrapAndClose = (fn) => (...args) => {
    fn?.(...args);
    setShowDropdown(false);
  };

  return (
    <div className="chat-container-header">
      <div className="receiver-details">
        <button className="back-btn" onClick={onBack}>
          <BackIcon />
        </button>
        <ChatAvatar
          isGroup={active.isGroup}
          groupImage={active.groupImage}
          groupName={active.groupName}
          avatar={receiver?.avatar}
          firstName={receiver?.firstName}
          lastName={receiver?.lastName}
        />
        <div className="receiver">
          {active.isGroup
            ? active.groupName
            : receiver
              ? `${receiver.firstName} ${receiver.lastName}`
              : "Unknown User"}
          {!active.isGroup && isCloseFriend && (
            <FaStar
              style={{
                color: "#ffc107",
                marginLeft: "6px",
                fontSize: "0.85rem",
              }}
              title="Close Friend"
            />
          )}
        </div>
      </div>

      <div className="chat-actions">
        {!active.isGroup && (
          <div className="call">
            <FaPhone />
          </div>
        )}
        {!active.isGroup && (
          <div className="video">
            <FaVideo />
          </div>
        )}

        <div className="search" onClick={onToggleSearch}>
          <FaSearch />
        </div>

        <div className="more-options" ref={dropdownRef}>
          <div
            className="more-options-btn"
            onClick={() => setShowDropdown((prev) => !prev)}
          >
            <FiMoreVertical />
          </div>

          {showDropdown && (
            <ChatDropdownMenu
              active={active}
              receiver={receiver}
              isArchived={isArchived}
              isAlreadyFriend={isAlreadyFriend}
              isBlocked={isBlocked}
              isCloseFriend={isCloseFriend}
              sentRequest={sentRequest}
              incomingRequest={incomingRequest}
              onViewGroupInfo={wrapAndClose(onViewGroupInfo)}
              onArchive={onArchive}
              onAcceptRequest={onAcceptRequest}
              onRejectRequest={onRejectRequest}
              onCancelRequest={onCancelRequest}
              onAddFriend={onAddFriend}
              onMakeCloseFriend={onMakeCloseFriend}
              onRemoveFriend={onRemoveFriend}
              onUnblockUser={onUnblockUser}
              onBlockUser={onBlockUser}
              onDeleteChat={wrapAndClose(onDeleteChat)}
              onLeaveGroup={onLeaveGroup}
            />
          )}
        </div>
      </div>
    </div>
  );
}