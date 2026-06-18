import { useEffect, useState, useRef, memo } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setActiveConversation,
  updateConversation,
  removeConversation,
} from "../features/chat/chatSlice";
import socket from "../socket/socket";

import { FaSearch, FaCheck, FaCheckDouble, FaStar, FaBan, FaUserMinus, FaUserPlus, FaUserTimes, FaUnlock, FaUserCheck } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";
import { FiMoreVertical, FiArchive } from "react-icons/fi";

import "../styles/chat.css";
import { FaThumbtack } from "react-icons/fa6";

const ConversationAvatar = memo(({ avatar, firstName, lastName }) => {
  const hasAvatar = !!avatar;

  return (
    <div className={hasAvatar ? "chatAvatar avatar-bg" : "chatAvatar"}>
      {!hasAvatar ? (
        <div className="avatarPlaceholder">
          {firstName?.charAt(0).toUpperCase()}
          {lastName?.charAt(0).toUpperCase()}
        </div>
      ) : (
        <img
          src={avatar}
          alt={`${firstName} ${lastName}`}
          className="avatar"
          loading="lazy"
        />
      )}
    </div>
  );
});

ConversationAvatar.displayName = "ConversationAvatar";

export default function ConversationsList() {
  const dispatch = useDispatch();
  const conversations = useSelector((state) => state.chat.conversations || []);
  const currentUser = useSelector((state) => state.auth.user);
  const activeConversation = useSelector((state) => state.chat.activeConversation);
  
  const friends = useSelector((state) => state.chat.friends || []);

  const [pendingRequests, setPendingRequests] = useState([]);
  // 1️⃣ حالة محلية لتخزين طلبات الصداقة الواردة (من الآخرين إليك)
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [localFriends, setLocalFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  const handleSearch = () => setActiveSearch(searchQuery);

  const handleClear = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  const handleArchive = (e, conversationId) => {
    e.stopPropagation();
    socket.emit("archiveConversation", {
      conversationId,
      userId: currentUser._id,
    });
    setOpenMenuId(null);
  };

  const handleMakePreference = async (e, otherUser, type, conversationId) => {
    e.stopPropagation();
    if (!otherUser) return;

    if (type === "block" && !window.confirm(`Are you sure you want to block ${otherUser.firstName}?`)) return;

    try {
      await api.post("/friends/preference", { type, targetUserId: otherUser._id });
      
      if (type === "block") {
        setBlockedUsers((prev) => [...prev, otherUser._id.toString()]);
        setCloseFriends((prev) => prev.filter((id) => id !== otherUser._id.toString()));
        alert("User blocked successfully");
      } else if (type === "close_friend") {
        setCloseFriends((prev) => [...prev, otherUser._id.toString()]);
        alert("Added to close friends");
      }
      setOpenMenuId(null);
    } catch (err) {
      console.error(`Failed to perform preference action (${type}):`, err);
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleUnblockUser = async (e, otherUser) => {
    e.stopPropagation();
    if (!otherUser) return;

    try {
      await api.post("/friends/preference", { type: "unblock", targetUserId: otherUser._id });
      setBlockedUsers((prev) => prev.filter((id) => id !== otherUser._id.toString()));
      alert(`${otherUser.firstName} has been unblocked successfully.`);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to unblock user:", err);
      alert(err.response?.data?.message || "Could not unblock user.");
    }
  };

  const handleRemoveFriend = async (e, otherUser) => {
    e.stopPropagation();
    if (!otherUser) return;
    
    if (!window.confirm(`Are you sure you want to remove ${otherUser.firstName} from your friends?`)) return;

    try {
      await api.delete("/friends/remove", { data: { friendId: otherUser._id } });
      setLocalFriends((prev) => prev.filter((f) => {
        const friendId = f.targetUser?._id || f._id || f;
        return friendId.toString() !== otherUser._id.toString();
      }));
      setCloseFriends((prev) => prev.filter((id) => id !== otherUser._id.toString()));
      alert("Friend removed successfully");
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to remove friend:", err);
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleAddFriend = async (e, otherUser) => {
    e.stopPropagation();
    if (!otherUser || !currentUser) return;

    try {
      const res = await api.post(`/friends/request/`, { receiverId: otherUser._id });
      const newRequest = res.data?.request || res.data || {};
      
      const fallbackRequest = {
        _id: newRequest._id || Date.now().toString(),
        sender: newRequest.sender?._id || newRequest.sender || currentUser._id,
        receiver: newRequest.receiver?._id || newRequest.receiver || otherUser._id,
        status: "pending"
      };

      setPendingRequests((prev) => [...prev, fallbackRequest]);
      alert(`Friend request sent to ${otherUser.firstName}!`);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to send friend request:", err);
      alert(err.response?.data?.message || "Could not send friend request.");
    }
  };

  const handleCancelRequest = async (e, otherUser, requestId) => {
    e.stopPropagation();
    if (!requestId) {
      alert("Request ID not found. Try refreshing the page.");
      return;
    }

    try {
      await api.delete(`/friends/request/delete/${requestId}`);
      setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
      alert("Friend request cancelled.");
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to cancel friend request:", err);
      alert(err.response?.data?.message || "Could not cancel friend request.");
    }
  };

  // 2️⃣ دالة قبول طلب الصداقة الوارد من القائمة مباشرة
  const handleAcceptRequest = async (e, otherUser, requestId) => {
    e.stopPropagation();
    if (!requestId) return;

    try {
      // قم بتحديث الـ Route بناءً على السيرفر عندك (غالباً يكون /friends/request/accept/:id)
      await api.post(`/friends/request/respond/${requestId}`,{action: "accepted"});
      
      // نقله إلى قائمة الأصدقاء محلياً وحذفه من الطلبات الواردة فوراً
      setLocalFriends((prev) => [...prev, otherUser]);
      setReceivedRequests((prev) => prev.filter((req) => req._id !== requestId));
      
      alert(`You are now friends with ${otherUser.firstName}!`);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to accept friend request:", err);
      alert(err.response?.data?.message || "Could not accept request.");
    }
  };

  // 3️⃣ دالة رفض/حذف طلب الصداقة الوارد
  const handleRejectRequest = async (e, requestId) => {
    e.stopPropagation();
    if (!requestId) return;

    try {
      // غالباً مسار حذف الطلب أو رفضه هو نفسه مسار الـ deleteRequest عندك
      await api.post(`/friends/request/respond/${requestId}`,{action: "rejected"});
      setReceivedRequests((prev) => prev.filter((req) => req._id !== requestId));
      
      alert("Friend request declined.");
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to decline friend request:", err);
      alert(err.response?.data?.message || "Could not decline request.");
    }
  };

  const toggleMenu = (e, convId) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === convId ? null : convId));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const chatsRes = await api.get("/chats");
        dispatch(setConversations(chatsRes.data || []));
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }

      try {
        // 4️⃣ جلب طلبات الصداقة الواردة (received) بالتوازي مع باقي البيانات
        const res = await api.get("/friends/summary").catch(() => ({ data: {} }));

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
setBlockedUsers(blockedRes.map((u) => (u.targetUser?._id || u._id || u).toString()));
setCloseFriends(closeFriendsRes.map((u) => (u.targetUser?._id || u._id || u).toString()));
        
      } catch (error) {
        console.error("Failed to fetch friends data secondary fields:", error);
      }
    };

    fetchInitialData();
  }, [dispatch]);

  useEffect(() => {
    socket.on("conversationUpdated", (updatedConv) => {
      dispatch(updateConversation(updatedConv));
    });
    return () => socket.off("conversationUpdated");
  }, [dispatch]);

  useEffect(() => {
    socket.on("conversationArchived", ({ conversationId, isArchived }) => {
      if (isArchived) {
        dispatch(removeConversation(conversationId));
      }
    });
    return () => socket.off("conversationArchived");
  }, [dispatch]);

  // تعديل منطق الفلترة والترتيب ليدعم الـ Pinned
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
      // 1. فحص هل المحادثة مثبتة للمستخدم الحالي
      const aPinned = a.pinnedBy?.includes(currentUser?._id);
      const bPinned = b.pinnedBy?.includes(currentUser?._id);

      // 2. إذا كانت واحدة مثبتة والأخرى لا، المثبتة تأتي أولاً
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // 3. إذا كانت الحالتين متساويتين (كلاهما مثبت أو كلاهما لا)، نرتب حسب وقت آخر تحديث
      const dateA = new Date(a.updatedAt || 0);
      const dateB = new Date(b.updatedAt || 0);
      return dateB - dateA;
    });

  return (
    <div className="chatsContainer">
      <div className="searchBar">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        />
        {searchQuery && (
          <button className="clearButton" onClick={handleClear}>
            <IoCloseCircle />
          </button>
        )}
        <button className="searchButton" onClick={handleSearch}>
          <FaSearch />
        </button>
      </div>

      <h3>Chats</h3>
      <div className="chat-items-container">
        <ul>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isPinned = conv.pinnedBy?.includes(currentUser._id);
              const otherUser = conv.participants.find(
                (p) => p._id !== currentUser?._id
              );


              
              if (!otherUser || !currentUser) return null;

              const otherUserId = otherUser?._id || otherUser;

              const unreadCount =
                conv.unreadCounts.find(
                  (u) => (u.user?._id || u.user) === currentUser._id
                )?.count || 0;

              const isActive = activeConversation?._id === conv._id;

              // فحص الصداقة
              const currentFriendsList = friends.length > 0 ? friends : localFriends;

const isAlreadyFriend = otherUserId && currentFriendsList.some((f) => {
  if (!f) return false;
  
  // 1. لو الداتا جاية من جدول الـ FriendRequest (الباك إيند الجديد بتاعك)
  // بنشوف الـ ID بتاع السندر أو الريسيفر، وبنستبعد الـ ID بتاعك أنت (currentUser)
  if (f.sender && f.receiver) {
    const senderId = f.sender._id || f.sender;
    const receiverId = f.receiver._id || f.receiver;
    
    const friendId = senderId.toString() === currentUser?._id?.toString() ? receiverId : senderId;
    return friendId.toString() === otherUserId.toString();
  }
  
  // 2. كود احتياطي (لو الداتا جاية من الـ Preference أو مسطحة كـ String)
  const friendId = f.targetUser?._id || f._id || f.user?._id || (typeof f === 'string' ? f : null);
  return friendId && friendId.toString() === otherUserId.toString();
});

// 🔍 سطر سحري للـ Debugging: افتح الـ Console في المتصفح وشوف النتيجة بنفسك
console.log(`Checking chat with ${otherUser?.firstName}: otherUserId=${otherUserId}, isAlreadyFriend=${isAlreadyFriend}`, currentFriendsList);

              // فحص الطلب المرسل منك (Sent Request)
              const sentRequest = pendingRequests.find((req) => {
                const reqSenderId = (req.sender?._id || req.sender || "").toString();
                const reqReceiverId = (req.receiver?._id || req.receiver || "").toString();
                return reqSenderId === currentUser._id.toString() && reqReceiverId === otherUser._id.toString();
              });

              // 5️⃣ فحص هل هذا الشخص باعتلك هو ريكويست؟ (Incoming Request)
              const incomingRequest = receivedRequests.find((req) => {
                const reqSenderId = (req.sender?._id || req.sender || "").toString();
                const reqReceiverId = (req.receiver?._id || req.receiver || "").toString();
                return reqSenderId === otherUser._id.toString() && reqReceiverId === currentUser._id.toString();
              });

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

                  <ConversationAvatar 
                    avatar={otherUser?.avatar} 
                    firstName={otherUser?.firstName} 
                    lastName={otherUser?.lastName} 
                  />

                  <div className="chat-review">
                    <div className="chatInfo" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      
                      {otherUser?.firstName} {otherUser?.lastName}
                      
                      {isCloseFriend && (
                        <FaStar style={{ color: "#ffc107", fontSize: "0.85rem" }} title="Close Friend" />
                      )}

                      
                
                      
                      <span className="username-tag"> @{otherUser?.username}</span>

                      {conv.pinnedBy?.includes(currentUser?._id) && (
    <FaThumbtack style={{ color: "#6c757d", fontSize: "0.8rem" }} />
  )}
                    </div>

                    {conv.lastMessage && (
                      <div className="last-message">
                        <span className="last-message-text">
  <span className="last-message-name">
    {(conv.lastMessage.sender?._id || conv.lastMessage.sender) === currentUser?._id
      ? "You"
      : `@${conv.lastMessage.sender?.username}`}:
  </span>{" "}
  
  {(() => {
    const lastMsg = conv.lastMessage;
    
    // لو الرسالة ميديا (صورة، فيديو، ريكورد، ملف) ومش نصية صافية
    if (lastMsg.fileUrl && lastMsg.fileType !== "text") {
      let icon = "📁 ";
      let typeText = "File";

      if (lastMsg.fileType === "image") { icon = "📷 "; typeText = "Photo"; }
      else if (lastMsg.fileType === "video") { icon = "🎥 "; typeText = "Video"; }
      else if (lastMsg.fileType === "audio") { icon = "🎤 "; typeText = "Voice message"; }

      // لو كاتب كابشن (نص) مع الصورة أو الفيديو يظهر جمبها، لو مش كاتب يظهر الاختصار بس
      return lastMsg.text 
        ? `${icon} ${typeText}: ${lastMsg.text}`
        : `${icon} ${typeText}`;
    }

    // لو رسالة نصية عادية
    return lastMsg.text || "Sent an attachment";
  })()}
</span>
                        <span className="last-message-time">
                          {(conv.lastMessage.sender?._id || conv.lastMessage.sender) === currentUser._id && (
                            <span className="last-message-seen">
                              {conv.lastMessage.seen ? <FaCheckDouble /> : <FaCheck />}
                            </span>
                          )}
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  

                  <div
                    className="conv-more-options"
                    ref={openMenuId === conv._id ? menuRef : null}
                  >
                  
                    <button
                      className="conv-more-btn"
                      onClick={(e) => toggleMenu(e, conv._id)}
                      title="More options"
                    >
                      <FiMoreVertical />
                    </button>

                    {openMenuId === conv._id && (
                      <div className="dropdown-menu conv-dropdown">
                        <button
                          className="conv-dropdown-item"
                          onClick={(e) => handleArchive(e, conv._id)}
                        >
                          <FiArchive />
                          <span> Archive Chat</span>
                        </button>

                        <button
  className="conv-dropdown-item"
  onClick={async (e) => {
    e.stopPropagation();
    try {
      await api.post("/chats/pin", { conversationId: conv._id });
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to pin conversation:", err);
    }
  }}
>
  <FaThumbtack />
  <span>{isPinned ? " Unpin Chat" : " Pin Chat"}</span>
</button>

                        {/* 7️⃣ التحكم الذكي بالخيارات بناءً على حالة الطلبات الصادرة والواردة */}
                        {!isAlreadyFriend ? (
                          incomingRequest ? (
                            /* لو الشخص هو اللي باعتلك الطلب، يظهر خيار القبول والرفض علطول */
                            <>
                              <button
                                className="conv-dropdown-item"
                                onClick={(e) => handleAcceptRequest(e, otherUser, incomingRequest._id)}
                                style={{ color: "#28a745" }}
                              >
                                <FaUserCheck />
                                <span> Accept Request</span>
                              </button>
                              <button
                                className="conv-dropdown-item"
                                onClick={(e) => handleRejectRequest(e, incomingRequest._id)}
                                style={{ color: "#dc3545" }}
                              >
                                <FaUserTimes />
                                <span> Decline Request</span>
                              </button>
                            </>
                          ) : sentRequest ? (
                            <button
                              className="conv-dropdown-item"
                              onClick={(e) => handleCancelRequest(e, otherUser, sentRequest._id)}
                              style={{ color: "#e0a800" }}
                            >
                              <FaUserTimes />
                              <span> Cancel Request</span>
                            </button>
                          ) : (
                            !isBlocked && (
                              <button
                                className="conv-dropdown-item"
                                onClick={(e) => handleAddFriend(e, otherUser)}
                                style={{ color: "#007bff" }}
                              >
                                <FaUserPlus />
                                <span> Add Friend</span>
                              </button>
                            )
                          )
                        ) : (
                          <>
                            {!isCloseFriend && (
                              <button
                                className="conv-dropdown-item"
                                onClick={(e) => handleMakePreference(e, otherUser, "close_friend", conv._id)}
                              >
                                <FaStar style={{ color: "#ffc107" }} />
                                <span> Close Friend</span>
                              </button>
                            )}

                            <button
                              className="conv-dropdown-item"
                              onClick={(e) => handleRemoveFriend(e, otherUser)}
                              style={{ color: "#dc3545" }}
                            >
                              <FaUserMinus />
                              <span> Remove Friend</span>
                            </button>
                          </>
                        )}

                        {isBlocked ? (
                          <button
                            className="conv-dropdown-item"
                            onClick={(e) => handleUnblockUser(e, otherUser)}
                            style={{ color: "#28a745" }}
                          >
                            <FaUnlock />
                            <span> Unblock User</span>
                          </button>
                        ) : (
                          <button
                            className="conv-dropdown-item"
                            onClick={(e) => handleMakePreference(e, otherUser, "block", conv._id)}
                            style={{ color: "#dc3545" }}
                          >
                            <FaBan />
                            <span> Block User</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })
          ) : (
            <div className="no-results">No conversations found</div>
          )}
        </ul>
      </div>
    </div>
  );
}