import { FaTimes } from "react-icons/fa";
import CustomAudioPlayer from "../../../shared/CustomAudioPlayer";

/**
 * يحدد الأيقونة والكلاس المناسبين لملف غير صورة/فيديو/صوت
 * بناءً على امتداده.
 */
function getGenericFileMeta(fileName) {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    return { icon: "📕", fileClass: "pdf" };
  }
  if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
    return { icon: "📘", fileClass: "word" };
  }
  if (lowerName.endsWith(".zip") || lowerName.endsWith(".rar")) {
    return { icon: "📦", fileClass: "archive" };
  }
  return { icon: "📄", fileClass: "generic" };
}

/**
 * معاينة الملف المرفق قبل الإرسال: صورة، فيديو، صوت، أو أيقونة ملف عام
 * (PDF/Word/Archive) مع اسمه. مع زرار لإزالة المرفق.
 */
export default function AttachmentPreview({ file, onRemove }) {
  const url = URL.createObjectURL(file);
  const type = file.type;

  const isImage = type.startsWith("image/");
  const isVideo = type.startsWith("video/");
  const isAudio = type.startsWith("audio/");
  const isGenericFile = !isImage && !isVideo && !isAudio;

  return (
    <div className="attachment-preview">
      <button className="remove-attachment" onClick={onRemove} title="Remove">
        <FaTimes />
      </button>

      {isImage && <img src={url} alt="preview" className="preview-image" />}

      {isVideo && <video src={url} className="preview-video" controls />}

      {isAudio && <CustomAudioPlayer src={url} className="preview-audio" controls />}

      {isGenericFile &&
        (() => {
          const { icon, fileClass } = getGenericFileMeta(file.name);
          return (
            <div className={`preview-file ${fileClass}-preview`}>
              <span className="preview-file-icon">{icon}</span>
              <span className="preview-file-name">{file.name}</span>
            </div>
          );
        })()}
    </div>
  );
}