import { FaCheck, FaCheckDouble, FaReply, FaPen, FaRegSmile } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import MessageMedia from "./MessageMedia";

const EMOJI_LIST = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

/**
 * بابل رسالة واحدة في الشات: النص/الميديا، كارت الرد، الريأكشنز،
 * والمنيو الطائرة (ريأكت/رد/تعديل/حذف).
 */
export default function MessageBubble({
  msg,
  isMine,
  isGroup,
  hasMedia,
  showText,
  isCurrentSearchedMatch,
  activeReactionMenu,
  onToggleReactionMenu,
  onEmojiReact,
  onReply,
  onEdit,
  onDelete,
  onMediaClick,
}) {
  return (
    <div
      id={`msg-${msg._id}`}
      className={`message ${isMine ? "mine" : "theirs"} ${hasMedia ? "has-media" : ""} ${msg.isSending ? "optimistic-loading" : ""} ${isCurrentSearchedMatch ? "searched-highlight" : ""}`}
    >
      {!isMine && isGroup && (
        <div className="sender">
          {msg.sender?.firstName} {msg.sender?.lastName}
          {msg.sender?.username && (
            <span className="group-sender-username"> @{msg.sender.username}</span>
          )}
        </div>
      )}

      {/* كارت عرض الرد المدمج جوة البابل */}
      {msg.replyTo && (
        <div
          className="message-reply-inside-card"
          onClick={() => {
            const el = document.getElementById(`msg-${msg.replyTo?._id}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          <span className="reply-card-sender">
            {msg.replyTo.sender?.firstName || "User"}
          </span>
          <p className="reply-card-text">
            {msg.replyTo.text || "📁 Attachment / Voice"}
          </p>
        </div>
      )}

      {hasMedia && (
        <MessageMedia
          fileUrl={msg.fileUrl}
          fileType={msg.fileType}
          text={msg.text}
          onClick={onMediaClick}
        />
      )}
      {showText && !hasMedia && <div className="text">{msg.text}</div>}

      <div className="send-details">
        <div className={`timestamp ${isMine ? "mine" : "theirs"}`}>
          {msg.isEdited && <span className="edited-label-flag">edited </span>}
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {isMine && !isGroup && (
          <div className="seen">
            {msg.isSending ? (
              <span className="msg-sending-spinner" />
            ) : msg.seen ? (
              <FaCheckDouble />
            ) : (
              <FaCheck />
            )}
          </div>
        )}
      </div>

      {/* بادج عرض الإيموجيز المتفاعلة */}
      {msg.reactions && msg.reactions.length > 0 && (
        <div className="message-reactions-badge-container">
          {msg.reactions.map((react, i) => (
            <span
              key={i}
              className="single-reaction-badge"
              title={`Reacted by ${react.username}`}
            >
              {react.emoji}
            </span>
          ))}
        </div>
      )}

      {/* المنيو الطائرة بتوجيه سليم تماماً بدون ما تبوظ الـ Row */}
      <div
        className={`message-hover-actions-menu ${activeReactionMenu === msg._id ? "forced-show" : ""}`}
      >
        <div className="emoji-reaction-picker-tray">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiReact(msg._id, emoji)}
              className="tray-emoji-btn"
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="action-divider-pipe"></div>
        <button
          className="action-menu-icon-btn"
          onClick={() => onReply(msg)}
          title="Reply"
        >
          <FaReply />
        </button>
        {isMine && msg.fileType === "text" && !msg.isSending && (
          <button
            className="action-menu-icon-btn"
            onClick={() => onEdit(msg)}
            title="Edit"
          >
            <FaPen />
          </button>
        )}
        {isMine && !msg.isSending && (
          <button
            className="action-menu-icon-btn delete-btn"
            onClick={() => onDelete(msg._id)}
            title="Delete"
          >
            <FiX />
          </button>
        )}
        <button
          className="action-menu-icon-btn mobile-emoji-trigger"
          onClick={() => onToggleReactionMenu(msg._id)}
        >
          <FaRegSmile />
        </button>
      </div>
    </div>
  );
}