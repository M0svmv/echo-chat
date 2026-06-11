import { useRef, useEffect, useState, useMemo, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "../socket/socket";
import api from "../api/axios";

import {
  setMessages,
  markMessagesSeen,
  removeConversation,
  addMessage
} from "../features/chat/chatSlice";
import "../styles/messagesList.css";

import { FaSearch, FaCheck, FaCheckDouble, FaVideo, FaFileAlt, FaDownload } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { FiMoreVertical, FiArchive, FiX, FiInfo, FiLogOut } from "react-icons/fi";

import NotSelectedChat from "./NotSelectedChat";
import GroupDetails from "./GroupDetails";
import CustomAudioPlayer from "./CustomAudioPlayer";

// ===== مكون الأفاتار =====
const ChatAvatar = memo(({ isGroup, groupImage, groupName, avatar, firstName, lastName }) => {
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
});
ChatAvatar.displayName = "ChatAvatar";

// ===== مكون عرض الميديا =====
const MessageMedia = memo(({ fileUrl, fileType, text }) => {
  if (!fileUrl || fileType === "text") return null;

  if (fileType === "image") {
    return (
      <div className="msg-media-wrapper">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img src={fileUrl} alt="Image" className="msg-image" loading="lazy" />
        </a>
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
        <CustomAudioPlayer src={fileUrl} controls className="msg-audio" preload="metadata" />
      </div>
    );
  }

  // fileType === "file" (pdf, docx, zip, etc.)
  const fileName = fileUrl.split("/").pop().split("?")[0] || "Download File";
  return (
    <div className="msg-file-wrapper">
      <FaFileAlt className="msg-file-icon" />
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

// ===== الكومبوننت الرئيسي =====
export default function MessagesList() {
  const dispatch = useDispatch();

  const messages = useSelector((state) => state.chat.messages);
  const active = useSelector((state) => state.chat.activeConversation);
  const currentUser = useSelector((state) => state.auth.user);

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

  const filteredMessages = messages.filter((msg) =>
    msg.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedMessages = searchQuery ? filteredMessages : messages;
  const isArchived = active?.archivedBy?.includes(currentUser?._id);

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
    if (!active || !messagesRef.current) return;
    const container = messagesRef.current;
    const handleScroll = () => {
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
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
        // التعديل هنا: نمرر أوبجكت فيه الرسالة والـ ID بتاعك
        dispatch(addMessage({ message: msg, currentUserId: currentUser?._id }));
        
        socket.emit("markAsSeen", {
          conversationId: active._id,
          userId: currentUser?._id,
        });
      }
    });
    return () => socket.off("newMessage");
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

  const handleArchive = () => {
    socket.emit("archiveConversation", {
      conversationId: active._id,
      userId: currentUser?._id,
    });
    setShowDropdown(false);
  };

  const handleLeaveGroup = async () => {
    const confirmLeave = window.confirm("Are you sure you want to leave this group?");
    if (!confirmLeave) return;
    try {
      await api.put(`/chats/group/leave/${active._id}`);
      dispatch(removeConversation(active._id));
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to leave group from chat view:", error);
      alert(error.response?.data?.message || "Could not leave group.");
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

  return (
    <div className="chatContainer">
      <div className="chat-container-header">
        <div className="receiver-details">
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
          </div>
        </div>

        <div className="chat-actions">
          {!active.isGroup && <div className="call"><FaPhone /></div>}
          {!active.isGroup && <div className="video"><FaVideo /></div>}

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
                    onClick={() => { setViewingGroupDetails(true); setShowDropdown(false); }}
                  >
                    <FiInfo />
                    <span>Group Info</span>
                  </button>
                )}

                <button className="dropdown-item" onClick={handleArchive}>
                  <FiArchive />
                  <span>
                    {isArchived
                      ? (active.isGroup ? "Unarchive Group" : "Unarchive Chat")
                      : (active.isGroup ? "Archive Group" : "Archive Chat")}
                  </span>
                </button>

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
        <div className="message-search-bar">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <span className="search-count">
              {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""}
            </span>
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
        {displayedMessages.map((msg) => {
          const isMine = msg.sender?._id === currentUser?._id;
          const hasMedia = msg.fileUrl && msg.fileType !== "text";
          const showText = msg.text && !(hasMedia && !msg.text);

          return (
            <div
              key={msg._id}
              className={`message ${isMine ? "mine" : "theirs"} ${hasMedia ? "has-media" : ""} ${msg.isSending ? "optimistic-loading" : ""}`}
            >
              {!isMine && (
                <div className="sender">
                  {msg.sender?.firstName} {msg.sender?.lastName}
                  {active.isGroup && msg.sender?.username && (
                    <span className="group-sender-username"> @{msg.sender.username}</span>
                  )}
                </div>
              )}

              {/* عرض الميديا */}
              {hasMedia && (
                <MessageMedia
                  fileUrl={msg.fileUrl}
                  fileType={msg.fileType}
                  text={msg.text}
                />
              )}

              {/* النص */}
              {showText && !hasMedia && (
                <div className="text">{msg.text}</div>
              )}

              <div className="send-details">
                <div className={`timestamp ${isMine ? "mine" : "theirs"}`}>
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
            </div>
          );
        })}

        {searchQuery && filteredMessages.length === 0 && (
          <div className="no-results-messages">No messages found</div>
        )}
      </div>
    </div>
  );
}