

import ConversationsList from "./ConversationsList";

export default function Sidebar() {
  

  return (
    <div className="sidebar">
    <div className="sidebar-header">
    <div className="logo"><img src="./public/assets/echoLogo.png" alt="Logo" /><span>Echo</span></div>
    </div>
      <ConversationsList />
    </div>
  );
}