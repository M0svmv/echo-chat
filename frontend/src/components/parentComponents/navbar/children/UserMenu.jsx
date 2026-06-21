import { NavLink } from "react-router-dom";
import { TbUser, TbUserEdit, TbUsers, TbLogout } from "react-icons/tb";
import UserAvatar from "./UserAvatar";

/**
 * زرار أفاتار المستخدم + القائمة المنسدلة المرتبطة بيه (بروفايل،
 * تعديل البروفايل، الأصدقاء، تسجيل الخروج).
 */
export default function UserMenu({ menuRef, currentUser, isOpen, onToggle, onLogout }) {
  return (
    <li className="nav-item" ref={menuRef}>
      <button className="nav-link menu-button" onClick={onToggle}>
        <UserAvatar
          avatar={currentUser?.avatar}
          firstName={currentUser?.firstName}
          lastName={currentUser?.lastName}
        />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <NavLink to="/profile">
            <TbUser /> Profile
          </NavLink>
          <NavLink to="/updateProfile">
            <TbUserEdit /> Edit Profile
          </NavLink>
          <NavLink to="/friends">
            <TbUsers /> Friends
          </NavLink>
          <button className="dropdown-item item-remove" onClick={onLogout}>
            <TbLogout /> Logout
          </button>
        </div>
      )}
    </li>
  );
}