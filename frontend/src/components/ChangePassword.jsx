import { useState } from "react";
import api from "../api/axios";

// استيراد الأيقونات المناسبة لتغيير كلمة المرور
import { FaLock, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";

import "../styles/chat.css";

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

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // التعامل مع تغيير الحقول النصية
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // إرسال البيانات للباك إند
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // إرسال البيانات الثلاثة للـ API المتوافق مع الكنترولر عندك
      const res = await api.put("/auth/update-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword,
      });

      
      setMessage({ type: "success", text: res.data.message });
      
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update password";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatsContainer">
      <h3 className="pg-title">Change Password</h3>
      
      <div className="chat-items-container">
        <form onSubmit={handleSubmit} className="profile-form">
          
          {/* رسائل النجاح أو الخطأ من السيرفر */}
          {message.text && (
            <div className={`form-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* حقل كلمة المرور الحالية */}
          <div className="form-group">
            <label><FaLock /> Current Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                style={{width:"var(--full-percent)" }}
              />
              <span 
                onClick={() => setShowCurrent(!showCurrent)} 
                style={{ position: "absolute", right: "12px", top: "35%", cursor: "pointer", color: "#888" }}
              >
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "20px 0" }} />

          {/* حقل كلمة المرور الجديدة */}
          <div className="form-group">
            <label><FaLock /> New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                style={{width:"var(--full-percent)" }}
              />
              <span 
                onClick={() => setShowNew(!showNew)} 
                style={{ position: "absolute", right: "12px", top: "35%", cursor: "pointer", color: "#888" }}
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* حقل تأكيد كلمة المرور الجديدة - name="confirmNewPassword" */}
          <div className="form-group">
            <label><FaLock /> Confirm New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                required
                style={{width:"var(--full-percent)" }}
              />
              <span 
                onClick={() => setShowConfirm(!showConfirm)} 
                style={{ position: "absolute", right: "12px", top: "35%", cursor: "pointer", color: "#888" }}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* زر الحفظ */}
          <button type="submit" className="save-profile-btn" disabled={loading}>
            <FaSave /> {loading ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}