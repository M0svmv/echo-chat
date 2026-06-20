import { useEffect, useState } from "react";
import { MdArrowBack } from 'react-icons/md';
import { IoMdMenu } from "react-icons/io";
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux"; 
import { setActiveConversation } from "../features/chat/chatSlice"; 
// 🌟 استيراد الـ Actions من السلايس الجديدة
import { toggleMenu, closeMenu } from "../features/ui/uiSlice"; 
import "../styles/sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 🌟 مراقبة الشات النشط وقائمة الـ Menu من الريدوكس
  const activeConversation = useSelector((state) => state.chat.activeConversation);
  const isMenuOpen = useSelector((state) => state.ui.isMenuOpen);

  const [logoSrc, setLogoSrc] = useState(() => {
    return localStorage.getItem("theme") === "light" 
      ? "/assets/echoLogoLight.png" 
      : "/assets/echoLogo.png";
  });

  useEffect(() => {
    const updateLogo = () => {
      const isLight = document.documentElement.classList.contains("light-theme") || localStorage.getItem("theme") === "light";
      setLogoSrc(isLight ? "/assets/echoLogoLight.png" : "/assets/echoLogo.png");
    };

    updateLogo();

    const observer = new MutationObserver(updateLogo);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect(); 
  }, []);

  // دالة التحكم في الرجوع الذكي
  const handleBack = () => {
    if (activeConversation) {
      dispatch(setActiveConversation(null));
    } else {
      navigate(-1);
    }
  };

  return (
    <div  className={`sidebar ${!isMenuOpen ? "min-sidebar" : ""} ${activeConversation ? "active-chat" : ""}`}>
      <div className="sidebar-header">
      
        <div className="logo">
        <button className="back-btn" onClick={handleBack}><MdArrowBack /></button>
          <img src={logoSrc} alt="Logo" />
          <span>Echo</span>
        </div>
        
        
        
        {/* 🔘 زرار المنيو: يعمل Toggle للـ state في الـ uiSlice */}
        <div className="more" onClick={() => dispatch(toggleMenu())}> 
          <IoMdMenu />
        </div>

        {/* 📜 القائمة المنسدلة: تظهر وتختفي أوتوماتيك بناءً على الـ Redux state */}
        
      </div>
      
      <Outlet />
    </div>
  );
}