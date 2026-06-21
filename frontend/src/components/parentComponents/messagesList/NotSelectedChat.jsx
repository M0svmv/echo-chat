import { useEffect, useState } from "react";
import '../../../styles/notSelected.css';

export default function NotSelectedChat() {
  // 1. قراءة مسار اللوجو الابتدائي بناءً على الثيم الحالي
  const [logoSrc, setLogoSrc] = useState(() => {
    return localStorage.getItem("theme") === "light" 
      ? "/assets/echoLogoLight.png" 
      : "/assets/echoLogo.png";
  });

  // 2. رادار لمراقبة الـ HTML Class وتحديث اللوجو لحظياً بدون ريفريش
  useEffect(() => {
    const updateLogo = () => {
      const isLight = document.documentElement.classList.contains("light-theme") || localStorage.getItem("theme") === "light";
      setLogoSrc(isLight ? "/assets/echoLogoLight.png" : "/assets/echoLogo.png");
    };

    updateLogo();

    // مراقبة التغييرات على الـ classes بتاعة الـ html tag
    const observer = new MutationObserver(updateLogo);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect(); // تنظيف الرادار عند تدمير الكومبوننت
  }, []);

  return (
    <div className="not-selected-container">
      <div>
        {/* 🌟 اللوجو الذكي المتغير لحظياً */}
        <img src={logoSrc} alt="Echo Logo" />
      </div>
      <div className="not-selected-title">Echo Chat</div>
      <p className="login-tagline">
        SAY IT. <span className="share-text">SHARE IT.</span>{" "}
        <span className="echo-text">ECHO IT.</span>
      </p>
    </div>
  );
}