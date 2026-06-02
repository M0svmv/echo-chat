import '../styles/navbar.css';

import {FiHome} from 'react-icons/fi'
import { LuUserSearch } from "react-icons/lu";
import { TbUserShare,TbUserDown } from "react-icons/tb";
import { GoArchive } from "react-icons/go";
import { RiNotificationLine } from "react-icons/ri";
import { TbSettings } from "react-icons/tb";




import { Link } from 'react-router-dom';

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
        <Link className="nav-link nav-home active" to="/">
          <FiHome />
        </Link>
      </li>
      <li className="nav-item">
        <a className="nav-link nav-bell" href="/register">
          <RiNotificationLine />
        </a>
      </li>
      
      
      <li className="nav-item">
        <a className="nav-link nav-archive" href="/register">
          <GoArchive />
        </a>
      </li>

      <li className="nav-item">
        <Link className="nav-link nav-add" to="/available-users">
          <LuUserSearch />
        </Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link nav-Requests" to="/friendRequests">
          <TbUserDown />
        </Link>
      </li>
      
      <li className="nav-item">
        <Link className="nav-link nav-add" to="/requestsSent">
          <TbUserShare />
        </Link>
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
          <TbSettings />
        </a>
      </li>

      
    </ul>
      
    </div>
  );
}