import "../styles/navbar.css";

import { FiHome } from "react-icons/fi";
import { LuUserSearch } from "react-icons/lu";
import { TbUserShare, TbUserDown, TbSettings,TbUser,TbUserEdit,TbUsers, TbLogout,TbShield } from "react-icons/tb";
import { MdLight } from "react-icons/md";
import { GoArchive } from "react-icons/go";
import { RiNotificationLine } from "react-icons/ri";

import api from "../api/axios";

import {logout} from "../features/auth/authSlice";

import { useState, useRef, useEffect } from "react";
import { useNavigate,Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const userMenuRef = useRef(null);
  const settingsMenuRef = useRef(null);

  const [theme, setTheme] = useState("dark");


  const handleLogout = async () => {
    
    try {
      await api.post("/auth/logout");

      dispatch(logout());
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

    useEffect(() => {
      if (theme === "light") {
        document.documentElement.classList.add("light-theme");
      } else {
        document.documentElement.classList.remove("light-theme");
      }
    }, [theme]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target)
      ) {
        setShowUserMenu(false);
      }

      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(e.target)
      ) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div className="navbar">
      <div className="navbar-uls">
        <ul className="navbar-links-list">
          <li className="nav-item">
            <img
              className="logo"
              src="/assets/echoLogo.png"
              alt="Logo"
            />
          </li>
        </ul>

        <ul className="navbar-links-list">
          <li className="nav-item">
            <Link className="nav-link nav-home active" to="/">
              <FiHome />
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link nav-bell" to="/notifications">
              <RiNotificationLine />
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link nav-archive" to="/archive">
              <GoArchive />
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className="nav-link nav-add"
              to="/available-users"
            >
              <LuUserSearch />
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className="nav-link nav-Requests"
              to="/friendRequests"
            >
              <TbUserDown />
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className="nav-link nav-add"
              to="/requestsSent"
            >
              <TbUserShare />
            </Link>
          </li>
        </ul>
      </div>

      <ul className="navbar-icons-list">
        {/* USER MENU */}
        <li className="nav-item" ref={userMenuRef}>
          <button
            className="nav-link menu-button"
            onClick={() => {
              setShowUserMenu((prev) => !prev);
              setShowSettingsMenu(false);
            }}
          >
            <div className="user-icon">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Avatar"
                />
              ) : (
                currentUser?.firstName
                  ?.charAt(0)
                  .toUpperCase() +
                currentUser?.lastName
                  ?.charAt(0)
                  .toUpperCase()
              )}
            </div>
          </button>

          {showUserMenu && (
            <div className="dropdown-menu">
              <button> <TbUser /> Profile</button>
              <button><TbUserEdit  /> Edit Profile</button>
              <button><TbUsers /> Friends</button>
              <button onClick={handleLogout}> <TbLogout /> Logout</button>
            </div>
          )}
        </li>

        {/* SETTINGS MENU */}
        <li className="nav-item" ref={settingsMenuRef}>
          <button
            className="nav-link menu-button"
            onClick={() => {
              setShowSettingsMenu((prev) => !prev);
              setShowUserMenu(false);
            }}
          >
            <TbSettings />
          </button>

          {showSettingsMenu && (
            <div className="dropdown-menu">
              <button onClick={() =>
          setTheme(theme === "dark" ? "light" : "dark")
        }><MdLight />Theme</button>
              <button><RiNotificationLine /> Notifications</button>
              <button><TbShield /> Privacy</button>
              <button><TbSettings /> Account Settings</button>
            </div>
          )}
        </li>
      </ul>
    </div>
  );
}