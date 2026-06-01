import {MdMoreVert} from 'react-icons/md'

import ConversationsList from "./ConversationsList";

import "../styles/sidebar.css";

export default function Sidebar() {
  

  return (
    <div className="sidebar">
    <div className="sidebar-header">
    <div className="logo"><img src="./public/assets/echoLogo.png" alt="Logo" /><span>Echo</span></div>
    <div className="more"><MdMoreVert /></div>
    
    </div>
      <ConversationsList />
    </div>
  );
}