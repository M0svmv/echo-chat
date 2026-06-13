import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { 
  addMessage, 
  updateEditedMessage, 
  setReplyingTo,       
  setEditingMessage 
} from "../features/chat/chatSlice";
import '../styles/messageInput.css';
import { IoPaperPlaneOutline } from "react-icons/io5";
import { FaPaperclip, FaMicrophone } from "react-icons/fa6";
import { FaStop, FaTimes, FaPen } from "react-icons/fa";
import { FiX } from "react-icons/fi"; 

import CustomAudioPlayer from "./CustomAudioPlayer";

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
        <CustomAudioPlayer src={url} className="preview-audio" controls />
      )}

      {!type.startsWith("image/") && !type.startsWith("video/") && !type.startsWith("audio/") && (
        (() => {
          const fileName = file.name.toLowerCase();
          let fileIcon = "📄";
          let fileClass = "generic";

          if (fileName.endsWith(".pdf")) {
            fileIcon = "📕";
            fileClass = "pdf";
          } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
            fileIcon = "📘";
            fileClass = "word";
          } else if (fileName.endsWith(".zip") || fileName.endsWith(".rar")) {
            fileIcon = "📦";
            fileClass = "archive";
          }

          return (
            <div className={`preview-file ${fileClass}-preview`}>
              <span className="preview-file-icon">{fileIcon}</span>
              <span className="preview-file-name">{file.name}</span>
            </div>
          );
        })()
      )}
    </div>
  );
}

