import { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "../socket/socket";
import api from "../api/axios";

import { setMessages, markMessagesSeen } from "../features/chat/chatSlice";
import "../styles/messagesList.css";

import { FaSearch } from "react-icons/fa";
import { FaCheck, FaCheckDouble, FaPhone, FaVideo } from "react-icons/fa6";
import { FiMoreVertical } from "react-icons/fi";

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
  const [isAtBottom, setIsAtBottom] = useState(true);

  // ✅ scroll listener
  useEffect(() => {
    if (!active || !messagesRef.current) return;

    const container = messagesRef.current;

    const handleScroll = () => {
      const threshold = 100;
      // ✅ علامة المقارنة < كانت ناقصة
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      setIsAtBottom(atBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [active]);

  // ✅ fetch messages when active conversation changes
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

  // ✅ لو جت رسالة جديدة وانت جوا الشات — ابعت markAsSeen فورًا
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

    return () => {
      socket.off("newMessage");
    };
  }, [active?._id, currentUser._id]);

  // ✅ single clean listener for messagesSeen
  useEffect(() => {
    socket.on("messagesSeen", (data) => {
      dispatch(markMessagesSeen(data));
    });

    return () => {
      socket.off("messagesSeen");
    };
  }, [dispatch]);

  // ✅ scroll to bottom when switching conversations
  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [active?._id]);

  // ✅ auto-scroll فقط لو انت في الأسفل
  useEffect(() => {
    if (!messagesRef.current) return;
    if (isAtBottom) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

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
            {receiver
              ? `${receiver.firstName} ${receiver.lastName}`
              : "Unknown User"}
          </div>
        </div>

        <div className="chat-actions">
          <div className="call">
            <FaPhone />
          </div>
          <div className="video">
            <FaVideo />
          </div>
          <div className="search">
            <FaSearch />
          </div>
          <div className="more-options">
            <FiMoreVertical />
          </div>
        </div>
      </div>

      <div className="messages-container" ref={messagesRef}>
        {messages.map((msg) => {
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
      </div>
    </div>
  );
}