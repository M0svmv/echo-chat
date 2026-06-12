import { useEffect, useState } from "react";
import { MdMoreVert, MdArrowBack } from 'react-icons/md';
import { Outlet, useNavigate } from 'react-router-dom';
import "../styles/sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

 
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

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        
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