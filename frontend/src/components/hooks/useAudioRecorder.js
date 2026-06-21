import { useRef, useState, useCallback } from "react";

/**
 * هوك مسؤول عن كل منطق تسجيل الصوت (MediaRecorder):
 * - طلب صلاحية الميكروفون وبدء التسجيل
 * - عداد مدة التسجيل
 * - إلغاء التسجيل
 * - إيقاف التسجيل وتسليم الملف الناتج (audioFile) لـ onRecordingComplete
 *   بدل ما يتكفل الهوك نفسه بمنطق الإرسال/الـ API
 *
 * @param {Function} onRecordingComplete - بيستقبل (audioFile) لما التسجيل يخلص بنجاح
 */
export default function useAudioRecorder(onRecordingComplete) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let options = { mimeType: "audio/webm" };
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
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

  /** ينهي التسجيل ويبني ملف الصوت النهائي، ثم يستدعي onRecordingComplete به */
  const sendRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;
    clearInterval(timerRef.current);

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const extension = mimeType.includes("mp4") ? "mp4" : "wav";

      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      const audioFile = new File([blob], `voice-${Date.now()}.${extension}`, {
        type: mimeType,
      });

      recorder.stream?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordDuration(0);

      onRecordingComplete?.(audioFile);
    };

    recorder.stop();
  }, [onRecordingComplete]);

  return {
    isRecording,
    recordDuration,
    startRecording,
    stopRecording,
    sendRecording,
  };
}