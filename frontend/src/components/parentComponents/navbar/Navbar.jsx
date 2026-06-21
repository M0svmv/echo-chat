import "../../../styles/navbar.css";

import { FiHome } from "react-icons/fi";
import { LuUserSearch } from "react-icons/lu";
import { TbUserShare, TbUserDown, TbUsersGroup } from "react-icons/tb";
import { GoArchive } from "react-icons/go";

import api from "../../../api/axios";
import { logout } from "../../../features/auth/authSlice";

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import NavIconLink from "./children/NavIconLink";
import UserMenu from "./children/UserMenu";
import SettingsMenu from "./children/SettingsMenu";

import useTheme from "./../../hooks/useTheme";
import useMultiClickOutside from "./../../hooks/useMultiClickOutside";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);
  const isMenuOpen = useSelector((state) => state.ui.isMenuOpen);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const userMenuRef = useRef(null);
  const settingsMenuRef = useRef(null);

  const { logo, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      dispatch(logout());
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useMultiClickOutside([
    { ref: userMenuRef, onClickOutside: () => setShowUserMenu(false) },
    { ref: settingsMenuRef, onClickOutside: () => setShowSettingsMenu(false) },
  ]);

  const toggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
    setShowSettingsMenu(false);
  };

  const toggleSettingsMenu = () => {
    setShowSettingsMenu((prev) => !prev);
    setShowUserMenu(false);
  };

  return (
    <div className={`navbar ${isMenuOpen ? "hide-navbar" : ""}`}>
      <div className="navbar-uls">
        <ul className="navbar-links-list">
          <li className="nav-item">
            <img className="logo" src={logo} alt="Logo" />
          </li>
        </ul>

        <ul className="navbar-links-list">
          <NavIconLink to="/" activeClassSuffix="home">
            <FiHome />
          </NavIconLink>

          <NavIconLink to="/groups" activeClassSuffix="home">
            <TbUsersGroup />
          </NavIconLink>

          {/* <NavIconLink to="/notifications" activeClassSuffix="bell">
            <RiNotificationLine />
          </NavIconLink> */}

          <NavIconLink to="/archive" activeClassSuffix="archive">
            <GoArchive />
          </NavIconLink>

          <NavIconLink to="/available-users" activeClassSuffix="add">
            <LuUserSearch />
          </NavIconLink>

          <NavIconLink to="/friendRequests" activeClassSuffix="Requests">
            <TbUserDown />
          </NavIconLink>

          <NavIconLink to="/requestsSent" activeClassSuffix="Requests">
            <TbUserShare />
          </NavIconLink>
        </ul>
      </div>

      <ul className="navbar-icons-list">
        <UserMenu
          menuRef={userMenuRef}
          currentUser={currentUser}
          isOpen={showUserMenu}
          onToggle={toggleUserMenu}
          onLogout={handleLogout}
        />

        <SettingsMenu
          menuRef={settingsMenuRef}
          isOpen={showSettingsMenu}
          onToggle={toggleSettingsMenu}
          onToggleTheme={toggleTheme}
        />
      </ul>
    </div>
  );
}