import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMemo } from "react";
import api from "../../../api/axios";
import socket from "../../../socket/socket";

import {
  removeConversation,
  setActiveConversation,
  updateMessageReactions,
  setMediaPreview,
  setReplyingTo,
  setEditingMessage,
} from "../../../features/chat/chatSlice";
import "../../../styles/messagesList.css";

import NotSelectedChat from "../../NotSelectedChat";
import GroupDetails from "../../GroupDetails";
import MediaPreviewModal from "../../MediaPreviewModal";

import ChatHeader from "./childs/ChatHeader";
import MessageSearchBar from "./childs/MessageSearchBar";
import MessagesContainer from "./childs/MessagesContainer";

import useChatRelations from "./../../hooks/useChatRelations";
import useChatSockets from "./../../hooks/useChatSocket";
import useMessageSearch from "./../../hooks/useMessageSearch";
import useScrollToBottom from "./../../hooks/useScrollToBottom";

export default function MessagesList() {
  const dispatch = useDispatch();

  const messages = useSelector((state) => state.chat.messages);
  const active = useSelector((state) => state.chat.activeConversation);
  const currentUser = useSelector((state) => state.auth.user);
  const reduxFriends = useSelector((state) => state.chat.friends || []);

  const receiver = useMemo(() => {
    if (!active || active.isGroup) return null;
    return active.participants?.find((p) => p._id !== currentUser?._id);
  }, [active?._id, active?.isGroup, currentUser?._id]);

  const [showDropdown, setShowDropdown] = useState(false);
  const [viewingGroupDetails, setViewingGroupDetails] = useState(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState(null);

  const isArchived = active?.archivedBy?.includes(currentUser?._id);

  // كل لوجيك الصداقة/الحظر/الريكوستس
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
  } = useChatRelations({ active, currentUser, receiver, setShowDropdown });

  // كل اشتراكات السوكيت
  useChatSockets({ active, currentUser, dispatch, setShowDropdown });

  // جلب الرسايل + السكرول التلقائي
  const { messagesRef } = useScrollToBottom({ active, dispatch, messages });

  // البحث جوه الرسايل
  const {
    showSearch,
    searchQuery,
    setSearchQuery,
    matchingMessages,
    currentMatchIndex,
    handleNextMatch,
    handlePrevMatch,
    toggleSearch,
    closeSearch,
  } = useMessageSearch({ messages, activeId: active?._id });

  const inActivateChat = () => {
    dispatch(setActiveConversation(null));
  };

  const handleEmojiReact = async (messageId, emoji) => {
    setActiveReactionMenu(null);
    try {
      const response = await api.post(`/messages/react/${messageId}`, {
        emoji,
      });
      dispatch(
        updateMessageReactions({
          messageId,
          conversationId: active._id,
          reactions: response.data.reactions,
        }),
      );
    } catch (error) {
      console.error("Failed to react with emoji:", error);
    }
  };

  const handleArchive = () => {
    socket.emit("archiveConversation", {
      conversationId: active._id,
      userId: currentUser?._id,
    });
    setShowDropdown(false);
  };

  const handleLeaveGroup = async () => {
    const confirmLeave = window.confirm(
      "Are you sure you want to leave this group?",
    );
    if (!confirmLeave) return;
    try {
      await api.put(`/chats/group/leave/${active._id}`);
      dispatch(removeConversation(active._id));
      setShowDropdown(false);
    } catch (error) {
      console.error(error);
      alert("Could not leave group.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await api.delete(`/messages/delete/${messageId}`);
      } catch (err) {
        alert("Failed to delete message");
      }
    }
  };

  if (!active) return <NotSelectedChat />;

  if (viewingGroupDetails) {
    return (
      <GroupDetails
        group={active}
        currentUser={currentUser}
        onBack={() => setViewingGroupDetails(false)}
        onGroupUpdated={() => setViewingGroupDetails(false)}
      />
    );
  }

  const currentFriendsList =
    reduxFriends.length > 0 ? reduxFriends : localFriends;

  const isAlreadyFriend =
    receiver &&
    currentFriendsList.some((f) => {
      if (!f) return false;
      if (f.sender && f.receiver) {
        const senderId = f.sender._id || f.sender;
        const receiverId = f.receiver._id || f.receiver;
        const friendId =
          senderId.toString() === currentUser?._id?.toString()
            ? receiverId
            : senderId;
        return friendId.toString() === receiver._id.toString();
      }
      const friendId =
        f.targetUser?._id ||
        f._id ||
        f.user?._id ||
        (typeof f === "string" ? f : null);
      return friendId && friendId.toString() === receiver._id.toString();
    });

  const sentRequest =
    receiver &&
    pendingRequests.find(
      (req) =>
        (req.sender?._id || req.sender || "").toString() ===
          currentUser?._id?.toString() &&
        (req.receiver?._id || req.receiver || "").toString() ===
          receiver._id.toString(),
    );
  const incomingRequest =
    receiver &&
    receivedRequests.find(
      (req) =>
        (req.sender?._id || req.sender || "").toString() ===
          receiver._id.toString() &&
        (req.receiver?._id || req.receiver || "").toString() ===
          currentUser?._id?.toString(),
    );

  const isBlocked = receiver && blockedUsers.includes(receiver._id.toString());
  const isCloseFriend =
    receiver && closeFriends.includes(receiver._id.toString());

  return (
    <div className="chatContainer">
      <ChatHeader
        active={active}
        receiver={receiver}
        isCloseFriend={isCloseFriend}
        isArchived={isArchived}
        isAlreadyFriend={isAlreadyFriend}
        isBlocked={isBlocked}
        sentRequest={sentRequest}
        incomingRequest={incomingRequest}
        onBack={inActivateChat}
        onToggleSearch={toggleSearch}
        onViewGroupInfo={() => setViewingGroupDetails(true)}
        onArchive={handleArchive}
        onAcceptRequest={handleAcceptRequest}
        onRejectRequest={handleRejectRequest}
        onCancelRequest={handleCancelRequest}
        onAddFriend={handleAddFriend}
        onMakeCloseFriend={() => handleMakePreference("close_friend")}
        onRemoveFriend={handleRemoveFriend}
        onUnblockUser={handleUnblockUser}
        onBlockUser={() => handleMakePreference("block")}
        onDeleteChat={() => dispatch(removeConversation(active._id))}
        onLeaveGroup={handleLeaveGroup}
      />

      {showSearch && (
        <MessageSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          matchingMessages={matchingMessages}
          currentMatchIndex={currentMatchIndex}
          onNextMatch={handleNextMatch}
          onPrevMatch={handlePrevMatch}
          onClose={closeSearch}
        />
      )}

      <MessagesContainer
        ref={messagesRef}
        messages={messages}
        currentUser={currentUser}
        isGroup={active.isGroup}
        searchQuery={searchQuery}
        matchingMessages={matchingMessages}
        currentMatchIndex={currentMatchIndex}
        activeReactionMenu={activeReactionMenu}
        onToggleReactionMenu={(msgId) =>
          setActiveReactionMenu((prev) => (prev === msgId ? null : msgId))
        }
        onEmojiReact={handleEmojiReact}
        onReply={(msg) => dispatch(setReplyingTo(msg))}
        onEdit={(msg) => dispatch(setEditingMessage(msg))}
        onDelete={handleDeleteMessage}
        onMediaClick={(msg) =>
          dispatch(setMediaPreview({ url: msg.fileUrl, type: `${msg.fileType}` }))
        }
      />

      <MediaPreviewModal />
    </div>
  );
}