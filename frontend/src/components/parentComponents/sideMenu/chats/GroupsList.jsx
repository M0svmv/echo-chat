import { useEffect, useState } from "react";
import api from "../../../../api/axios";
import { useDispatch, useSelector } from "react-redux";
import { setActiveConversation, removeConversation } from "../../../../features/chat/chatSlice";
import socket from "../../../../socket/socket";

import { FaPlus } from "react-icons/fa";

import CreateGroup from "./CreateGroup";
import GroupDetails from "./GroupDetails";
import "../../../../styles/chat.css";

import Avatar from "../children/Avatar";
import SidebarSearchBar from "../children/SidebarSearchBar";
import EmptyState from "../../../shared/EmptyState";
import LastMessagePreview from "../children/LastMessagePreview";
import MoreOptionsButton from "../children/MoreOptionsButton";
import ConversationDropdownMenu from "../children/ConversationDropdownMenu";

import useSearchFilter from "../../../hooks/useSearchFilter";
import useListDropdown from "../../../hooks/useListDropdown";

export default function GroupsList() {
  const dispatch = useDispatch();

  const [localGroups, setLocalGroups] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState(null);

  const currentUser = useSelector((state) => state.auth.user);
  const activeConversation = useSelector((state) => state.chat.activeConversation);

  const { searchQuery, setSearchQuery, activeSearch, handleSearch, handleClear, handleKeyDown } =
    useSearchFilter();
  const { openMenuId, menuRef, toggleMenu, closeMenu } = useListDropdown();

  const handleArchive = (e, conversationId) => {
    e.stopPropagation();
    socket.emit("archiveConversation", {
      conversationId,
      userId: currentUser?._id,
    });
    closeMenu();
  };

  const handleViewDetails = (e, group) => {
    e.stopPropagation();
    setSelectedGroupDetails(group);
    closeMenu();
  };

  const handleLeaveGroup = async (e, conversationId) => {
    e.stopPropagation();

    const confirmLeave = window.confirm("Are you sure you want to leave this group?");
    if (!confirmLeave) return;

    try {
      await api.put(`/chats/group/leave/${conversationId}`);

      setLocalGroups((prevGroups) => prevGroups.filter((g) => g._id !== conversationId));

      if (activeConversation?._id === conversationId) {
        dispatch(removeConversation(conversationId));
      }

      if (selectedGroupDetails?._id === conversationId) {
        setSelectedGroupDetails(null);
      }

      closeMenu();
    } catch (error) {
      console.error("Failed to leave group:", error);
      alert(error.response?.data?.message || "Something went wrong. Could not leave group.");
    }
  };

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
          if (updatedConv.participants?.some((p) => (p._id || p) === currentUser?._id)) {
            return [updatedConv, ...prevGroups];
          }
          return prevGroups;
        }
      });

      if (activeConversation?._id === updatedConv._id) {
        dispatch(setActiveConversation(updatedConv));
      }

      setSelectedGroupDetails((prev) => (prev?._id === updatedConv._id ? updatedConv : prev));
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
    const isArchivedByMe = conv.archivedBy?.some(
      (id) => String(id._id || id) === currentUserIdStr,
    );

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
          setLocalGroups((prev) =>
            prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)),
          );
          setSelectedGroupDetails(updatedGroup);
        }}
      />
    );
  }

  return (
    <div className="chatsContainer">
      <SidebarSearchBar
        placeholder="Search groups..."
        searchQuery={searchQuery}
        onChange={setSearchQuery}
        onKeyDown={handleKeyDown}
        onClear={handleClear}
        onSearch={handleSearch}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingRight: "10px",
        }}
      >
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
                conv.unreadCounts?.find((u) => (u.user?._id || u.user) === currentUser?._id)
                  ?.count || 0;

              const isActive = activeConversation?._id === conv._id;
              const isArchived = conv.archivedBy?.includes(currentUser?._id);

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
                    image={conv.groupImage}
                    firstName={conv.groupName}
                    isGroup
                  />

                  <div className="chat-review">
                    <div className="chatInfo">
                      {conv.groupName}
                      <span className="username-tag"> ({conv.participants?.length} members)</span>
                    </div>

                    <LastMessagePreview
                      lastMessage={conv.lastMessage}
                      currentUserId={currentUser?._id}
                    />
                  </div>

                  <MoreOptionsButton
                    menuRef={menuRef}
                    isOpen={openMenuId === conv._id}
                    onToggle={(e) => toggleMenu(e, conv._id)}
                  >
                    <ConversationDropdownMenu
                      variant="group"
                      isArchived={isArchived}
                      onViewGroupInfo={(e) => handleViewDetails(e, conv)}
                      onArchive={(e) => handleArchive(e, conv._id)}
                      onLeaveGroup={(e) => handleLeaveGroup(e, conv._id)}
                    />
                  </MoreOptionsButton>
                </li>
              );
            })
          ) : (
            <EmptyState message="No groups found" />
          )}
        </ul>
      </div>
    </div>
  );
}