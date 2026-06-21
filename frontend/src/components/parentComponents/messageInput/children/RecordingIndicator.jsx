import { FaTimes } from "react-icons/fa";
import { IoPaperPlaneOutline } from "react-icons/io5";

/**
 * شريط تسجيل الصوت: عداد وقت، رسوم متحركة للويفز، وزراير
 * إلغاء/إرسال التسجيل.
 */
export default function RecordingIndicator({ duration, onCancel, onSend }) {
  const mins = String(Math.floor(duration / 60)).padStart(2, "0");
  const secs = String(duration % 60).padStart(2, "0");

  return (
    <div className="message-input-container">
      <div className="recording-bar">
        <div className="recording-circle">
          <div className="recording-pulse" />
          <span className="recording-label">Recording</span>
          <span className="recording-timer">
            {mins}:{secs}
          </span>
        </div>

        <div className="recording-waves">
          {Array.from({ length: 10 }).map((_, i) => (
            <div className="wave-bar" key={i}></div>
          ))}
        </div>

        <div className="recording-actions">
          <button
            className="message-send-button rec-cancel"
            onClick={onCancel}
            title="Cancel Recording"
          >
            <FaTimes />
          </button>
          <button className="message-send-button" onClick={onSend} title="Send Recording">
            <IoPaperPlaneOutline />
          </button>
        </div>
      </div>
    </div>
  );
}