import { useSelector } from "react-redux";
import { FaUser, FaAt, FaEnvelope ,FaEdit} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/chat.css";

export default function Profile() {
  // القراءة مباشرة وبشكل حي من الريدكس
  const currentUser = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const firstName = currentUser?.firstName || "";
  const lastName = currentUser?.lastName || "";
  const username = currentUser?.username || "";
  const email = currentUser?.email || "";
  const bio = currentUser?.bio || "";
  const avatar = currentUser?.avatar || "";

  return (
    <div className="chatsContainer">
      <h3>Profile</h3>
      
      
      <div className="chat-items-container">
        <div className="profile-form">
         <div className="avatar-upload-section">
            <div className="profile-avatar-container read-only">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="profile-preview-avatar" />
              ) : (
                <div className="avatarPlaceholder large">
                  {firstName.charAt(0).toUpperCase()}
                  {lastName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <span className="profile-name" style={{ textAlign: "center" , fontSize: "var(--font-size-larger)" ,color:"var(--color-text-light)!important"}}>{`${firstName} ${lastName}`}</span>

          <span className="bio-tag" style={{ textAlign: "center" }}>{bio}</span>


          <div className="form-group">
            <label><FaAt /> Username</label>
            <input
              type="text"
              value={username}
              disabled
            />
          </div>

          <div className="form-group">
            <label><FaEnvelope /> Email Address</label>
            <input
              type="email"
              value={email}
              disabled
            />
          </div>

          <button 
          className="edit-profile-navigation-btn" 
          onClick={() => navigate("/updateProfile")} 
          style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
        >
          <FaEdit />
          <span>Edit Profile</span>
        </button>

          
          
        </div>
      </div>
    </div>
  );
}