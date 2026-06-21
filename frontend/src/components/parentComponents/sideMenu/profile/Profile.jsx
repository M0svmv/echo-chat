import { useSelector } from "react-redux";
import { FaAt, FaEnvelope, FaEdit, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../../../../styles/chat.css";

import PageHeader from "./children/PageHeader";
import ProfileAvatar from "./children/ProfileAvatar";
import LabeledInput from "./children/LabeledInput";

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
      <PageHeader title="Profile" />

      <div className="chat-items-container">
        <div className="profile-form">
          <ProfileAvatar imageUrl={avatar} firstName={firstName} lastName={lastName} readOnly />

          <div
            className="profile-name-container"
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <span
              className="profile-name"
              style={{
                textAlign: "center",
                fontSize: "var(--font-size-larger)",
                color: "var(--color-text-light)!important",
              }}
            >
              {`${firstName} ${lastName} `}
              <span className="bio-tag" style={{ textAlign: "center" }}>
                @{username}
              </span>
            </span>

            <span className="bio-tag" style={{ textAlign: "center" }}>
              {bio}
            </span>
          </div>

          <LabeledInput icon={<FaAt />} label="Username" value={username} disabled />

          <LabeledInput
            icon={<FaEnvelope />}
            label="Email Address"
            type="email"
            value={email}
            disabled
          />

          <button
            className="edit-profile-navigation-btn"
            onClick={() => navigate("/changePassword")}
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
          >
            <FaLock />
            <span>Change Password</span>
          </button>
          <button
            className="edit-profile-navigation-btn"
            onClick={() => navigate("/updateProfile")}
            style={{}}
          >
            <FaEdit />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}