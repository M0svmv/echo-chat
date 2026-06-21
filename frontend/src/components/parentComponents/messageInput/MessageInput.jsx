import "../../../styles/messageInput.css";

import CameraModal from "../../shared/CameraModal";

import AttachmentPreview from "./children/AttachmentPreview";
import RecordingIndicator from "./children/RecordingIndicator";
import InputActionBar from "./children/InputActionBar";
import MessageInputToolbar from "./children/MessageInputToolbar";

import useMessageComposer from "./../../hooks/useMessageComposer";
import useAutoResizeTextarea from "./../../hooks/useAutoResizeTextarea";

export default function MessageInput() {
  const {
    textareaRef,
    fileInputRef,
    activeConversation,
    replyingTo,
    editingMessage,
    text,
    setText,
    blockError,
    attachedFile,
    setAttachedFile,
    isSending,
    showCamera,
    setShowCamera,
    hasContent,
    isRecording,
    recordDuration,
    startRecording,
    stopRecording,
    sendRecording,
    sendMessage,
    handleFileSelect,
    closeReply,
    closeEdit,
  } = useMessageComposer();

  const { handleChangeResize, handleBlurReset } = useAutoResizeTextarea(textareaRef);

  const handleChange = (e) => {
    setText(e.target.value);
    handleChangeResize(e);
  };

  const handleBlur = (e) => {
    handleBlurReset(e, text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!activeConversation) return null;

  // 🚫 فحص البلوك وعرض الكونتينر المخصص له القادم من الكود القديم
  if (blockError) return <div className="message-blocked-container">{blockError}</div>;

  // 🎙️ في حالة تسجيل الصوت: يرجع الـ RecordingIndicator المنفصل بكامل مميزاته والـ Waves
  if (isRecording) {
    return (
      <div className="message-input-wrapper">
        <RecordingIndicator
          duration={recordDuration}
          onCancel={() => stopRecording(true)}
          onSend={sendRecording}
        />
      </div>
    );
  }

  return (
    <div className="message-input-wrapper">
      {showCamera && (
        <CameraModal onClose={() => setShowCamera(false)} onCapture={(file) => setAttachedFile(file)} />
      )}

      <div className="message-input-container">
        {editingMessage && (
          <InputActionBar
            variant="edit"
            title="Editing Message"
            subtitle={editingMessage.text}
            onClose={closeEdit}
          />
        )}

        {replyingTo && !editingMessage && (
          <InputActionBar
            variant="reply"
            title={`Replying to ${replyingTo.sender?.firstName || "User"}`}
            subtitle={replyingTo.text || "📁 Attachment / Voice Note"}
            onClose={closeReply}
          />
        )}

        {/* حاوية معاينات الملفات المرفقة */}
        <div className="message-attach-container">
          {attachedFile && (
            <AttachmentPreview file={attachedFile} onRemove={() => setAttachedFile(null)} />
          )}
        </div>

        <MessageInputToolbar
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
          text={text}
          isSending={isSending}
          isEditing={!!editingMessage}
          hasContent={hasContent}
          onTextChange={handleChange}
          onTextBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onAttachClick={() => fileInputRef.current?.click()}
          onCameraClick={() => setShowCamera(true)}
          onFileSelect={handleFileSelect}
          onSend={sendMessage}
          onStartRecording={startRecording}
        />
      </div>
    </div>
  );
}