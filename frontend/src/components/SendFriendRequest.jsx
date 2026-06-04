import {  useState } from "react";
import api from "../api/axios";
// import { useDispatch, useSelector } from "react-redux";


import {
  FaSearch,
  
} from "react-icons/fa";

import { FiUserPlus } from "react-icons/fi";
import "../styles/chat.css";

export default function SendFriendRequest() {


  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendFriendRequest = async (receiver) => {
    const confirmed = window.confirm(`Send friend request to ${receiver.firstName} ${receiver.lastName}?`);
    if (!confirmed) return;

    await api.post("/friends/request", {
      receiverId: receiver._id,
    });
    alert("Friend request sent!");
    setSearchResults((prev) => prev.filter((user) => user._id !== receiver._id));

  }

  
    const handleSearch =  async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);

        const res = await api.get(
          `/friends/search?query=${searchQuery}`
        );

        setSearchResults(res.data || []);
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setLoading(false);
      }
    }

   


  return (
    <div className="chatsContainer">
      <div className="searchBar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
            
          }

           onKeyDown={(e) => {
    if (e.key === "Enter") {
      handleSearch();
    }}}
        />

        <button className="searchButton" onClick={handleSearch}>
          <FaSearch />
        </button>
      </div>

      <h3>Add Friends</h3>

      <div className="chat-items-container">

      <ul>
        { (
          <>
            {loading && (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            )}

            {!loading &&
              searchResults.map((user) => (
                <li
                  key={user._id}
                  className="chatItem"
                   
                >
                  <div className={user?.avatar ? "chatAvatar avatar-bg" : "chatAvatar"}>
                    {!user.avatar ? (
                      <div className="avatarPlaceholder">
                        {user.firstName
                          ?.charAt(0)
                          .toUpperCase()}
                        {user.lastName
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>
                    ) : (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="avatar"
                      />
                    )}
                  </div>
                  

                  <div className="chatInfo">
                  <span className="username-tag">
                      @{user.username}
                    </span>
                    <br />
                    <span className="name-tag">
                      {user.firstName} {user.lastName}
                    </span>
                    <br />
                    <span className="bio-tag">
                      {user.bio}
                    </span>

                    
                  </div>
                  <div className="chat-item-actions">
                  <button
    className="add-btn"
    onClick={() => sendFriendRequest(user)}
  >
    <FiUserPlus />
  </button>
                  </div>
                </li>
              ))}

            {!loading &&
              searchResults.length === 0 && (
                <div className="no-results">
                  No users found
                </div>
              )}
          </>
        ) }
      </ul>
      </div>
      
    </div>
  );
}

