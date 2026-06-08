import { useEffect, useState, useRef, memo } from "react";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveConversation,
  removeConversation,
} from "../features/chat/chatSlice";
import socket from "../socket/socket";

import { FaSearch, FaPlus } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";
import { FiMoreVertical, FiArchive, FiInfo, FiLogOut } from "react-icons/fi";

import CreateGroup from "./CreateGroup";
import GroupDetails from "./GroupDetails";
import "../styles/chat.css";

const GroupAvatar = memo(({ groupImage, groupName }) => {
  const hasImage = !!groupImage;

  return (
    <div className={hasImage ? "chatAvatar avatar-bg" : "chatAvatar"}>
      {!hasImage ? (
        <div className="avatarPlaceholder">
          {groupName?.charAt(0).toUpperCase() || "G"}
        </div>
      ) : (
        <img
          src={groupImage}
          alt={groupName}
          className="avatar"
          loading="lazy"
        />
      )}
    </div>
  );
});

GroupAvatar.displayName = "GroupAvatar";

export default function GroupsList() {
  const dispatch = useDispatch();
  
  const [localGroups, setLocalGroups] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState(null);
  
  const currentUser = useSelector((state) => state.auth.user);
  const activeConversation = useSelector((state) => state.chat.activeConversation);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  const handleSearch = () => setActiveSearch(searchQuery);

  const handleClear = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  const toggleMenu = (e, convId) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === convId ? null : convId));
  };

  const handleArchive = (e, conversationId) => {
    e.stopPropagation();
    socket.emit("archiveConversation", {
      conversationId,
      userId: currentUser?._id,
    });
    setOpenMenuId(null);
  };

  const handleViewDetails = (e, group) => {
    e.stopPropagation();
    setSelectedGroupDetails(group);
    setOpenMenuId(null);
  };

  // ✅ دالة مغادرة المجموعة المضافة حديثاً
  const handleLeaveGroup = async (e, conversationId) => {
    e.stopPropagation();
    
    const confirmLeave = window.confirm("Are you sure you want to leave this group?");
    if (!confirmLeave) return;

    try {
      // استدعاء الـ Endpoint الخاص بالمغادرة الذي أرفقته
      await api.put(`/chats/group/leave/${conversationId}`);
      
      // تحديث الحالة المحلية بحذف المجموعة التي غادرها المستخدم
      setLocalGroups((prevGroups) => prevGroups.filter((g) => g._id !== conversationId));
      
      // إذا كانت المجموعة المغادَرة هي الشات المفتوح حالياً، قم بإغلاقه
      if (activeConversation?._id === conversationId) {
        dispatch(removeConversation(conversationId));
      }
      
      // إذا كان المستخدم يفتح تفاصيل المجموعة حالياً، قم بإغلاقها
      if (selectedGroupDetails?._id === conversationId) {
        setSelectedGroupDetails(null);
      }
      
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to leave group:", error);
      alert(error.response?.data?.message || "Something went wrong. Could not leave group.");
    }
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
    const fetchGroups = async () => {
      try {
        const res = await api.get("/chats/group/myGroups");
        setLocalGroups(res.data);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      }
    };
    fetchGroups();
  }, [isCreating]);

  useEffect(() => {
    socket.on("conversationUpdated", (updatedConv) => {
      setLocalGroups((prevGroups) => {
        const exists = prevGroups.some((g) => g._id === updatedConv._id);
        if (exists) {
          return prevGroups.map((g) => (g._id === updatedConv._id ? updatedConv : g));
        } else {
          if (updatedConv.participants?.some(p => (p._id || p) === currentUser?._id)) {
            return [updatedConv, ...prevGroups];
          }
          return prevGroups;
        }
      });
      
      if (activeConversation?._id === updatedConv._id) {
        dispatch(setActiveConversation(updatedConv));
      }

      setSelectedGroupDetails((prev) => prev?._id === updatedConv._id ? updatedConv : prev);
    });

    return () => socket.off("conversationUpdated");
  }, [dispatch, activeConversation?._id, currentUser?._id]);

  useEffect(() => {
    socket.on("conversationArchived", ({ conversationId, isArchived }) => {
      if (isArchived) {
        setLocalGroups((prevGroups) => prevGroups.filter((g) => g._id !== conversationId));
        if (activeConversation?._id === conversationId) {
          dispatch(removeConversation(conversationId));
        }
        if (selectedGroupDetails?._id === conversationId) {
          setSelectedGroupDetails(null);
        }
      }
    });

    return () => socket.off("conversationArchived");
  }, [dispatch, activeConversation?._id, selectedGroupDetails?._id]);

  const filteredGroups = localGroups.filter((conv) => {
    const currentUserIdStr = String(currentUser?._id || "");
    const isArchivedByMe = conv.archivedBy?.some(id => String(id._id || id) === currentUserIdStr);
    
    if (isArchivedByMe) return false;

    if (!activeSearch) return true;
    const groupName = conv.groupName?.toLowerCase() || "";
    const query = activeSearch.toLowerCase();
    return groupName.includes(query);
  });

  if (isCreating) {
    return <CreateGroup onBack={() => setIsCreating(false)} />;
  }

  if (selectedGroupDetails) {
    return (
      <GroupDetails 
        group={selectedGroupDetails} 
        currentUser={currentUser}
        onBack={() => setSelectedGroupDetails(null)} 
        onGroupUpdated={(updatedGroup) => {
          setLocalGroups((prev) => prev.map((g) => g._id === updatedGroup._id ? updatedGroup : g));
          setSelectedGroupDetails(updatedGroup);
        }}
      />
    );
  }

  return (
    <div className="chatsContainer">
      <div className="searchBar">
        <input
          type="text"
          placeholder="Search groups..."
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "10px" }}>
        <h3>Group Chats</h3>
        <button 
          type="button"
          className="create-group-btn"
          onClick={() => setIsCreating(true)}
          title="Create New Group"
        >
          <FaPlus size={12} />
        </button>
      </div>

      <div className="chat-items-container">
        <ul>
          {filteredGroups.length > 0 ? (
            filteredGroups.map((conv) => {
              const unreadCount =
                conv.unreadCounts?.find(
                  (u) => (u.user?._id || u.user) === currentUser?._id
                )?.count || 0;

              const isActive = activeConversation?._id === conv._id;

              return (
                <li
                  key={conv._id}
                  onClick={() => dispatch(setActiveConversation(conv))}
                  className={`chatItem ${isActive ? "activeChat" : ""}`}
                >
                  <div className="notifications-badge">
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                  </div>

                  <GroupAvatar 
                    groupImage={conv.groupImage} 
                    groupName={conv.groupName} 
                  />

                  <div className="chat-review">
                    <div className="chatInfo">
                      {conv.groupName}
                      <span className="username-tag"> ({conv.participants?.length} members)</span>
                    </div>

                    {conv.lastMessage && (
                      <div className="last-message">
                        <span className="last-message-text">
                          <span className="last-message-name">
                            {(conv.lastMessage.sender?._id || conv.lastMessage.sender) === currentUser?._id
                              ? "You"
                              : `@${conv.lastMessage.sender?.username || "user"}`}:
                          </span>{" "}
                          {conv.lastMessage.text}
                        </span>
                        <span className="last-message-time">
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
                          onClick={(e) => handleViewDetails(e, conv)}
                        >
                          <FiInfo />
                          <span> Group Info</span>
                        </button>

                        <button
                          className="conv-dropdown-item"
                          onClick={(e) => handleArchive(e, conv._id)}
                        >
                          <FiArchive />
                          <span> Archive Group</span>
                        </button>

                        {/* ✅ زر مغادرة المجموعة المضاف */}
                        <button
                          className="conv-dropdown-item leave-group-item"
                          onClick={(e) => handleLeaveGroup(e, conv._id)}
                          style={{ color: "#dc3545" }} 
                        >
                          <FiLogOut />
                          <span> Leave Group</span>
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })
          ) : (
            <div className="no-results">No groups found</div>
          )}
        </ul>
      </div>
    </div>
  );
}