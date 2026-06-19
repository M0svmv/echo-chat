import { memo } from "react";

// ===== مكون الأفاتار =====
const ChatAvatar = memo(
  ({ isGroup, groupImage, groupName, avatar, firstName, lastName }) => {
    if (isGroup) {
      if (groupImage) {
        return (
          <div className="receiver-img">
            <img src={groupImage} alt={groupName} loading="lazy" />
          </div>
        );
      }
      return (
        <div className="avatar-placeholder">
          {groupName ? groupName.charAt(0).toUpperCase() : "G"}
        </div>
      );
    }

    if (avatar) {
      return (
        <div className="receiver-img">
          <img src={avatar} alt="Profile" loading="lazy" />
        </div>
      );
    }

    return (
      <div className="avatar-placeholder">
        {firstName && lastName ? firstName.charAt(0) + lastName.charAt(0) : "?"}
      </div>
    );
  },
);
ChatAvatar.displayName = "ChatAvatar";

export default ChatAvatar;