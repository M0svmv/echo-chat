import {MdMoreVert} from 'react-icons/md'

import { useEffect, useState } from "react";

// import ConversationsList from "./ConversationsList";

import "../styles/sidebar.css";
import { Outlet } from 'react-router-dom';

export default function Sidebar() {

  const [theme, setTheme] = useState("dark");
  
    useEffect(() => {
      if (theme === "light") {
        document.documentElement.classList.add("light-theme");
      } else {
        document.documentElement.classList.remove("light-theme");
      }
    }, [theme]);
  

  return (
    <div className="sidebar">
    <div className="sidebar-header">
    <div className="logo"><img src="./public/assets/echoLogo.png" alt="Logo" /><span>Echo</span></div>
    <button
        onClick={() =>
          setTheme(theme === "dark" ? "light" : "dark")
        }
      >
        Toggle Theme
      </button>
    <div className="more"><MdMoreVert /></div>
    
    </div>
      <Outlet />
    </div>
  );
}