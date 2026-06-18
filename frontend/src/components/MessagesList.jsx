import { useRef, useEffect, useState, useMemo, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "../socket/socket";
import api from "../api/axios";

import {
  setMessages,
  markMessagesSeen,
  removeConversation,
  addMessage,
  setActiveConversation,
  updateEditedMessage,
  updateMessageReactions,
  deleteMessage,
  setMediaPreview,
  clearMediaPreview,
  setReplyingTo, // 👈 استخدام الريدكس مباشرة
  setEditingMessage, // 👈 استخدام الريدكس مباشرة
} from "../features/chat/chatSlice";
import "../styles/messagesList.css";

import {
  FaSearch,
  FaCheck,
  FaCheckDouble,
  FaVideo,
  FaFileAlt,
  FaDownload,
  FaStar,
  FaBan,
  FaUserMinus,
  FaUserPlus,
  FaUserTimes,
  FaUnlock,
  FaUserCheck,
  FaReply,
  FaPen,
  FaRegSmile,
} from "react-icons/fa";
import { FaPhone, FaRegFilePdf, FaRegFileZipper } from "react-icons/fa6";
import {
  FiMoreVertical,
  FiArchive,
  FiX,
  FiInfo,
  FiLogOut,
} from "react-icons/fi";
import { MdArrowBack as BackIcon } from "react-icons/md";
import NotSelectedChat from "./NotSelectedChat";
import GroupDetails from "./GroupDetails";
import CustomAudioPlayer from "./CustomAudioPlayer";
import MediaPreviewModal from "./MediaPreviewModal";

const EMOJI_LIST = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

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

// ===== مكون عرض الميديا =====
const MessageMedia = memo(({ fileUrl, fileType, text, onClick }) => {
  if (!fileUrl || fileType === "text") return null;

  if (fileType === "image") {
    return (
      <div className="msg-media-wrapper" onClick={onClick} >
        
          <img src={fileUrl} alt="Image" className="msg-image" loading="lazy"  />
        
        {text && <p className="msg-caption">{text}</p>}
      </div>
    );
  }

  if (fileType === "video") {
    return (
      <div className="msg-media-wrapper">
        <video
          src={fileUrl}
          className="msg-video"
          controls
          preload="metadata"
        />
        {text && <p className="msg-caption">{text}</p>}
      </div>
    );
  }

  if (fileType === "audio") {
    return (
      <div className="msg-audio-wrapper">
        <CustomAudioPlayer src={fileUrl} className="msg-audio" />
      </div>
    );
  }

  const fileName = fileUrl.split("/").pop().split("?")[0] || "Download File";
  const lowerFileName = fileName.toLowerCase();

  let fileIcon = <FaFileAlt className="msg-file-icon" />;
  let fileClass = "generic-file";

  if (lowerFileName.endsWith(".pdf")) {
    fileIcon = <FaRegFilePdf className="msg-file-icon" />;
    fileClass = "pdf-file";
  } else if (lowerFileName.endsWith(".zip") || lowerFileName.endsWith(".rar")) {
    fileIcon = <FaRegFileZipper className="msg-file-icon" />;
    fileClass = "archive-file";
  } else if (
    lowerFileName.endsWith(".docx") ||
    lowerFileName.endsWith(".doc")
  ) {
    fileClass = "word-file";
  }

  return (
    <div className={`msg-file-wrapper ${fileClass}`}>
      {fileIcon}
      <span className="msg-file-name">{fileName}</span>
      <a
        href={fileUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="msg-file-download"
        title="Download"
      >
        <FaDownload />
      </a>
    </div>
  );
});
MessageMedia.displayName = "MessageMedia";

export default function MessagesList() {
  const dispatch = useDispatch();

  const messages = useSelector((state) => state.chat.messages);
  const active = useSelector((state) => state.chat.activeConversation);
  const currentUser = useSelector((state) => state.auth.user);
  const reduxFriends = useSelector((state) => state.chat.friends || []);
  const mediaPreview = useSelector((state) => state.chat.mediaPreview);

  const receiver = useMemo(() => {
    if (!active || active.isGroup) return null;
    return active.participants?.find((p) => p._id !== currentUser?._id);
  }, [active?._id, active?.isGroup, currentUser?._id]);

  const messagesRef = useRef(null);
  const dropdownRef = useRef(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingGroupDetails, setViewingGroupDetails] = useState(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState(null);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [localFriends, setLocalFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);

  const [previewMedia, setPreviewMedia] = useState(null);

  const isArchived = active?.archivedBy?.includes(currentUser?._id);

  const matchingMessages = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return messages.filter((msg) =>
      msg.text?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [messages, searchQuery]);

  const inActivateChat = () => {
    dispatch(setActiveConversation(null));
  };

  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  useEffect(() => {
    if (matchingMessages.length > 0) {
      const targetMsgId = matchingMessages[currentMatchIndex]?._id;
      const targetElement = document.getElementById(`msg-${targetMsgId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [matchingMessages, currentMatchIndex]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery, active?._id]);

  const handleNextMatch = () => {
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessages.length);
  };

  const handlePrevMatch = () => {
    setCurrentMatchIndex(
      (prev) => (prev - 1 + matchingMessages.length) % matchingMessages.length,
    );
  };

  const formatDividerDate = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString([], {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
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

  const handleMakePreference = async (type) => {
    if (!receiver) return;
    if (
      type === "block" &&
      !window.confirm(`Are you sure you want to block ${receiver.firstName}?`)
    )
      return;

    try {
      await api.post("/friends/preference", {
        type,
        targetUserId: receiver._id,
      });
      if (type === "block") {
        setBlockedUsers((prev) => [...prev, receiver._id.toString()]);
        setCloseFriends((prev) =>
          prev.filter((id) => id !== receiver._id.toString()),
        );
        alert("User blocked successfully");
      } else if (type === "close_friend") {
        setCloseFriends((prev) => [...prev, receiver._id.toString()]);
        alert("Added to close friends");
      }
      setShowDropdown(false);
    } catch (err) {
      console.error(err);
      alert("Action failed");
    }
  };

  const handleUnblockUser = async () => {
    if (!receiver) return;
    try {
      await api.post("/friends/preference", {
        type: "unblock",
        targetUserId: receiver._id,
      });
      setBlockedUsers((prev) =>
        prev.filter((id) => id !== receiver._id.toString()),
      );
      alert(`${receiver.firstName} has been unblocked.`);
      setShowDropdown(false);
    } catch (err) {
      alert("Could not unblock user.");
    }
  };

  const handleRemoveFriend = async () => {
    if (!receiver) return;
    if (
      !window.confirm(
        `Are you sure you want to remove ${receiver.firstName} from friends?`,
      )
    )
      return;

    try {
      await api.delete("/friends/remove", { data: { friendId: receiver._id } });
      setLocalFriends((prev) =>
        prev.filter(
          (f) =>
            (f.targetUser?._id || f._id || f).toString() !==
            receiver._id.toString(),
        ),
      );
      setCloseFriends((prev) =>
        prev.filter((id) => id !== receiver._id.toString()),
      );
      alert("Friend removed successfully");
      setShowDropdown(false);
    } catch (err) {
      alert("Action failed");
    }
  };

  const handleAddFriend = async () => {
    if (!receiver || !currentUser) return;
    try {
      const res = await api.post(`/friends/request/`, {
        receiverId: receiver._id,
      });
      const newRequest = res.data?.request || res.data || {};
      setPendingRequests((prev) => [
        ...prev,
        {
          _id: newRequest._id || Date.now().toString(),
          sender: currentUser._id,
          receiver: receiver._id,
          status: "pending",
        },
      ]);
      alert(`Friend request sent!`);
      setShowDropdown(false);
    } catch (err) {
      alert("Could not send friend request.");
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await api.delete(`/friends/request/delete/${requestId}`);
      setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
      alert("Friend request cancelled.");
      setShowDropdown(false);
    } catch (err) {
      alert("Could not cancel request.");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (!requestId || !receiver) return;
    try {
      await api.post(`/friends/request/respond/${requestId}`, {
        action: "accepted",
      });
      setLocalFriends((prev) => [...prev, receiver]);
      setReceivedRequests((prev) =>
        prev.filter((req) => req._id !== requestId),
      );
      alert(`You are now friends!`);
      setShowDropdown(false);
    } catch (err) {
      alert("Could not accept request.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await api.post(`/friends/request/respond/${requestId}`, {
        action: "rejected",
      });
      setReceivedRequests((prev) =>
        prev.filter((req) => req._id !== requestId),
      );
      alert("Request declined.");
      setShowDropdown(false);
    } catch (err) {
      alert("Could not decline request.");
    }
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!active) return;
    const fetchRelations = async () => {
      try {
        const res = await api
          .get("/friends/summary")
          .catch(() => ({ data: {} }));
        const {
          friendsRes = [],
          requestsRes = [],
          receivedRes = [],
          blockedRes = [],
          closeFriendsRes = [],
        } = res.data;
        setPendingRequests(requestsRes);
        setReceivedRequests(receivedRes);
        setLocalFriends(friendsRes);
        setBlockedUsers(
          blockedRes.map((u) => (u.targetUser?._id || u._id || u).toString()),
        );
        setCloseFriends(
          closeFriendsRes.map((u) =>
            (u.targetUser?._id || u._id || u).toString(),
          ),
        );
      } catch (err) {
        console.error("Error syncing contextual features:", err);
      }
    };
    fetchRelations();
  }, [active?._id]);

  useEffect(() => {
    if (!active || !messagesRef.current) return;
    const container = messagesRef.current;
    const handleScroll = () => {
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      setIsAtBottom(atBottom);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${active._id}`);
        dispatch(setMessages(res.data));
      } catch (error) {
        console.error("Fetch Messages Error:", error);
      }
    };
    fetchMessages();
  }, [active?._id, dispatch]);

  useEffect(() => {
    if (!active) return;
    socket.emit("markAsSeen", {
      conversationId: active._id,
      userId: currentUser?._id,
    });
  }, [active?._id, currentUser?._id]);

  useEffect(() => {
    if (!active) return;

    socket.on("newMessage", (msg) => {
      if (msg.conversationId === active._id) {
        dispatch(addMessage({ message: msg, currentUserId: currentUser?._id }));
        socket.emit("markAsSeen", {
          conversationId: active._id,
          userId: currentUser?._id,
        });
      }
    });

    socket.on("messageEdited", (data) => {
      if (data.conversationId === active._id) {
        dispatch(updateEditedMessage(data));
      }
    });

    socket.on("messageReactionUpdated", (data) => {
      if (data.conversationId === active._id) {
        dispatch(updateMessageReactions(data));
      }
    });

    socket.on("messageDeleted", ({ messageId, conversationId }) => {
      if (conversationId === active._id) {
        dispatch(deleteMessage(messageId));
      }
    });

    return () => {
      socket.off("newMessage");
      socket.off("messageEdited");
      socket.off("messageReactionUpdated");
      socket.off("messageDeleted");
    };
  }, [active?._id, currentUser?._id, dispatch]);

  useEffect(() => {
    socket.on("messagesSeen", (data) => {
      if (active && data.conversationId === active._id) {
        dispatch(markMessagesSeen(data));
      }
    });
    return () => socket.off("messagesSeen");
  }, [active?._id, dispatch]);

  useEffect(() => {
    socket.on("conversationArchived", ({ conversationId }) => {
      if (active && conversationId === active._id) {
        dispatch(removeConversation(conversationId));
        setShowDropdown(false);
      }
    });
    return () => socket.off("conversationArchived");
  }, [active?._id, dispatch]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [active?._id]);

  useEffect(() => {
    if (!messagesRef.current) return;
    if (isAtBottom) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    setShowSearch(false);
    setSearchQuery("");
    setViewingGroupDetails(null);
  }, [active?._id]);

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
      <div className="chat-container-header">
        <div className="receiver-details">
          <button className="back-btn" onClick={() => inActivateChat()}>
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

          <div
            className="search"
            onClick={() => {
              setShowSearch((prev) => !prev);
              setSearchQuery("");
            }}
          >
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
              <div className="dropdown-menu chat-more-options">
                {active.isGroup && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setViewingGroupDetails(true);
                      setShowDropdown(false);
                    }}
                  >
                    <FiInfo />
                    <span>Group Info</span>
                  </button>
                )}

                <button className="dropdown-item" onClick={handleArchive}>
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
                            onClick={() =>
                              handleAcceptRequest(incomingRequest._id)
                            }
                            style={{ color: "#28a745" }}
                          >
                            <FaUserCheck />
                            <span>Accept Friend Request</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() =>
                              handleRejectRequest(incomingRequest._id)
                            }
                            style={{ color: "#dc3545" }}
                          >
                            <FaUserTimes />
                            <span>Decline Friend Request</span>
                          </button>
                        </>
                      ) : sentRequest ? (
                        <button
                          className="dropdown-item"
                          onClick={() => handleCancelRequest(sentRequest._id)}
                          style={{ color: "#e0a800" }}
                        >
                          <FaUserTimes />
                          <span>Cancel Sent Request</span>
                        </button>
                      ) : (
                        !isBlocked && (
                          <button
                            className="dropdown-item"
                            onClick={handleAddFriend}
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
                          <button
                            className="dropdown-item"
                            onClick={() => handleMakePreference("close_friend")}
                          >
                            <FaStar style={{ color: "#ffc107" }} />
                            <span>Mark Close Friend</span>
                          </button>
                        )}
                        <button
                          className="dropdown-item"
                          onClick={handleRemoveFriend}
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
                        onClick={handleUnblockUser}
                        style={{ color: "#28a745" }}
                      >
                        <FaUnlock />
                        <span>Unblock User</span>
                      </button>
                    ) : (
                      <button
                        className="dropdown-item"
                        onClick={() => handleMakePreference("block")}
                        style={{ color: "#dc3545" }}
                      >
                        <FaBan />
                        <span>Block User</span>
                      </button>
                    )}
                  </>
                )}

                {!active.isGroup && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      dispatch(removeConversation(active._id));
                      setShowDropdown(false);
                    }}
                  >
                    <FaUserMinus style={{ color: "#dc3545" }} />
                    <span style={{ color: "#dc3545" }}>Delete Chat</span>
                  </button>
                )}

                {active.isGroup && (
                  <button
                    className="dropdown-item"
                    onClick={handleLeaveGroup}
                    style={{ color: "#dc3545" }}
                  >
                    <FiLogOut />
                    <span>Leave Group</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="message-search-bar-modern">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && matchingMessages.length > 0 && (
            <div className="search-navigation">
              <span className="search-count">
                {currentMatchIndex + 1} of {matchingMessages.length}
              </span>
              <button className="search-nav-btn" onClick={handlePrevMatch}>
                ▲
              </button>
              <button className="search-nav-btn" onClick={handleNextMatch}>
                ▼
              </button>
            </div>
          )}
          {searchQuery && matchingMessages.length === 0 && (
            <span className="search-count no-matches">No results</span>
          )}
          <FiX
            className="close-search"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
          />
        </div>
      )}

      <div className="messages-container" ref={messagesRef}>
        {messages.map((msg, index) => {
          const isMine = msg.sender?._id === currentUser?._id;
          const hasMedia = msg.fileUrl && msg.fileType !== "text";
          const showText = msg.text && !(hasMedia && !msg.text);

          const isCurrentSearchedMatch =
            searchQuery && matchingMessages[currentMatchIndex]?._id === msg._id;
          const currentMsgDate = new Date(msg.createdAt).toDateString();
          const prevMsgDate =
            index > 0
              ? new Date(messages[index - 1].createdAt).toDateString()
              : null;
          const showDateDivider = currentMsgDate !== prevMsgDate;

          return (
            <div key={msg._id} style={{ display: "contents" }}>
              {showDateDivider && (
                <div className="chat-date-divider">
                  <div className="date-divider-line"></div>
                  <span className="date-divider-text">
                    {formatDividerDate(msg.createdAt)}
                  </span>
                  <div className="date-divider-line"></div>
                </div>
              )}

              <div
                id={`msg-${msg._id}`}
                className={`message ${isMine ? "mine" : "theirs"} ${hasMedia ? "has-media" : ""} ${msg.isSending ? "optimistic-loading" : ""} ${isCurrentSearchedMatch ? "searched-highlight" : ""}`}
              >
                {!isMine && active.isGroup && (
                  <div className="sender">
                    {msg.sender?.firstName} {msg.sender?.lastName}
                    {msg.sender?.username && (
                      <span className="group-sender-username">
                        {" "}
                        @{msg.sender.username}
                      </span>
                    )}
                  </div>
                )}

                {/* كارت عرض الرد المدمج جوة البابل */}
                {msg.replyTo && (
                  <div
                    className="message-reply-inside-card"
                    onClick={() => {
                      const el = document.getElementById(
                        `msg-${msg.replyTo?._id}`,
                      );
                      if (el)
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }}
                  >
                    <span className="reply-card-sender">
                      {msg.replyTo.sender?.firstName || "User"}
                    </span>
                    <p className="reply-card-text">
                      {msg.replyTo.text || "📁 Attachment / Voice"}
                    </p>
                  </div>
                )}

                {hasMedia && (
                  <MessageMedia
                    fileUrl={msg.fileUrl}
                    fileType={msg.fileType}
                    text={msg.text}
                    onClick={() => dispatch(setMediaPreview({ url: msg.fileUrl, type: `${ msg.fileType }` }))}
                  />
                )}
                {showText && !hasMedia && (
                  <div className="text">{msg.text}</div>
                )}

                <div className="send-details">
                  <div className={`timestamp ${isMine ? "mine" : "theirs"}`}>
                    {msg.isEdited && (
                      <span className="edited-label-flag">edited </span>
                    )}
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {isMine && !active.isGroup && (
                    <div className="seen">
                      {msg.isSending ? (
                        <span className="msg-sending-spinner" />
                      ) : msg.seen ? (
                        <FaCheckDouble />
                      ) : (
                        <FaCheck />
                      )}
                    </div>
                  )}
                </div>

                {/* بادج عرض الإيموجيز المتفاعلة */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="message-reactions-badge-container">
                    {msg.reactions.map((react, i) => (
                      <span
                        key={i}
                        className="single-reaction-badge"
                        title={`Reacted by ${react.username}`}
                      >
                        {react.emoji}
                      </span>
                    ))}
                  </div>
                )}

                {/* المنيو الطائرة بتوجيه سليم تماماً بدون ما تبوظ الـ Row */}
                <div
                  className={`message-hover-actions-menu ${activeReactionMenu === msg._id ? "forced-show" : ""}`}
                >
                  <div className="emoji-reaction-picker-tray">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiReact(msg._id, emoji)}
                        className="tray-emoji-btn"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="action-divider-pipe"></div>
                  <button
                    className="action-menu-icon-btn"
                    onClick={() => dispatch(setReplyingTo(msg))}
                    title="Reply"
                  >
                    <FaReply />
                  </button>
                  {isMine && msg.fileType === "text" && !msg.isSending && (
                    <button
                      className="action-menu-icon-btn"
                      onClick={() => dispatch(setEditingMessage(msg))}
                      title="Edit"
                    >
                      <FaPen />
                    </button>
                  )}
                  {isMine && !msg.isSending && (
                    <button
                      className="action-menu-icon-btn delete-btn"
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this message?",
                          )
                        ) {
                          try {
                            await api.delete(`/messages/delete/${msg._id}`);
                          } catch (err) {
                            alert("Failed to delete message");
                          }
                        }
                      }}
                      title="Delete"
                    >
                      <FiX />
                    </button>
                  )}
                  <button
                    className="action-menu-icon-btn mobile-emoji-trigger"
                    onClick={() =>
                      setActiveReactionMenu(
                        activeReactionMenu === msg._id ? null : msg._id,
                      )
                    }
                  >
                    <FaRegSmile />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <MediaPreviewModal />
    </div>
  );
}
