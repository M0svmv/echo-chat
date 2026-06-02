import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

import { FaSearch } from "react-icons/fa";
import { FiUserCheck,FiUserPlus,FiUserX  } from "react-icons/fi";
import { FiClock } from "react-icons/fi";

import "../styles/chat.css";

export default function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);


  const handleAccept = async (requestId) => {
    try {
      await api.post(`/friends/request/respond/${requestId}`, {
        action: "accepted",
      });
      setRequests((prev) =>
      prev.map((req) =>
        req._id === requestId
          ? { ...req, status: "accepted" }
          : req
      )
    );
    } catch (error) {
      console.error("Failed to accept request:", error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.post(`/friends/request/respond/${requestId}`, {
        action: "rejected",
      });
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

  // Fetch requests
  async function fetchRequests() {
    try {
      setLoading(true);

      const res = await api.get("/friends/requests");

      setRequests(res.data || []);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  // Optimized filtering (no state needed)
  const filteredRequests = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return requests;

    return requests.filter((request) => {
      const user = request.sender || request.receiver;

      const fullName =
        `${user?.firstName || ""} ${
          user?.lastName || ""
        }`.toLowerCase();

      const username = user?.username?.toLowerCase() || "";

      return (
        fullName.includes(query) ||
        username.includes(query)
      );
    });
  }, [requests, searchQuery]);

  return (
    <div className="chatsContainer">
      {/* SEARCH */}
      <div className="searchBar">
        <input
          type="text"
          placeholder="Search friend requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button className="searchButton">
          <FaSearch />
        </button>
      </div>

      <h3>Friend Requests</h3>

      {/* LOADING */}
      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="no-results">
          No friend requests found
        </div>
      ) : (
        <ul>
          {filteredRequests.map((request) => {
            const user = request.sender || request.receiver;

            return (
              <li key={request._id} className="chatItem">
                {/* Avatar */}
                <div className="chatAvatar">
                  {!user?.avatar ? (
                    <div className="avatarPlaceholder">
                      {user?.firstName?.charAt(0).toUpperCase()}
                      {user?.lastName?.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="avatar"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="chatInfo">
                  <div className="name">
                    {user?.firstName} {user?.lastName}
                  </div>

                  <span className="username-tag">
                    @{user?.username}
                  </span>

                  <div className="request-status">
                    {request.status=== "pending" ? (
                      <>
                        <FiClock /> <span className="pending-text">Pending</span>
                      </>
                    ) : (
                        <>
                          <FiUserCheck /><span className="pending-text">Accepted</span>
                        </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="chat-item-actions">
  {request.status === "pending" ? (
    <>
      <button
        className="accept"
        onClick={() => handleAccept(request._id)}
      >
        <FiUserPlus />
      </button>

      <button
        className="reject"
        onClick={() => handleReject(request._id)}
      >
        <FiUserX />
      </button>
    </>
  ) : (
    <span className={`status ${request.status}`}>
      {request.status=== "accepted" ? (
        <>
          <FiUserCheck />&nbsp; Accepted
        </>
      ) : (
        <>
          <FiUserX />&nbsp; Rejected
        </>
      )}
    </span>
  )}
</div>

                
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}