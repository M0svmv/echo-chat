import { useEffect, useState, memo, useRef } from "react";
import api from "../api/axios";
import { IoArrowBack as BackIcon } from "react-icons/io5";
import { FaEdit, FaSave, FaCamera, FaUsers, FaFileAlt, FaUserPlus, FaUserMinus, FaUserShield } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import "../styles/chat.css";

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

  const isAdmin = group?.groupAdmin?.some(admin => String(admin._id || admin) === currentUserIdStr);
  const isEditableByEveryone = group?.adminPermission === false;
  const canEdit = isAdmin || isEditableByEveryone;

  const [isEditing, setIsEditing] = useState(initialEditMode);

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

  // 🔴 طرد عضو (تم إرسال targetUserId لتجنب الخطأ)
  const handleRemoveMember = async (memberId) => {
    setActionLoadingId(memberId);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.put(`/chats/group/remove/${group._id}`, { 
        memberId: memberId,
        memberIdToRemove: memberId // بعتناها بالاسمين لضمان القبول
      });
      if (onGroupUpdated) onGroupUpdated(res.data);
      setMessage({ type: "success", text: "Member has been removed!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to remove member" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 👑 ترقية لأدمن
  const handlePromoteAdmin = async (memberId) => {
    setActionLoadingId(memberId);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.put(`/chats/group/admin-add/${group._id}`, { 
        adminId: memberId,
        targetUserId: memberId // بعتناها بالاسمين لضمان القبول
      });
      if (onGroupUpdated) onGroupUpdated(res.data);
      setMessage({ type: "success", text: "Member promoted to Admin!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to promote member" });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 🛡️ سحب رتبة الأدمن
  const handleDemoteAdmin = async (adminId) => {
    setActionLoadingId(adminId);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.put(`/chats/group/admin-remove/${group._id}`, { 
        adminId: adminId,
        targetUserId: adminId // بعتناها بالاسمين لضمان القبول
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

        <form onSubmit={handleUpdateGroupInfo} className="profile-form">
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
                <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}>
                  <input type="checkbox" id="adminPermission" name="adminPermission" checked={formData.adminPermission} onChange={handleChange} style={{ width: "auto" }} />
                  <label htmlFor="adminPermission" style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}><MdAdminPanelSettings size={18} /> Only admins can edit group details</label>
                </div>
              )}
              <button type="submit" className="save-profile-btn" disabled={loading}><FaSave /> Save Group Settings</button>
            </>
          ) : (
            <div style={{ textAlign: "center", width: "100%" }}>
              <h2>{group.groupName}</h2>
              {group.groupDescription && <p style={{ color: "#666", fontStyle: "italic" }}>{group.groupDescription}</p>}
              <span className="username-tag" style={{ display: "inline-block", marginBottom: "15px" }}>{group.participants?.length} Active Members</span>
              {canEdit && (
                <button type="button" className="save-profile-btn" style={{ background: "#007bff", width: "auto", margin: "10px auto" }} onClick={() => setIsEditing(true)}>
                  <FaEdit /> Edit Group
                </button>
              )}
            </div>
          )}
        </form>

        {isEditing && (
          <div style={{ padding: "0 15px", marginTop: "20px" }}>
            <h4 style={{ marginBottom: "10px" }}>Add New Members:</h4>
            <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #eee", borderRadius: "8px", padding: "10px", backgroundColor: "#fafafa" }}>
              {friends.length > 0 ? (
                friends.map(friend => (
                  <div key={friend._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="avatarPlaceholder">{friend.firstName?.charAt(0).toUpperCase()}</div>
                      <div>{friend.firstName} {friend.lastName}</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleAddMember(friend._id)} 
                      disabled={actionLoadingId === friend._id}
                      style={{ background: "#28a745", color: "white", border: "none", padding: "5px 12px", borderRadius: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}
                    >
                      <FaUserPlus /> Add
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ color: "#888", fontSize: "13px", padding: "5px 0", textAlign: "center" }}>No friends available to add.</div>
              )}
            </div>
          </div>
        )}

        <div style={{ padding: "0 15px", marginTop: "20px" }}>
          <h4 style={{ marginBottom: "10px" }}>Current Group Members:</h4>
          <div className="chat-items-container" style={{ maxHeight: "350px", overflowY: "auto" }}>
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
                        {member.firstName ? `${member.firstName} ${member.lastName}` : "Group Member"}
                        {member.username && <span className="username-tag"> @{member.username}</span>}
                        {isMemberAdmin && (
                          <span style={{ color: "#28a745", fontSize: "11px", marginLeft: "5px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                            <MdAdminPanelSettings /> [Admin]
                          </span>
                        )}
                      </div>
                    </div>

                    {isEditing && isAdmin && !isSelf && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        {isMemberAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleDemoteAdmin(memberIdStr)}
                            disabled={actionLoadingId === memberIdStr}
                            title="Revoke Admin privileges"
                            style={{ background: "#ffc107", border: "none", color: "#000", padding: "6px 10px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center" }}
                          >
                            <FaUserMinus size={12} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePromoteAdmin(memberIdStr)}
                            disabled={actionLoadingId === memberIdStr}
                            title="Promote to Admin"
                            style={{ background: "#17a2b8", border: "none", color: "white", padding: "6px 10px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center" }}
                          >
                            <FaUserShield size={12} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(memberIdStr)}
                          disabled={actionLoadingId === memberIdStr}
                          title="Expel from Group"
                          style={{ background: "#dc3545", border: "none", color: "white", padding: "6px 10px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <FaUserMinus size={12} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}