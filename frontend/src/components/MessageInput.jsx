import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { addMessage } from "../features/chat/chatSlice";
import '../styles/messageInput.css';
import { IoPaperPlaneOutline } from "react-icons/io5";
import { FaPaperclip, FaMicrophone } from "react-icons/fa6";
import { FaStop, FaTimes } from "react-icons/fa";

// ===== مكون عرض الـ Preview قبل الإرسال =====
function AttachmentPreview({ file, onRemove }) {
  const url = URL.createObjectURL(file);
  const type = file.type;

  return (
    <div className="attachment-preview">
      <button className="remove-attachment" onClick={onRemove} title="Remove">
        <FaTimes />
      </button>

      {type.startsWith("image/") && (
        <img src={url} alt="preview" className="preview-image" />
      )}

      {type.startsWith("video/") && (
        <video src={url} className="preview-video" controls />
      )}

      {type.startsWith("audio/") && (
        <audio src={url} className="preview-audio" controls />
      )}

      {!type.startsWith("image/") && !type.startsWith("video/") && !type.startsWith("audio/") && (
        <div className="preview-file">
          <span className="preview-file-icon">📄</span>
          <span className="preview-file-name">{file.name}</span>
        </div>
      )}
    </div>
  );
}

// ===== مكون الريكورد =====
function RecordingIndicator({ duration, onCancel, onSend }) {
  const mins = String(Math.floor(duration / 60)).padStart(2, "0");
  const secs = String(duration % 60).padStart(2, "0");

  return (
    <div className="recording-bar">
      <div className="recording-pulse" />
      <span className="recording-label">Recording</span>
      <span className="recording-timer">{mins}:{secs}</span>
      <div className="recording-actions">
        <button className="rec-cancel-btn" onClick={onCancel} title="Cancel Recording">
          <FaTimes />
          <span>Cancel</span>
        </button>
        <button className="rec-send-btn" onClick={onSend} title="Send Recording">
          <IoPaperPlaneOutline />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}

export default function MessageInput() {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const dispatch = useDispatch();
  const [text, setText] = useState("");
  const [blockError, setBlockError] = useState("");
  const [attachedFile, setAttachedFile] = useState(null); 
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const activeConversation = useSelector((state) => state.chat.activeConversation);
  const user = useSelector((state) => state.auth.user);

  const hasContent = text.trim().length > 0 || attachedFile !== null;

  useEffect(() => {
    setBlockError("");
    setAttachedFile(null);
    setText("");
    stopRecording(true); 
    setIsSending(false);
  }, [activeConversation?._id]);

  // ===== دالة توليد رسالة مؤقتة للـ Optimistic UI =====
  const createOptimisticMessage = (textField, fileField) => {
    let fileType = "text";
    if (fileField) {
      if (fileField.type.startsWith("image/")) fileType = "image";
      else if (fileField.type.startsWith("video/")) fileType = "video";
      else if (fileField.type.startsWith("audio/")) fileType = "audio";
      else fileType = "file";
    }

    return {
      _id: `temp-${Date.now()}`,
      conversationId: activeConversation._id,
      sender: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username
      },
      text: textField || "",
      fileUrl: fileField ? URL.createObjectURL(fileField) : "",
      fileType,
      createdAt: new Date().toISOString(),
      isSending: true
    };
  };

  // ===== إرسال الرسالة (نص أو ملف) =====
  const sendMessage = useCallback(async () => {
    if (!activeConversation || isSending) return;
    if (!text.trim() && !attachedFile) return;

    const currentText = text.trim();
    const currentFile = attachedFile;

    setIsSending(true);
    setText("");
    setAttachedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // 1. إضافة الرسالة فوراً كـ Optimistic UI وتمرير الـ currentUserId
    const tempMsg = createOptimisticMessage(currentText, currentFile);
    dispatch(addMessage({ message: tempMsg, currentUserId: user?._id }));

    try {
      let response;
      if (currentFile) {
        const formData = new FormData();
        formData.append("file", currentFile);
        formData.append("conversationId", activeConversation._id);
        if (currentText) formData.append("text", currentText);

        response = await api.post("/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/messages", {
          conversationId: activeConversation._id,
          text: currentText,
        });
      }

      // 2. استبدال الرسالة المؤقتة بالرسالة الحقيقية
      dispatch(addMessage({ 
        message: { ...response.data, tempId: tempMsg._id }, 
        currentUserId: user?._id 
      }));
      setBlockError("");
    } catch (error) {
      if (error.response?.status === 403) {
        setBlockError(error.response.data.message);
      } else {
        console.error("Send Message Error:", error);
      }
    } finally {
      setIsSending(false);
    }
  }, [activeConversation, text, attachedFile, isSending, dispatch, user]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let options = { mimeType: 'audio/webm' };
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100); 
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required to record audio.");
    }
  };

  const stopRecording = useCallback((cancel = false) => {
    if (!mediaRecorderRef.current) return;
    const recorder = mediaRecorderRef.current;
    clearInterval(timerRef.current);

    recorder.ondataavailable = null;
    recorder.onstop = null;
    
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    recorder.stream?.getTracks().forEach((t) => t.stop());

    mediaRecorderRef.current = null;
    setIsRecording(false);
    setRecordDuration(0);
  }, []);

  const sendRecording = useCallback(() => {
    if (!mediaRecorderRef.current || isSending) return;

    const recorder = mediaRecorderRef.current;
    clearInterval(timerRef.current);
    setIsSending(true);

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const extension = mimeType.includes("mp4") ? "mp4" : "wav";
      
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const audioFile = new File([blob], `voice-${Date.now()}.${extension}`, { type: mimeType });

      recorder.stream?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordDuration(0);

      // إضافة الريكورد فوراً كـ Optimistic UI
      const tempMsg = createOptimisticMessage("", audioFile);
      dispatch(addMessage({ message: tempMsg, currentUserId: user?._id }));

      try {
        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("conversationId", activeConversation._id);

        const response = await api.post("/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        dispatch(addMessage({ 
          message: { ...response.data, tempId: tempMsg._id }, 
          currentUserId: user?._id 
        }));
      } catch (error) {
        if (error.response?.status === 403) {
          setBlockError(error.response.data.message);
        } else {
          console.error("Send Voice Error:", error);
        }
      } finally {
        setIsSending(false);
      }
    };

    recorder.stop();
  }, [activeConversation, isSending, dispatch, user]);

  const handleChange = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleBlur = (e) => {
    if (!text.trim()) {
      e.target.style.height = "var(--avatar-size, 40px)";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!activeConversation) return null;
  if (blockError) return <div className="message-blocked-container">{blockError}</div>;

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
      {attachedFile && (
        <AttachmentPreview
          file={attachedFile}
          onRemove={() => setAttachedFile(null)}
        />
      )}

      <div className="message-input-container">
        <button
          className="message-attach-button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          disabled={isSending}
        >
          <FaPaperclip />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.docx,.zip"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder={isSending ? "Uploading file..." : "Type a message..."}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />

        {hasContent ? (
          <button
            className="message-send-button"
            onClick={sendMessage}
            title="Send"
            disabled={isSending}
          >
            <IoPaperPlaneOutline />
          </button>
        ) : (
          <button
            className="message-mic-button"
            onClick={startRecording}
            title="Record voice message"
            disabled={isSending}
          >
            <FaMicrophone />
          </button>
        )}
      </div>
    </div>
  );
}