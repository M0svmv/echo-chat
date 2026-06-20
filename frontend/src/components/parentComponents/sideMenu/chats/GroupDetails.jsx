import { useEffect, useState, memo, useRef } from "react";
import api from "../../../../api/axios";
import { IoArrowBack as BackIcon } from "react-icons/io5";
import { FaEdit, FaSave, FaCamera, FaUsers, FaFileAlt, FaUserPlus, FaUserMinus, FaUserShield, FaEllipsisV } from "react-icons/fa"; 
import { MdAdminPanelSettings } from "react-icons/md";
import "../../../../styles/chat.css";

const MemberAvatar = memo(({ avatar, name }) => {
  return (
    <div className="chatAvatar">
      {avatar ? (
        <img src={avatar} alt={name} className="avatar" loading="lazy" />
      ) : (
        <div className="avatarPlaceholder">{name?.charAt(0).toUpperCase()}</div>
      )}
    </div>
  );
});
MemberAvatar.displayName = "MemberAvatar";

export default function GroupDetails({ group, currentUser, onBack, onGroupUpdated, initialEditMode = false }) {
  const currentUserIdStr = String(currentUser?._id || "");
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null); 

  const isAdmin = group?.groupAdmin?.some(admin => String(admin._id || admin) === currentUserIdStr);
  const isEditableByEveryone = group?.adminPermission === false;
  const canEdit = isAdmin || isEditableByEveryone;

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [openDropdownId, setOpenDropdownId] = useState(null); 

  const [formData, setFormData] = useState({
    groupName: group?.groupName || "",
    groupDescription: group?.groupDescription || "",
    adminPermission: group?.adminPermission ?? true,
  });

  const [groupImageFile, setGroupImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(group?.groupImage || "");
  const [friends, setFriends] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null); 
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isEditing || !group?.participants) return;

    const fetchFriends = async () => {
      try {
        const res = await api.get("/friends/all");
        const currentMemberIds = group.participants.map(p => String(p._id || p));
        const nonMembers = res.data.filter(f => !currentMemberIds.includes(String(f._id)));
        setFriends(nonMembers);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      }
    };
    fetchFriends();
  }, [isEditing, group?.participants]);

  if (!group) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateGroupInfo = async (e) => {
    e.preventDefault();
    if (!formData.groupName.trim()) return setMessage({ type: "error", text: "Group name cannot be empty" });
    
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = new FormData();
      data.append("groupName", formData.groupName.trim());
      data.append("groupDescription", formData.groupDescription.trim());
      
      if (isAdmin) {
        data.append("adminPermission", formData.adminPermission);
      }
      if (groupImageFile) {
        data.append("image", groupImageFile);
      }

      const res = await api.put(`/chats/group/update/${group._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (onGroupUpdated) onGroupUpdated(res.data);
      setIsEditing(false);
      setGroupImageFile(null);
      setMessage({ type: "success", text: "Group settings updated successfully!" });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update group";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (friendId) => {
    setActionLoadingId(friendId);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.put(`/chats/group/add/${group._id}`, { members: [friendId] });
      if (onGroupUpdated) onGroupUpdated(res.data);
      setMessage({ type: "success", text: "Member added successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to add member" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setActionLoadingId(memberId);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.put(`/chats/group/remove/${group._id}`, { 
        memberId: memberId,
        memberIdToRemove: memberId 
      });
      if (onGroupUpdated) onGroupUpdated(res.data);
      setMessage({ type: "success", text: "Member has been removed!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to remove member" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePromoteAdmin = async (memberId) => {
    setActionLoadingId(memberId);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.put(`/chats/group/admin-add/${group._id}`, { 
        adminId: memberId,
        targetUserId: memberId 
      });
      if (onGroupUpdated) onGroupUpdated(res.data);
      setMessage({ type: "success", text: "Member promoted to Admin!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to promote member" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDemoteAdmin = async (adminId) => {
    setActionLoadingId(adminId);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.put(`/chats/group/admin-remove/${group._id}`, { 
        adminId: adminId,
        targetUserId: adminId 
      });
      if (onGroupUpdated) onGroupUpdated(res.data);
      setMessage({ type: "success", text: "Admin privileges revoked!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to demote admin" });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="chatsContainer">
      <div className="create-group-header">
        <button className="back-btn" onClick={isEditing ? () => { setIsEditing(false); setMessage({ type: "", text: "" }); } : onBack}>
          <BackIcon size={20} />
        </button>
        <h3>{isEditing ? "Manage Group" : "Group Info"}</h3>
      </div>

      <div className="chat-items-container" style={{ paddingBottom: "20px" }}>
        
        {message.text && (
          <div className={`form-message ${message.type === "success" ? "success" : "error"}`} style={{ textAlign: "center", margin: "10px" }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateGroupInfo} className="group-form ">
          <div className="avatar-upload-section">
            <div className={`profile-avatar-container ${isEditing ? "editable" : ""}`} onClick={() => isEditing && fileInputRef.current.click()}>
              {previewUrl ? (
                <img src={previewUrl} alt="Group Preview" className="profile-preview-avatar" />
              ) : (
                <div className="avatarPlaceholder large">{formData.groupName?.charAt(0).toUpperCase()}</div>
              )}
              {isEditing && <div className="avatar-overlay"><FaCamera /></div>}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
          </div>

          {isEditing ? (
            <>
              <div className="form-group">
                <label><FaUsers /> Group Name</label>
                <input type="text" name="groupName" value={formData.groupName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label><FaFileAlt /> Group Description</label>
                <input type="text" name="groupDescription" value={formData.groupDescription} onChange={handleChange} />
              </div>
              {isAdmin && (
                <div className="admin-checkbox-container">
                  <input 
                    type="checkbox" 
                    id="adminPermission" 
                    name="adminPermission" 
                    checked={formData.adminPermission} 
                    onChange={handleChange} 
                    className="custom-checkbox"
                  />
                  <label htmlFor="adminPermission" className="checkbox-label">
                    <MdAdminPanelSettings className={`admin-icon ${formData.adminPermission ? 'active' : ''}`} /> 
                    <span>Only admins can edit group details</span>
                  </label>
                </div>
              )}
              <button type="submit" className="btn-basic" disabled={loading}><FaSave /> Save Group Settings</button>
            </>
          ) : (
            <div className="group-details">
              <h2 className="group-name">{group.groupName}</h2>
              <div className="group-description-container">{group.groupDescription && <p className="group-description">{group.groupDescription}</p> }</div>
              <span className="group-members-count" >{group.participants?.length + ` `}Members</span>
              {canEdit && (
                <button type="button" className="edit-profile-navigation-btn" disabled={loading} onClick={() => setIsEditing(true)}>
                  <FaEdit /> Edit Group
                </button>
              )}
            </div>
          )}
        </form>

        {/* 1. قائمة أعضاء الجروب الحاليين */}
        <div className="group-members-container" ref={dropdownRef}>
          <h4>Current Group Members:</h4>
          <div className="chat-items-container group-members">
            <ul>
              {group.participants?.map((member) => {
                const memberIdStr = String(member._id || member);
                const isMemberAdmin = group.groupAdmin?.some(admin => String(admin._id || admin) === memberIdStr);
                const isSelf = memberIdStr === currentUserIdStr;

                return (
                  <li key={memberIdStr} className="chatItem" style={{ cursor: "default", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <MemberAvatar avatar={member.avatar} name={member.firstName || "User"} />
                      <div className="chatInfo">
                        {member.username && <span className="username-tag"> @{member.username}</span>}
                        <br/>
                        {member.firstName ? `${member.firstName} ${member.lastName}` : "Group Member"}
                        <br/>
                        {isMemberAdmin && (
                          <span style={{ color: "#28a745", fontSize: "11px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                            <MdAdminPanelSettings /> [Admin]
                          </span>
                        )}
                      </div>
                    </div>

                    {isEditing && isAdmin && !isSelf && (
                      <div className="member-actions-dropdown">
                        <button 
                          type="button" 
                          className="dropdown-trigger-btn"
                          onClick={() => setOpenDropdownId(openDropdownId === memberIdStr ? null : memberIdStr)}
                          title="Actions"
                        >
                          <FaEllipsisV size={14} />
                        </button>

                        {openDropdownId === memberIdStr && (
                          <div className="dropdown-menu-box">
                            {isMemberAdmin ? (
                              <button
                                type="button"
                                className="dropdown-item item-demote"
                                onClick={() => {
                                  handleDemoteAdmin(memberIdStr);
                                  setOpenDropdownId(null);
                                }}
                                disabled={actionLoadingId === memberIdStr}
                              >
                                <FaUserMinus size={14} />
                                <span>Revoke Admin</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="dropdown-item item-promote"
                                onClick={() => {
                                  handlePromoteAdmin(memberIdStr);
                                  setOpenDropdownId(null);
                                }}
                                disabled={actionLoadingId === memberIdStr}
                              >
                                <FaUserShield size={14} />
                                <span>Make Admin</span>
                              </button>
                            )}

                            <div className="dropdown-divider"></div>

                            <button
                              type="button"
                              className="dropdown-item item-remove"
                              onClick={() => {
                                handleRemoveMember(memberIdStr);
                                setOpenDropdownId(null);
                              }}
                              disabled={actionLoadingId === memberIdStr}
                            >
                              <FaUserMinus size={14} />
                              <span>Expel Member</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* 2. قائمة إضافة أعضاء جدد (بنفس استايل وبنية الأعضاء الحاليين) */}
        {isEditing && (
          <div className="group-members-container" style={{ marginTop: "20px" }}>
            <h4>Add New Members:</h4>
            <div className="chat-items-container group-members" style={{ maxHeight: "250px", overflowY: "auto" }}>
              <ul>
                {friends.length > 0 ? (
                  friends.map(friend => (
                    <li key={friend._id} className="chatItem" style={{ cursor: "default", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid #eee" }}>
                      
                      {/* نفس تركيبة الصورة والبيانات الخاصة بأعضاء الجروب */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <MemberAvatar avatar={friend.avatar} name={friend.firstName || "User"} />
                        <div className="chatInfo">
                          {friend.username && <span className="username-tag"> @{friend.username}</span>}
                          <br />
                          {friend.firstName ? `${friend.firstName} ${friend.lastName}` : "Friend"}
                        </div>
                      </div>

                      {/* زرار الإضافة المودرن المتناسق */}
                      <button 
                        type="button" 
                        onClick={() => handleAddMember(friend._id)} 
                        disabled={actionLoadingId === friend._id}
                        className="add-member-inline-btn"
                      >
                        <FaUserPlus size={12} /> 
                      </button>

                    </li>
                  ))
                ) : (
                  <div style={{ color: "#64748b", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>
                    No friends available to add.
                  </div>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}