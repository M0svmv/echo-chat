import { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "../socket/socket";
import api from "../api/axios";

import {
  setMessages,
  markMessagesSeen,
  removeConversation,
} from "../features/chat/chatSlice";
import "../styles/messagesList.css";

import { FaSearch, FaCheck, FaCheckDouble, FaPhone, FaVideo } from "react-icons/fa";
import { FiMoreVertical, FiArchive, FiX } from "react-icons/fi";

import NotSelectedChat from "./NotSelectedChat";

export default function MessagesList() {
  const dispatch = useDispatch();

  const messages = useSelector((state) => state.chat.messages);
  const active = useSelector((state) => state.chat.activeConversation);
  const currentUser = useSelector((state) => state.auth.user);

  const receiver = active?.participants?.find(
    (p) => p._id !== currentUser?._id
  );

  const messagesRef = useRef(null);
  const dropdownRef = useRef(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = messages.filter((msg) =>
    msg.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedMessages = searchQuery ? filteredMessages : messages;

  const isArchived = active?.archivedBy?.includes(currentUser._id);

  // ✅ اقفل الـ dropdown لو دوس برا
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ scroll listener
  useEffect(() => {
    if (!active || !messagesRef.current) return;

    const container = messagesRef.current;

    const handleScroll = () => {
      const threshold = 100;
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      setIsAtBottom(atBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [active]);

  // ✅ fetch messages
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

  // ✅ emit markAsSeen عند دخول الشات
  useEffect(() => {
    if (!active) return;

    socket.emit("markAsSeen", {
      conversationId: active._id,
      userId: currentUser._id,
    });
  }, [active?._id, currentUser._id]);

  // ✅ markAsSeen لو جت رسالة جديدة وانت جوا الشات
  useEffect(() => {
    if (!active) return;

    socket.on("newMessage", (msg) => {
      if (msg.conversationId === active._id) {
        socket.emit("markAsSeen", {
          conversationId: active._id,
          userId: currentUser._id,
        });
      }
    });

    return () => socket.off("newMessage");
  }, [active?._id, currentUser._id]);

  // ✅ messagesSeen listener
  useEffect(() => {
    socket.on("messagesSeen", (data) => {
      dispatch(markMessagesSeen(data));
    });

    return () => socket.off("messagesSeen");
  }, [dispatch]);

  // ✅ conversationArchived listener
  useEffect(() => {
    socket.on("conversationArchived", ({ conversationId }) => {
      dispatch(removeConversation(conversationId));
      setShowDropdown(false);
    });

    return () => socket.off("conversationArchived");
  }, [dispatch]);

  // ✅ scroll to bottom when switching conversations
  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [active?._id]);

  // ✅ auto-scroll
  useEffect(() => {
    if (!messagesRef.current) return;
    if (isAtBottom) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  // ✅ reset search لما تغير الشات
  useEffect(() => {
    setShowSearch(false);
    setSearchQuery("");
  }, [active?._id]);

  const handleArchive = () => {
    socket.emit("archiveConversation", {
      conversationId: active._id,
      userId: currentUser._id,
    });
    setShowDropdown(false);
  };

  if (!active) return <NotSelectedChat />;

  return (
    <div className="chatContainer">
      <div className="chat-container-header">
        <div className="receiver-details">
          {receiver?.avatar ? (
            <div className="receiver-img">
              <img src={receiver.avatar} alt="Profile" />
            </div>
          ) : (
            <div className="avatar-placeholder">
              {receiver
                ? receiver.firstName.charAt(0) + receiver.lastName.charAt(0)
                : "?"}
            </div>
          )}

          <div className="receiver">
            {receiver ? `${receiver.firstName} ${receiver.lastName}` : "Unknown User"}
          </div>
        </div>

        <div className="chat-actions">
          <div className="call"><FaPhone /></div>
          <div className="video"><FaVideo /></div>

          {/* ✅ زرار السيرش */}
          <div
            className="search"
            onClick={() => {
              setShowSearch((prev) => !prev);
              setSearchQuery("");
            }}
          >
            <FaSearch />
          </div>

          {/* ✅ More options مع dropdown */}
          <div className="more-options" ref={dropdownRef}>
            <div
              className="more-options-btn"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              <FiMoreVertical />
            </div>

            {showDropdown && (
              <div className="dropdown-menu chat-more-options">
                <button className="dropdown-item" onClick={handleArchive}>
                  <FiArchive />
                  <span>{isArchived ? "Unarchive Chat" : "Archive Chat"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ سيرش بار جوا الشات */}
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

          return (
            <div
              key={msg._id}
              className={`message ${isMine ? "mine" : "theirs"}`}
            >
              {!isMine && (
                <div className="sender">
                  {msg.sender?.firstName} {msg.sender?.lastName}
                </div>
              )}

              <div className="text">{msg.text}</div>

              <div className="send-details">
                <div className={`timestamp ${isMine ? "mine" : "theirs"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {isMine && (
                  <div className="seen">
                    {msg.seen ? <FaCheckDouble /> : <FaCheck />}
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