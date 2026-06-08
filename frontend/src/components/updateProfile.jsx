import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { updateProfileSuccess } from "../features/auth/authSlice"; // تأكد من مسار الـ slice عندك
import socket from "../socket/socket";

import { FaUser, FaAt, FaEnvelope, FaCamera, FaSave } from "react-icons/fa";

import "../styles/chat.css";

export default function UpdateProfile() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  // حالات الفورم (Form States) مأخوذة من بيانات اليوزر الحالي تلقائياً
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    avatar: currentUser?.avatar || "",
    bio: currentUser?.bio || "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentUser?.avatar || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fileInputRef = useRef(null);

  // التعامل مع تغيير الحقول النصية
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // اختيار الصورة وعمل عرض مؤقت لها (Preview)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // لينك مؤقت للعرض فقط
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // إرسال البيانات المحدثة للباك إند
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // بما إن فيه ملف (صورة)، لازم نستخدم FormData
      const data = new FormData();
      data.append("firstName", formData.firstName);
      data.append("lastName", formData.lastName);
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("bio", formData.bio);
      
      if (avatarFile) {
        data.append("avatar", avatarFile);
      }

      // ✅ تعديل المسار هنا ليكون نسبي بناءً على Base URL (ليصيب /api/users/update-profile)
      const res = await api.put("/auth/update-profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 1. تحديث الـ Redux State والـ LocalStorage فوراً
      dispatch(updateProfileSuccess(res.data.user));

      // 2. إرسال حدث عبر الـ Socket عشان باقي المستخدمين يشوفوا التحديث Real-time
      socket.emit("profileUpdated", res.data.user);

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update profile";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatsContainer">
      {/* الهيدر بنفس روح الـ ConversationsList */}
      <h3 className="pg-title">Edit Profile</h3>
      
      <div className="chat-items-container">
        <form onSubmit={handleSubmit} className="profile-form">
          
          {/* قسم الأفاتار واختيار الصورة */}
          <div className="avatar-upload-section">
            <div className="profile-avatar-container" onClick={triggerFileInput}>
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar Preview" className="profile-preview-avatar" />
              ) : (
                <div className="avatarPlaceholder large">
                  {formData.firstName?.charAt(0).toUpperCase()}
                  {formData.lastName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="avatar-overlay">
                <FaCamera />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: "none" }} 
            />
            <p className="upload-hint">Click on avatar to change photo</p>
          </div>

          {/* رسائل النجاح أو الخطأ */}
          {message.text && (
            <div className={`form-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* حقول الإدخال */}
          <div className="form-group-row">
            <div className="form-group">
              <label><FaUser /> First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label><FaUser /> Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label><FaAt /> Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label><FaEnvelope /> Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label><FaUser /> Bio</label>
            <input
              type="text"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
            />
          </div>
          {/* زر الحفظ */}
          <button type="submit" className="save-profile-btn btn-basic" disabled={loading}>
            <FaSave /> {loading ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}