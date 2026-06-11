import { useState, useRef } from "react";
import { FaPlay, FaPause } from "react-icons/fa6";
import "../styles/customAudio.css";

export default function CustomAudioPlayer({ src }) {
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);

  // تشغيل وإيقاف الصوت
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleSpeed = () => {
    let nextSpeed = 1;
    if (speed === 1) nextSpeed = 1.5;
    else if (speed === 1.5) nextSpeed = 2;
    else nextSpeed = 1;

    setSpeed(nextSpeed);
    audioRef.current.playbackRate = nextSpeed; // تحديث سرعة تشغيل الـ Audio الفورية
  };

  // تحديث وقت العداد أثناء التشغيل
  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // 🔥 السحر كله هنا: حساب وقت الصوت بناءً على مكان الضغطة على المستطيل
  const handleProgressBarClick = (e) => {
    if (!progressBarRef.current || !duration) return;

    // جلب أبعاد ومكان الشريط على الشاشة
    const rect = progressBarRef.current.getBoundingClientRect();
    // حساب المسافة الأفقية من بداية الشريط وحتى مكان الماوس
    const clickX = e.clientX - rect.left;
    // حساب النسبة المئوية للضغطة
    const width = rect.width;
    const percentage = clickX / width;
    
    // حساب الوقت الفعلي المقابل للنسبة وتحديث المشغل
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // حساب نسبة التقدم لتحديث عرض الشريط الداخلي
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="pure-rect-audio">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        preload="metadata"
      />

      {/* زرار الـ Play/Pause المستطيل الحاد */}
      <button className="pure-audio-btn" onClick={togglePlay}>
        {isPlaying ? <FaPause size={11} /> : <FaPlay size={11} />}
      </button>

      {/* شريط التقدم الجديد الخالي تماماً من الـ Range الافتراضي */}
      <div 
        className="pure-audio-progress-container" 
        ref={progressBarRef}
        onClick={handleProgressBarClick}
      >
        {/* الشريط الملون الداخلي اللي بيتحرك مع الصوت */}
        <div 
          className="pure-audio-progress-bar" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* وقت الصوت الرقمي بالفونت البكسل بتاعك */}
      <span className="pure-audio-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      <button className="pure-audio-speed-btn" onClick={toggleSpeed}>
        {speed}x
      </button>
    </div>
  );
}