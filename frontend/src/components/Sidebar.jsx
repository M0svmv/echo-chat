import { useEffect, useState } from "react";
import { MdMoreVert, MdArrowBack } from 'react-icons/md';
import { Outlet, useNavigate } from 'react-router-dom';
import "../styles/sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  // 1. تعريف الـ State لقراءة مسار اللوجو الابتدائي بناءً على الثيم المتسيف
  const [logoSrc, setLogoSrc] = useState(() => {
    return localStorage.getItem("theme") === "light" 
      ? "/assets/echoLogoLight.png" 
      : "/assets/echoLogo.png";
  });

  // 2. مراقبة التغييرات اللي بتحصل على الـ DOM (أو الـ localStorage) لتحديث اللوجو لحظياً
  useEffect(() => {
    // دالة فحص وتحديث اللوجو
    const updateLogo = () => {
      const isLight = document.documentElement.classList.contains("light-theme") || localStorage.getItem("theme") === "light";
      setLogoSrc(isLight ? "/assets/echoLogoLight.png" : "/assets/echoLogo.png");
    };

    // تشغيل الفحص فوراً عند تحميل الكومبوننت
    updateLogo();

    // عمل رادار (MutationObserver) يراقب لو الـ class بتاعة الـ html اتغيرت (light-theme اتضافت أو اتشالت)
    const observer = new MutationObserver(updateLogo);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect(); // تنظيف الرادار عند الخروج
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {/* 🌟 اللوجو الذكي المتغير لحظياً */}
        <div className="logo">
          <img src={logoSrc} alt="Logo" />
          <span>Echo</span>
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}><MdArrowBack /></button>
        <div className="more"> <MdMoreVert /></div>
      </div>
      
      <Outlet />
    </div>
  );
}