import { useState, useRef, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { IoPaperPlaneOutline } from "react-icons/io5";

export default function RecordingBar({ mins, secs, onCancel, onSend, stream }) {
  // الـ stream هو حبل المايك الشغال حالياً (مثال: اللي جاي من navigator.mediaDevices.getUserMedia)
  const [audioData, setAudioData] = useState(new Array(8).fill(0)); // 8 مستطيلات ترددية
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    try {
      // 1. إنشاء سياق الصوت ومحلل الترددات
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      
      // لتنعيم حركة الذبذبات (كل ما تعلى القيم تكون الحركة أهدأ وأشيك)
      analyser.smoothingTimeConstant = 0.75; 
      analyser.fftSize = 32; // حجم عينات صغير عشان نطلع عدد مستطيلات قليل وعصري

      // 2. ربط تدفق المايك بالمحلل
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;

      // 3. دالة التحديث المستمر لايف مع كل فريم للشاشة
      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // أخذ أول 8 ترددات أساسية وتحويلها لنسب مئوية للارتفاع
        const normalizedData = Array.from(dataArrayRef.current.slice(0, 8)).map(
          (value) => (value / 255) * 100
        );
        
        setAudioData(normalizedData);
        animationRef.current = requestAnimationFrame(updateVisualizer);
      };

      updateVisualizer();
    } catch (err) {
      console.error("Error setting up audio visualizer:", err);
    }

    // تنظيف المايك والسياق عند الإلغاء أو الإرسال
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  return (
    <div className="message-input-container">
      <div className="recording-bar modern-equalizer-bar">
        <div className="recording-pulse" />
        <span className="recording-label">Recording</span>
        
        {/* 🔥 حاوية الترددات الحقيقية المتصلة المستطيلة */}
        <div className="real-audio-equalizer">
          {audioData.map((heightValue, index) => (
            <div
              key={index}
              className="eq-bar"
              style={{ 
                // التحكم في الارتفاع لايف بالـ JS بناءً على صوتك الحقيقي!
                height: `${Math.max(4, heightValue)}px` 
              }}
            />
          ))}
        </div>

        <span className="recording-timer">{mins}:{secs}</span>
        
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