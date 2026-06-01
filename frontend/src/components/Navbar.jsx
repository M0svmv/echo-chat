import '../styles/navbar.css';

import {FiHome,FiBell,FiUsers,FiUserPlus,FiArchive,FiSettings} from 'react-icons/fi'

import { useSelector } from "react-redux";
export default function Navbar() {
  const currentUser = useSelector((state) => state.auth.user);

  return (
    <div className="navbar">
    <div className="navbar-uls">
    <ul className="navbar-links-list">
      <li className="nav-item">
        <img className="logo" src="./public/assets/echoLogo.png" alt="Logo" />
      </li>

    </ul>

    <ul className="navbar-links-list">
      <li className="nav-item">
        <a className="nav-link nav-home active" href="/">
          <FiHome />
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link nav-bell" href="/register">
          <FiBell />
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link nav-groups" href="/login">
          <FiUsers />
        </a>
      </li>
      
      <li className="nav-item">
        <a className="nav-link nav-archive" href="/register">
          <FiArchive />
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link nav-add" href="/register">
          <FiUserPlus />
        </a>
      </li>
    </ul>
    </div>

    <ul className="navbar-icons-list">
      
      <li className="nav-item">
        <a className="nav-link" href="/register">
        <div className="user-icon">
        {currentUser.avatar ?<img src={currentUser.avatar} alt="Avatar" />:currentUser.firstName.charAt(0).toUpperCase() + currentUser.lastName.charAt(0).toUpperCase()}
            
        </div>
          
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link" href="/register">
          <FiSettings />
        </a>
      </li>

      
    </ul>
      
    </div>
  );
}