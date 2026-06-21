import { FaCamera } from "react-icons/fa";

/**
 * أفاتار البروفايل، يدعم وضعين:
 * - readOnly (Profile.jsx): مجرد عرض، صورة أو حروف أولى، بدون أي تفاعل
 * - قابل للتعديل (UpdateProfile.jsx): قابل للضغط لفتح اختيار صورة جديدة،
 *   مع overlay لأيقونة الكاميرا
 */
export default function ProfileAvatar({
  imageUrl,
  firstName,
  lastName,
  readOnly = false,
  onClick,
  altText = "Avatar",
  children,
}) {
  const containerClass = readOnly
    ? "profile-avatar-container read-only"
    : "profile-avatar-container";

  return (
    <div className="avatar-upload-section">
      <div className={containerClass} onClick={readOnly ? undefined : onClick}>
        {imageUrl ? (
          <img src={imageUrl} alt={altText} className="profile-preview-avatar" />
        ) : (
          <div className="avatarPlaceholder large">
            {firstName?.charAt(0).toUpperCase()}
            {lastName?.charAt(0).toUpperCase()}
          </div>
        )}
        {!readOnly && (
          <div className="avatar-overlay">
            <FaCamera />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}