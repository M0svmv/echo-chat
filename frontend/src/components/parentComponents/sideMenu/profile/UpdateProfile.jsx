import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../../../api/axios";
import { updateProfileSuccess } from "../../../../features/auth/authSlice"; // تأكد من مسار الـ slice عندك
import socket from "../../../../socket/socket";

import { FaUser, FaAt, FaEnvelope, FaSave } from "react-icons/fa";

import "../../../../styles/chat.css";

import PageHeader from "./children/PageHeader";
import FormMessage from "./children/FormMessage";
import ProfileAvatar from "./children/ProfileAvatar";
import LabeledInput from "./children/LabeledInput";

import useFormMessage from "./../../../hooks/useFormMessage";

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

  const { loading, setLoading, message, clearMessage, setSuccess, setErrorFromResponse } =
    useFormMessage();

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
    clearMessage();

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

      setSuccess("Profile updated successfully!");
    } catch (error) {
      setErrorFromResponse(error, "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatsContainer">
      {/* الهيدر بنفس روح الـ ConversationsList */}
      <PageHeader title="Edit Profile" />

      <div className="chat-items-container">
        <form onSubmit={handleSubmit} className="profile-form">
          <ProfileAvatar
            imageUrl={previewUrl}
            firstName={formData.firstName}
            lastName={formData.lastName}
            altText="Avatar Preview"
            onClick={triggerFileInput}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: "none" }}
            />
            <p className="upload-hint">Click on avatar to change photo</p>
          </ProfileAvatar>

          <FormMessage message={message} />

          <div className="form-group-row">
            <LabeledInput
              icon={<FaUser />}
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            <LabeledInput
              icon={<FaUser />}
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <LabeledInput
            icon={<FaAt />}
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <LabeledInput
            icon={<FaEnvelope />}
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <LabeledInput
            icon={<FaUser />}
            label="Bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
          />

          <button type="submit" className="save-profile-btn btn-basic" disabled={loading}>
            <FaSave /> {loading ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}