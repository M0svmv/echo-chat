import { useState } from "react";
import api from "../../../../api/axios";
import { FaSave } from "react-icons/fa";

import "../../../../styles/chat.css";

import PageHeader from "./children/PageHeader";
import FormMessage from "./children/FormMessage";
import PasswordField from "./children/PasswordField";

import useFormMessage from "./../../../hooks/useFormMessage";

export default function ChangePassword() {
  // الحقول مطابقة تماماً لما يتوقعه الباك إند (req.body)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // حالات إظهار/إخفاء كلمة المرور
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { loading, setLoading, message, clearMessage, setSuccess, setErrorFromResponse } =
    useFormMessage();

  // التعامل مع تغيير الحقول النصية
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // إرسال البيانات للباك إند
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessage();

    try {
      // إرسال البيانات الثلاثة للـ API المتوافق مع الكنترولر عندك
      const res = await api.put("/auth/update-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword,
      });

      setSuccess(res.data.message);

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      setErrorFromResponse(error, "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatsContainer">
      <PageHeader title="Change Password" />

      <div className="chat-items-container">
        <form onSubmit={handleSubmit} className="profile-form">
          <FormMessage message={message} />

          <PasswordField
            label="Current Password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            visible={showCurrent}
            onToggleVisible={() => setShowCurrent(!showCurrent)}
          />

          <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "20px 0" }} />

          <PasswordField
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            visible={showNew}
            onToggleVisible={() => setShowNew(!showNew)}
          />

          <PasswordField
            label="Confirm New Password"
            name="confirmNewPassword"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            visible={showConfirm}
            onToggleVisible={() => setShowConfirm(!showConfirm)}
          />

          <button type="submit" className="save-profile-btn" disabled={loading}>
            <FaSave /> {loading ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}