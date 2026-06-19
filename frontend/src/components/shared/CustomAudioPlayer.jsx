import { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa6";
import "../../styles/customAudio.css";

const BARS = 46;
const BAR_HEIGHTS = [
  .35,.55,.8,.45,.9,.6,.3,.75,.95,.5,.4,.7,.85,.45,.6,.3,.9,.55,
  .75,.4,.65,.8,.35,.9,.5,.7,.45,.85,.6,.3,.55,.9
];

export default function CustomAudioPlayer({ src }) {
  const audioRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);

 
  

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      
      

    } else {
      audioRef.current.play();
      
    ;
    }
    setIsPlaying(!isPlaying);
    
  };

  const toggleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    audioRef.current.playbackRate = next;
  };

  const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
  const handleLoadedMetadata = () => setDuration(audioRef.current.duration);
  const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };

  const handleClick = (e) => {
    if (!containerRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress = duration ? currentTime / duration : 0;
  const playedIdx = Math.floor(progress * BARS);

  const getBarColor = (i) => {
    if (i < playedIdx) return "var(--color-tertiary)";
    if (i === playedIdx) return "var(--color-tertiary)";
    if (i > playedIdx) return "var(--color-text-gray)";
    return "var(--border-not-hovered)";
  };

  const getBarOpacity = (i) => {
    if (i <= playedIdx) return "1";
    return "0.45";
  };

  return (
    <div className="pure-rect-audio">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <button className="pure-audio-btn" onClick={togglePlay}>
        {isPlaying ? <FaPause size={13} /> : <FaPlay size={13} />}
      </button>

      <div className="pure-audio-mid">
        <div
          className="pure-audio-progress-container"
          ref={containerRef}
          onClick={handleClick}
        >
          {BAR_HEIGHTS.slice(0, BARS).map((h, i) => (
            <div
              key={i}
              className="pure-audio-bar"
              style={{
                height: `${Math.max(4, Math.round(h * 36))}px`,
                background: getBarColor(i),
                opacity: getBarOpacity(i),
              }}
            />
          ))}
        </div>

        <div className="pure-audio-bottom">
          {isPlaying ? <span className="pure-audio-time">{formatTime(currentTime)}</span> : <span className="pure-audio-time">{formatTime(duration)}</span>}
          <button
            className={`pure-audio-speed-btn ${speed !== 1 ? "active" : ""}`}
            onClick={toggleSpeed}
          >
            {speed}×
          </button>
          
        </div>
      </div>
    </div>
  );
}