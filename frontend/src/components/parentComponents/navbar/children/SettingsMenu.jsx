import { TbSettings, TbShield } from "react-icons/tb";
import { MdLight } from "react-icons/md";
import { RiNotificationLine } from "react-icons/ri";

/**
 * زرار الإعدادات (الترس) + القائمة المنسدلة المرتبطة بيه
 * (تبديل الثيم، إشعارات، خصوصية، إعدادات الحساب).
 */
export default function SettingsMenu({ menuRef, isOpen, onToggle, onToggleTheme }) {
  return (
    <li className="nav-item" ref={menuRef}>
      <button className="nav-link menu-button" onClick={onToggle}>
        <TbSettings />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <button onClick={onToggleTheme}>
            <MdLight /> Theme
          </button>
          <button>
            <RiNotificationLine /> Notifications
          </button>
          <button>
            <TbShield /> Privacy
          </button>
          <button>
            <TbSettings /> Account Settings
          </button>
        </div>
      )}
    </li>
  );
}