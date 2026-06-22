import { useSelector, useDispatch } from "react-redux";
import { clearMediaPreview } from "../../features/chat/chatSlice";
import { FiX } from "react-icons/fi";

const MediaPreviewModal = () => {
  const dispatch = useDispatch();
  const mediaPreview = useSelector((state) => state.chat.mediaPreview);

  if (!mediaPreview) return null;

  return (
    <div className="media-preview-modal-overlay" onClick={() => dispatch(clearMediaPreview())}>
      <div className="media-preview-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* زر الإغلاق */}
        <button className="media-preview-close-btn" onClick={() => dispatch(clearMediaPreview())}>
          <FiX />
        </button>

        {/* إذا كانت الميديا صورة */}
        {mediaPreview.type === "image" && (
          <img src={mediaPreview.url} alt="Preview" className="media-preview-element" />
        )}

        {/* إذا كانت الميديا فيديو */}
        {mediaPreview.type === "video" && (
          <video src={mediaPreview.url} controls autoPlay className="media-preview-element" />
        )}
      </div>
    </div>
  );
};

export default MediaPreviewModal;