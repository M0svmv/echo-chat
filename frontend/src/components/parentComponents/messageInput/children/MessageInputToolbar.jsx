import { IoPaperPlaneOutline } from "react-icons/io5";
import { FaPaperclip, FaMicrophone } from "react-icons/fa6";
import { FaCamera } from "react-icons/fa";

/**
 * صف أدوات الإدخال الأساسي: زرار الإرفاق، زرار الكاميرا، حقل
 * الـ input الخفي للملفات، الـ textarea، وزرار الإرسال (أو
 * الميكروفون لو الحقل فاضي).
 */
export default function MessageInputToolbar({
  textareaRef,
  fileInputRef,
  text,
  isSending,
  isEditing,
  hasContent,
  onTextChange,
  onTextBlur,
  onKeyDown,
  onAttachClick,
  onCameraClick,
  onFileSelect,
  onSend,
  onStartRecording,
}) {
  return (
    <div className="message-inputs-container">
      <button
        className="message-attach-button"
        onClick={onAttachClick}
        title="Attach file"
        disabled={isSending || isEditing}
      >
        <FaPaperclip />
      </button>

      <button
        className="message-attach-button"
        style={{ marginLeft: "25px" }}
        onClick={onCameraClick}
      >
        <FaCamera />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.docx,.zip"
        style={{ display: "none" }}
        onChange={onFileSelect}
      />

      <textarea
        ref={textareaRef}
        className="message-input"
        placeholder={
          isSending ? "Uploading file..." : isEditing ? "Edit your message..." : "Type a message..."
        }
        value={text}
        onChange={onTextChange}
        onBlur={onTextBlur}
        onKeyDown={onKeyDown}
        disabled={isSending}
      />

      {hasContent ? (
        <button
          className="message-send-button"
          onClick={onSend}
          title={isEditing ? "Save changes" : "Send"}
          disabled={isSending}
        >
          <IoPaperPlaneOutline />
        </button>
      ) : (
        <button
          className="message-send-button"
          onClick={onStartRecording}
          title="Record voice message"
          disabled={isSending}
        >
          <FaMicrophone />
        </button>
      )}
    </div>
  );
}