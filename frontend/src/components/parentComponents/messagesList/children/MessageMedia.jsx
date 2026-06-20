import { memo } from "react";
import { FaFileAlt, FaDownload } from "react-icons/fa";
import { FaRegFilePdf, FaRegFileZipper } from "react-icons/fa6";
import CustomAudioPlayer from "../../../shared/CustomAudioPlayer";

// ===== مكون عرض الميديا =====
const MessageMedia = memo(({ fileUrl, fileType, text, onClick }) => {
  if (!fileUrl || fileType === "text") return null;

  if (fileType === "image") {
    return (
      <div className="msg-media-wrapper" onClick={onClick}>
        <img src={fileUrl} alt="Image" className="msg-image" loading="lazy" />
        {text && <p className="msg-caption">{text}</p>}
      </div>
    );
  }

  if (fileType === "video") {
    return (
      <div className="msg-media-wrapper">
        <video
          src={fileUrl}
          className="msg-video"
          controls
          preload="metadata"
        />
        {text && <p className="msg-caption">{text}</p>}
      </div>
    );
  }

  if (fileType === "audio") {
    return (
      <div className="msg-audio-wrapper">
        <CustomAudioPlayer src={fileUrl} className="msg-audio" />
      </div>
    );
  }

  const fileName = fileUrl.split("/").pop().split("?")[0] || "Download File";
  const lowerFileName = fileName.toLowerCase();

  let fileIcon = <FaFileAlt className="msg-file-icon" />;
  let fileClass = "generic-file";

  if (lowerFileName.endsWith(".pdf")) {
    fileIcon = <FaRegFilePdf className="msg-file-icon" />;
    fileClass = "pdf-file";
  } else if (lowerFileName.endsWith(".zip") || lowerFileName.endsWith(".rar")) {
    fileIcon = <FaRegFileZipper className="msg-file-icon" />;
    fileClass = "archive-file";
  } else if (
    lowerFileName.endsWith(".docx") ||
    lowerFileName.endsWith(".doc")
  ) {
    fileClass = "word-file";
  }

  return (
    <div className={`msg-file-wrapper ${fileClass}`}>
      {fileIcon}
      <span className="msg-file-name">{fileName}</span>
      <a
        href={fileUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="msg-file-download"
        title="Download"
      >
        <FaDownload />
      </a>
    </div>
  );
});
MessageMedia.displayName = "MessageMedia";

export default MessageMedia;