// ===== مكون الريكورد القياسي القديم مع الـ Waves =====
function RecordingIndicator({ duration, onCancel, onSend }) {
  const mins = String(Math.floor(duration / 60)).padStart(2, "0");
  const secs = String(duration % 60).padStart(2, "0");

  return (
    <div className="message-input-container">
      <div className="recording-bar">
        <div className="recording-circle">
          <div className="recording-pulse" />
          <span className="recording-label">Recording</span>
          <span className="recording-timer">{mins}:{secs}</span>
        </div>  
        
        <div className="recording-waves">
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
        </div>

        <div className="recording-actions">
          <button className="message-send-button rec-cancel" onClick={onCancel} title="Cancel Recording">
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

export default function MessageInput() {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const dispatch = useDispatch();
  
  // الحالات المقروءة من Redux
  const activeConversation = useSelector((state) => state.chat.activeConversation);
  const user = useSelector((state) => state.auth.user);
  const replyingTo = useSelector((state) => state.chat.replyingTo);
  const editingMessage = useSelector((state) => state.chat.editingMessage);

  // الحالات المحلية (Local States) من الكود القديم والجديد
  const [text, setText] = useState("");
  const [blockError, setBlockError] = useState("");
  const [attachedFile, setAttachedFile] = useState(null); 
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const hasContent = text.trim().length > 0 || attachedFile !== null;

  // تفريغ وتصفير الحالات عند الانتقال بين المحادثات فوراً لعدم التداخل
  useEffect(() => {
    setBlockError("");
    setAttachedFile(null);
    setText("");
    stopRecording(true); 
    setIsSending(false);
    dispatch(setReplyingTo(null));
    dispatch(setEditingMessage(null));
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [activeConversation?._id, dispatch]);

  // تحديث النص تلقائياً بمجرد دخول وضع الـ Edit
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    } else {
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  }, [editingMessage]);

  // ===== دالة توليد رسالة مؤقتة للـ Optimistic UI (تم تحديثها لدعم الـ replyTo) =====
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
      replyTo: replyingTo ? replyingTo : undefined, // الحفاظ على بيانات الرد في الـ Optimistic UI
      createdAt: new Date().toISOString(),
      isSending: true
    };
  };

  // ===== إرسال / تعديل الرسائل =====
  const sendMessage = useCallback(async () => {
    if (!activeConversation || isSending) return;
    if (!text.trim() && !attachedFile && !editingMessage) return;

    const currentText = text.trim();
    const currentFile = attachedFile;

    // 1️⃣ حالة التعديل (Edit Mode) -> تضرب راوت /messages/edit/:id
    if (editingMessage) {
      if (!currentText) return;
      const targetId = editingMessage._id;

      // إغلاق وضع التعديل وتصفير الحقل فوراً لتوفير تجربة مستخدم سريعة
      dispatch(setEditingMessage(null));
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      try {
        const response = await api.put(`/messages/edit/${targetId}`, { text: currentText });
        dispatch(updateEditedMessage({
          messageId: targetId,
          conversationId: activeConversation._id,
          text: response.data.text,
          isEdited: true
        }));
        setBlockError("");
      } catch (error) {
        if (error.response?.status === 403) {
          setBlockError(error.response.data.message);
        } else {
          console.error("Failed to edit message:", error);
        }
      }
      return;
    }

    // 2️⃣ حالة الإرسال العادي أو الـ Reply
    setIsSending(true);
    setText("");
    setAttachedFile(null);
    const currentReplyingTo = replyingTo;
    if (currentReplyingTo) dispatch(setReplyingTo(null)); // إغلاق شريط الرد المعلق فوراً بعد ضغط الإرسال
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // البناء الفوري للـ Optimistic UI
    const tempMsg = createOptimisticMessage(currentText, currentFile);
    dispatch(addMessage({ message: tempMsg, currentUserId: user?._id }));

    try {
      let response;
      const formData = new FormData();
      formData.append("conversationId", activeConversation._id);
      if (currentText) formData.append("text", currentText);
      if (currentReplyingTo) formData.append("replyTo", currentReplyingTo._id);

      if (currentFile) {
        formData.append("file", currentFile);
        response = await api.post("/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // إذا لم يوجد ملف، يمكن إرسالها كـ JSON عادي أو FormData. الباكيند عندك يستقبل كلاهما على "/"
        response = await api.post("/messages", {
          conversationId: activeConversation._id,
          text: currentText,
          replyTo: currentReplyingTo ? currentReplyingTo._id : undefined
        });
      }

      // استبدال الـ Optimistic بالرد الحقيقي القادم من السيرفر
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
  }, [activeConversation, text, attachedFile, editingMessage, replyingTo, isSending, dispatch, user]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
    e.target.value = "";
  };

  // ===== الريكورد وتجهيز البلوكات الصوتية =====
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

    const currentReplyingTo = replyingTo;
    if (currentReplyingTo) dispatch(setReplyingTo(null));

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const extension = mimeType.includes("mp4") ? "mp4" : "wav";
      
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const audioFile = new File([blob], `voice-${Date.now()}.${extension}`, { type: mimeType });

      recorder.stream?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordDuration(0);

      // البناء الفوري للريكورد كـ Optimistic UI
      const tempMsg = createOptimisticMessage("", audioFile);
      dispatch(addMessage({ message: tempMsg, currentUserId: user?._id }));

      try {
        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("conversationId", activeConversation._id);
        if (currentReplyingTo) formData.append("replyTo", currentReplyingTo._id);

        const response = await api.post("/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        dispatch(addMessage({ 
          message: { ...response.data, tempId: tempMsg._id }, 
          currentUserId: user?._id 
        }));
        setBlockError("");
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
  }, [activeConversation, isSending, replyingTo, dispatch, user]);

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
  
  // 🚫 فحص البلوك وعرض الكونتينر المخصص له القادم من الكود القديم
  if (blockError) return <div className="message-blocked-container">{blockError}</div>;

  // 🎙️ في حالة تسجيل الصوت: يرجع الـ RecordingIndicator المنفصل القديم بكامل مميزاته والـ Waves
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
      
      {/* ==========================================================================
         🎮 أشرطة الرد والتعديل المعلقة (تظهر فوق شريط الـ Input وتحت الرسائل مباشرة)
         ========================================================================== */}
      
      {/* 1. شريط معاينة الرد (Reply Preview) */}
      

      {/* 2. شريط معاينة التعديل (Edit Preview) */}
      

      {/* شريط الإدخال الرئيسي */}
      <div className="message-input-container">

      {editingMessage && (
        <div className="input-action-bar-preview ">
          <div className="bar-vertical-line edit-line"></div>
          <div className="action-bar-content">
            <span className="action-title edit-title">Editing Message</span>
            <span className="action-subtitle">{editingMessage.text}</span>
          </div>
          <button className="close-action-bar" onClick={() => dispatch(setEditingMessage(null))}>
            <FiX />
          </button>
        </div>
      )}

      {replyingTo && !editingMessage && (
        <div className="input-action-bar-preview">
          <div className="bar-vertical-line"></div>
          <div className="action-bar-content">
            <span className="action-title">Replying to {replyingTo.sender?.firstName || "User"}</span>
            <span className="action-subtitle">{replyingTo.text || "📁 Attachment / Voice Note"}</span>
          </div>
          <button className="close-action-bar" onClick={() => dispatch(setReplyingTo(null))}>
            <FiX />
          </button>
        </div>
      )}
        
        {/* حاوية معاينات الملفات المرفقة */}
        <div className="message-attach-container">
          {attachedFile && (
            <AttachmentPreview
              file={attachedFile}
              onRemove={() => setAttachedFile(null)}
            />
          )}
        </div>

        {/* حاوية أدوات الإدخال والـ Buttons */}
        <div className="message-inputs-container">
          <button
            className="message-attach-button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            disabled={isSending || !!editingMessage} // تعطيل الإرفاق أثناء تعديل نص قائم
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
            placeholder={isSending ? "Uploading file..." : editingMessage ? "Edit your message..." : "Type a message..."}
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
              title={editingMessage ? "Save changes" : "Send"}
              disabled={isSending}
            >
              <IoPaperPlaneOutline />
            </button>
          ) : (
            <button
              className="message-send-button"
              onClick={startRecording}
              title="Record voice message"
              disabled={isSending}
            >
              <FaMicrophone />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}