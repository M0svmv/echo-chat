import { FiUserPlus } from "react-icons/fi";
import "../../../../styles/chat.css";

import Avatar from "./../children/Avatar";
import SidebarSearchBar from "./../children/SidebarSearchBar";
import EmptyState from "./../../../shared/EmptyState";
import LoadingSpinner from "./../../../shared/LoadingSpinner";

import useFriendSearch from "./../../../hooks/useFriendSearch";

export default function SendFriendRequest() {
  const {
    searchQuery,
    searchResults,
    loading,
    setSearchQuery,
    handleSearch,
    handleKeyDown,
    clearSearch,
    sendFriendRequest,
  } = useFriendSearch();

  return (
    <div className="chatsContainer">
      <SidebarSearchBar
        placeholder="Search users..."
        searchQuery={searchQuery}
        onChange={setSearchQuery}
        onKeyDown={handleKeyDown}
        onClear={clearSearch}
        onSearch={handleSearch}
      />

      <h3>Add Friends</h3>

      <div className="chat-items-container">
        <ul>
          {loading && <LoadingSpinner />}

          {!loading &&
            searchResults.map((user) => (
              <li key={user._id} className="chatItem">
                <Avatar image={user?.avatar} firstName={user.firstName} lastName={user.lastName} />

                <div className="chatInfo">
                  <span className="username-tag">@{user.username}</span>
                  <br />
                  <span className="name-tag">
                    {user.firstName} {user.lastName}
                  </span>
                  <br />
                  <span className="bio-tag">{user.bio}</span>
                </div>

                <div className="chat-item-actions">
                  <button className="add-btn" onClick={() => sendFriendRequest(user)}>
                    <FiUserPlus />
                  </button>
                </div>
              </li>
            ))}

          {!loading && searchResults.length === 0 && <EmptyState message="No users found" />}
        </ul>
      </div>
    </div>
  );
}