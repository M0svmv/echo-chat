import { useEffect } from "react";
import api from "../../../../api/axios";
import { useDispatch, useSelector } from "react-redux";
import { setConversations, setActiveConversation } from "../../../../features/chat/chatSlice";
import socket from "../../../../socket/socket";

import { FaStar } from "react-icons/fa";
import { FaThumbtack } from "react-icons/fa6";

import "../../../../styles/chat.css";

import Avatar from "../children/Avatar";
import SidebarSearchBar from "../children/SidebarSearchBar";
import EmptyState from "../../../shared/EmptyState";
import LastMessagePreview from "../children/LastMessagePreview";
import MoreOptionsButton from "../children/MoreOptionsButton";
import ConversationDropdownMenu from "../children/ConversationDropdownMenu";

import useSearchFilter from "../../../hooks/useSearchFilter";
import useListDropdown from "../../../hooks/useListDropdown";
import useChatRelations from "../../../hooks/useChatRelations";
import useConversationSockets from "../../../hooks/useConversationSocket";
import {
  checkIsAlreadyFriend,
  findSentRequest,
  findIncomingRequest,
} from "../../../utils/relationHelpers";

export default function ConversationsList() {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.conversations || []);
  const currentUser = useSelector((state) => state.auth.user);
  const activeConversation = useSelector((state) => state.chat.activeConversation);
  const friends = useSelector((state) => state.chat.friends || []);

  const { searchQuery, setSearchQuery, activeSearch, handleSearch, handleClear, handleKeyDown } =
    useSearchFilter();
  const { openMenuId, menuRef, toggleMenu, closeMenu } = useListDropdown();

  const {
    pendingRequests,
    receivedRequests,
    localFriends,
    blockedUsers,
    closeFriends,
    handleMakePreference,
    handleUnblockUser,
    handleRemoveFriend,
    handleAddFriend,
    handleCancelRequest,
    handleAcceptRequest,
    handleRejectRequest,
  } = useChatRelations({ currentUser, onActionDone: closeMenu });

  useConversationSockets({ dispatch, mode: "active" });

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const chatsRes = await api.get("/chats");
        dispatch(setConversations(chatsRes.data || []));
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
      userId: currentUser._id,
    });
    closeMenu();
  };

  const handlePin = async (e, conversationId) => {
    e.stopPropagation();
    try {
      await api.post("/chats/pin", { conversationId });
      closeMenu();
    } catch (err) {
      console.error("Failed to pin conversation:", err);
    }
  };

  const filteredConversations = conversations
    .filter((conv) => {
      if (conv.isGroup) return false;
      if (!activeSearch) return true;

      const otherUser = conv.participants.find((p) => p._id !== currentUser?._id);
      const fullName = `${otherUser?.firstName} ${otherUser?.lastName}`.toLowerCase();
      const username = otherUser?.username?.toLowerCase() || "";
      const query = activeSearch.toLowerCase();
      return fullName.includes(query) || username.includes(query);
    })
    .sort((a, b) => {
      const aPinned = a.pinnedBy?.includes(currentUser?._id);
      const bPinned = b.pinnedBy?.includes(currentUser?._id);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const dateA = new Date(a.updatedAt || 0);
      const dateB = new Date(b.updatedAt || 0);
      return dateB - dateA;
    });

  const currentFriendsList = friends.length > 0 ? friends : localFriends;

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

      <h3>Chats</h3>
      <div className="chat-items-container">
        <ul>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isPinned = conv.pinnedBy?.includes(currentUser._id);
              const otherUser = conv.participants.find((p) => p._id !== currentUser?._id);

              if (!otherUser || !currentUser) return null;

              const otherUserId = otherUser?._id || otherUser;

              const unreadCount =
                conv.unreadCounts.find((u) => (u.user?._id || u.user) === currentUser._id)
                  ?.count || 0;

              const isActive = activeConversation?._id === conv._id;

              const isAlreadyFriend = checkIsAlreadyFriend(
                otherUserId,
                currentUser,
                currentFriendsList,
              );
              const sentRequest = findSentRequest(otherUser, currentUser, pendingRequests);
              const incomingRequest = findIncomingRequest(
                otherUser,
                currentUser,
                receivedRequests,
              );
              const isBlocked = blockedUsers.includes(otherUser._id.toString());
              const isCloseFriend = closeFriends.includes(otherUser._id.toString());

              return (
                <li
                  key={conv._id}
                  onClick={() => dispatch(setActiveConversation(conv))}
                  className={`chatItem ${isActive ? "activeChat" : ""}`}
                >
                  <div className="notifications-badge">
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                  </div>

                  <Avatar
                    image={otherUser?.avatar}
                    firstName={otherUser?.firstName}
                    lastName={otherUser?.lastName}
                  />

                  <div className="chat-review">
                    <div
                      className="chatInfo"
                      style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}
                    >
                      {otherUser?.firstName} {otherUser?.lastName}

                      {isCloseFriend && (
                        <FaStar style={{ color: "#ffc107", fontSize: "0.85rem" }} title="Close Friend" />
                      )}

                      <span className="username-tag"> @{otherUser?.username}</span>

                      {conv.pinnedBy?.includes(currentUser?._id) && (
                        <FaThumbtack style={{ color: "#6c757d", fontSize: "0.8rem" }} />
                      )}
                    </div>

                    <LastMessagePreview
                      lastMessage={conv.lastMessage}
                      currentUserId={currentUser?._id}
                      showMediaIcons
                      showSeenStatus
                    />
                  </div>

                  <MoreOptionsButton
                    menuRef={menuRef}
                    isOpen={openMenuId === conv._id}
                    onToggle={(e) => toggleMenu(e, conv._id)}
                  >
                    <ConversationDropdownMenu
                      variant="personal"
                      isPinned={isPinned}
                      isAlreadyFriend={isAlreadyFriend}
                      isBlocked={isBlocked}
                      isCloseFriend={isCloseFriend}
                      sentRequest={sentRequest}
                      incomingRequest={incomingRequest}
                      onArchive={(e) => handleArchive(e, conv._id)}
                      onPin={(e) => handlePin(e, conv._id)}
                      onAcceptRequest={(e) => {
                        e.stopPropagation();
                        handleAcceptRequest(otherUser, incomingRequest._id);
                      }}
                      onRejectRequest={(e) => {
                        e.stopPropagation();
                        handleRejectRequest(incomingRequest._id);
                      }}
                      onCancelRequest={(e) => {
                        e.stopPropagation();
                        handleCancelRequest(sentRequest._id);
                      }}
                      onAddFriend={(e) => {
                        e.stopPropagation();
                        handleAddFriend(otherUser);
                      }}
                      onMakeCloseFriend={(e) => {
                        e.stopPropagation();
                        handleMakePreference(otherUser, "close_friend");
                      }}
                      onRemoveFriend={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(otherUser);
                      }}
                      onUnblockUser={(e) => {
                        e.stopPropagation();
                        handleUnblockUser(otherUser);
                      }}
                      onBlockUser={(e) => {
                        e.stopPropagation();
                        handleMakePreference(otherUser, "block");
                      }}
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