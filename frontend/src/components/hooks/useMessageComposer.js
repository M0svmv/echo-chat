import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axios";
import {
  addMessage,
  updateEditedMessage,
  setReplyingTo,
  setEditingMessage,
} from "../../features/chat/chatSlice";
import useAudioRecorder from "./useAudioRecorder";

/**
 * هوك مسؤول عن كل حالة ومنطق صندوق إدخال الرسائل:
 * - النص المكتوب والملف المرفق
 * - وضعية الرد (reply) والتعديل (edit) المتزامنة مع Redux
 * - بناء وإرسال الرسالة (نص/ملف/صوت) مع Optimistic UI
 * - تفريغ الحالة فورًا عند تغيير المحادثة النشطة
 * - فحص رسالة الحظر (blockError) القادمة من السيرفر
 */
export default function useMessageComposer() {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const dispatch = useDispatch();

  const activeConversation = useSelector((state) => state.chat.activeConversation);
  const user = useSelector((state) => state.auth.user);
  const replyingTo = useSelector((state) => state.chat.replyingTo);
  const editingMessage = useSelector((state) => state.chat.editingMessage);

  const [text, setText] = useState("");
  const [blockError, setBlockError] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const hasContent = text.trim().length > 0 || attachedFile !== null;

  // ===== دالة توليد رسالة مؤقتة للـ Optimistic UI (تدعم الـ replyTo) =====
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
        username: user.username,
      },
      text: textField || "",
      fileUrl: fileField ? URL.createObjectURL(fileField) : "",
      fileType,
      replyTo: replyingTo ? replyingTo : undefined,
      createdAt: new Date().toISOString(),
      isSending: true,
    };
  };

  // ===== إرسال ملف صوتي تم تسجيله بالفعل (يُستدعى من useAudioRecorder) =====
  const submitRecordedAudio = async (audioFile) => {
    const currentReplyingTo = replyingTo;

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

      dispatch(
        addMessage({
          message: { ...response.data, tempId: tempMsg._id },
          currentUserId: user?._id,
        }),
      );
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

  const { isRecording, recordDuration, startRecording, stopRecording, sendRecording } =
    useAudioRecorder(submitRecordedAudio);

  // عند الضغط على إرسال الريكورد: نفس تايمنج الكود الأصلي
  // (تفعيل isSending وإغلاق شريط الرد فورًا قبل قطع التسجيل)
  const handleSendRecording = useCallback(() => {
    if (isSending) return;
    setIsSending(true);
    if (replyingTo) dispatch(setReplyingTo(null));
    sendRecording();
  }, [isSending, replyingTo, dispatch, sendRecording]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      dispatch(setEditingMessage(null));
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      try {
        const response = await api.put(`/messages/edit/${targetId}`, {
          newText: currentText,
        });
        dispatch(
          updateEditedMessage({
            messageId: targetId,
            conversationId: activeConversation._id,
            newText: response.data.text,
            isEdited: true,
          }),
        );
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
    if (currentReplyingTo) dispatch(setReplyingTo(null));
    if (textareaRef.current) textareaRef.current.style.height = "auto";

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
        response = await api.post("/messages", {
          conversationId: activeConversation._id,
          text: currentText,
          replyTo: currentReplyingTo ? currentReplyingTo._id : undefined,
        });
      }

      dispatch(
        addMessage({
          message: { ...response.data, tempId: tempMsg._id },
          currentUserId: user?._id,
        }),
      );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, text, attachedFile, editingMessage, replyingTo, isSending, dispatch, user]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
    e.target.value = "";
  };

  return {
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
    sendRecording: handleSendRecording,
    sendMessage,
    handleFileSelect,
    closeReply: () => dispatch(setReplyingTo(null)),
    closeEdit: () => dispatch(setEditingMessage(null)),
  };
}