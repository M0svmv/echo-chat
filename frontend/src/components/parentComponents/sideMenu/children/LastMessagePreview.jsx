import { FaCheck, FaCheckDouble } from "react-icons/fa";

/**
 * يحسب نص العرض المناسب لآخر رسالة (نص عادي أو وصف ميديا بأيقونة).
 */
function getLastMessageText(lastMessage, showMediaIcons) {
  if (showMediaIcons && lastMessage.fileUrl && lastMessage.fileType !== "text") {
    let icon = "📁 ";
    let typeText = "File";

    if (lastMessage.fileType === "image") {
      icon = "📷 ";
      typeText = "Photo";
    } else if (lastMessage.fileType === "video") {
      icon = "🎥 ";
      typeText = "Video";
    } else if (lastMessage.fileType === "audio") {
      icon = "🎤 ";
      typeText = "Voice message";
    }

    return lastMessage.text ? `${icon} ${typeText}: ${lastMessage.text}` : `${icon} ${typeText}`;
  }

  return lastMessage.text || "Sent an attachment";
}

/**
 * يعرض آخر رسالة في عنصر المحادثة بقايمة السايد بار:
 * - اسم المرسل ("You" أو اسم/يوزرنيم)
 * - نص الرسالة (أو وصف ميديا لو showMediaIcons مفعّلة)
 * - وقت الإرسال
 * - علامة الصح/الصحين لو showSeenStatus مفعّلة وأنت المرسل
 *
 * @param {boolean} showMediaIcons - إظهار أيقونات الميديا (📷🎥🎤) بدل النص الخام
 * @param {boolean} showSeenStatus - إظهار علامة الصح/الصحين للرسايل اللي أنت باعتها
 */
export default function LastMessagePreview({
  lastMessage,
  currentUserId,
  showMediaIcons = false,
  showSeenStatus = false,
}) {
  if (!lastMessage) return null;

  const senderId = (lastMessage.sender?._id || lastMessage.sender || "").toString();
  const isMine = senderId === currentUserId?.toString();
  const senderLabel = isMine
    ? "You"
    : lastMessage.sender?.firstName || `@${lastMessage.sender?.username || "user"}`;

  return (
    <div className="last-message">
      <span className="last-message-text">
        <span className="last-message-name">{senderLabel}:</span>{" "}
        {getLastMessageText(lastMessage, showMediaIcons)}
      </span>
      <span className="last-message-time">
        {showSeenStatus && isMine && (
          <span className="last-message-seen">
            {lastMessage.seen ? <FaCheckDouble /> : <FaCheck />}
          </span>
        )}
        {new Date(lastMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}