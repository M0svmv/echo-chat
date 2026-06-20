import { useEffect } from "react";
import api from "../../../../api/axios";
import { useDispatch, useSelector } from "react-redux";
import { setConversations, setActiveConversation } from "../../../../features/chat/chatSlice";
import socket from "../../../../socket/socket";

import "../../../../styles/chat.css";

import Avatar from "../children/Avatar";
import SidebarSearchBar from "../children/SidebarSearchBar";
import EmptyState from "../../../shared/EmptyState";
import LastMessagePreview from "../children/LastMessagePreview";
import MoreOptionsButton from "../children/MoreOptionsButton";
import ConversationDropdownMenu from "../children/ConversationDropdownMenu";

import useSearchFilter from "../../../hooks/useSearchFilter";
import useListDropdown from "../../../hooks/useListDropdown";
import useConversationSockets from "../../../hooks/useConversationSocket";

export default function ArchiveChats() {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.conversations);
  const currentUser = useSelector((state) => state.auth.user);

  const { searchQuery, setSearchQuery, activeSearch, handleSearch, handleClear, handleKeyDown } =
    useSearchFilter();
  const { openMenuId, menuRef, toggleMenu, closeMenu } = useListDropdown();

  useConversationSockets({ dispatch, mode: "archived" });

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/chats/archive");
        dispatch(setConversations(res.data));
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    };
    fetchConversations();
  }, [dispatch]);

  const handleArchive = (e, conversationId) => {
    e.stopPropagation();
    socket.emit("archiveConversation", {
      conversationId,
      userId: currentUser?._id,
    });
    closeMenu();
  };

  // الفلترة الذكية تدعم البحث باسم الشخص أو اسم الجروب
  const filteredConversations = conversations.filter((conv) => {
    if (!activeSearch) return true;
    const query = activeSearch.toLowerCase();

    if (conv.isGroup) {
      return conv.groupName?.toLowerCase().includes(query);
    } else {
      const otherUser = conv.participants?.find((p) => (p._id || p) !== currentUser?._id);
      const fullName = `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.toLowerCase();
      const username = otherUser?.username?.toLowerCase() || "";
      return fullName.includes(query) || username.includes(query);
    }
  });

  return (
    <div className="chatsContainer">
      <SidebarSearchBar
        placeholder="Search archived chats..."
        searchQuery={searchQuery}
        onChange={setSearchQuery}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        onSearch={handleSearch}
      />

      <h3>Archived Chats</h3>
      <div className="chat-items-container">
        <ul>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isGroup = conv.isGroup;
              const otherUser = !isGroup
                ? conv.participants?.find((p) => (p._id || p) !== currentUser?._id)
                : null;

              const chatTitle = isGroup
                ? conv.groupName
                : `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`;

              const unreadCount =
                conv.unreadCounts?.find((u) => (u.user?._id || u.user) === currentUser?._id)
                  ?.count || 0;

              return (
                <li
                  key={conv._id}
                  onClick={() => dispatch(setActiveConversation(conv))}
                  className="chatItem"
                >
                  <div className="notifications-badge">
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                  </div>

                  <Avatar
                    image={isGroup ? conv.groupImage : otherUser?.avatar}
                    firstName={isGroup ? conv.groupName : otherUser?.firstName}
                    lastName={otherUser?.lastName}
                    isGroup={isGroup}
                  />

                  <div className="chat-review">
                    <div className="chatInfo">
                      {chatTitle}
                      {!isGroup && otherUser?.username && (
                        <span className="username-tag"> @{otherUser.username}</span>
                      )}
                      {isGroup && (
                        <span
                          className="username-tag"
                          style={{
                            background: "#e0e0e0",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            fontSize: "10px",
                          }}
                        >
                          Group
                        </span>
                      )}
                    </div>

                    <LastMessagePreview
                      lastMessage={conv.lastMessage}
                      currentUserId={currentUser?._id}
                      showSeenStatus
                    />
                  </div>

                  <MoreOptionsButton
                    menuRef={menuRef}
                    isOpen={openMenuId === conv._id}
                    onToggle={(e) => toggleMenu(e, conv._id)}
                  >
                    <ConversationDropdownMenu
                      variant="archived"
                      onArchive={(e) => handleArchive(e, conv._id)}
                    />
                  </MoreOptionsButton>
                </li>
              );
            })
          ) : (
            <EmptyState message="No conversations found" />
          )}
        </ul>
      </div>
    </div>
  );
}