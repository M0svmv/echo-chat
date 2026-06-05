import {MdMoreVert} from 'react-icons/md'



// import ConversationsList from "./ConversationsList";

import "../styles/sidebar.css";
import { Outlet } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

import { MdArrowBack } from "react-icons/md";

export default function Sidebar() {

  const navigate = useNavigate();

  
  

  return (
    <div className="sidebar">
    <div className="sidebar-header">
    <div className="logo"><img src="./public/assets/echoLogo.png" alt="Logo" /><span>Echo</span></div>
    <button className= "back-btn" onClick={() => navigate(-1)}><MdArrowBack /></button>
    <div className="more"> <MdMoreVert /></div>
    
    </div>
      
      <Outlet >
        
      </Outlet>
    </div>
  );
}