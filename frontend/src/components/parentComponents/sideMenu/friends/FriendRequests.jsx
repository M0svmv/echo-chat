import { useEffect, useState } from "react";
import api from "../../../../api/axios";

import { FiUserCheck, FiUserPlus, FiUserX, FiClock } from "react-icons/fi";

import "../../../../styles/chat.css";

import Avatar from "./../children/Avatar";
import InstantSearchBar from "./../children/InstantSearchBar";
import EmptyState from "./../../../shared/EmptyState";
import LoadingSpinner from "./../../../shared/LoadingSpinner";

import useInstantSearch from "./../../../hooks/useInstantSearch";

export default function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAccept = async (requestId) => {
    try {
      await api.post(`/friends/request/respond/${requestId}`, {
        action: "accepted",
      });
      setRequests((prev) =>
        prev.map((req) => (req._id === requestId ? { ...req, status: "accepted" } : req)),
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

      setRequests((prev) =>
        prev.map((req) => (req._id === requestId ? { ...req, status: "rejected" } : req)),
      );
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

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

  const { searchQuery, setSearchQuery, filteredItems: filteredRequests } = useInstantSearch(
    requests,
    (request) => request.sender || request.receiver,
  );

  return (
    <div className="chatsContainer">
      <InstantSearchBar
        placeholder="Search friend requests..."
        searchQuery={searchQuery}
        onChange={setSearchQuery}
      />

      <h3>Friend Requests</h3>

      {loading ? (
        <LoadingSpinner />
      ) : filteredRequests.length === 0 ? (
        <EmptyState message="No friend requests found" />
      ) : (
        <div className="chat-items-container">
          <ul>
            {filteredRequests.map((request) => {
              const user = request.sender || request.receiver;

              return (
                <li key={request._id} className="chatItem">
                  <Avatar
                    image={user?.avatar}
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                  />

                  <div className="chatInfo">
                    <div className="name">
                      {user?.firstName} {user?.lastName}
                    </div>

                    <span className="username-tag">@{user?.username}</span>

                    <div className="request-status">
                      {request.status === "pending" ? (
                        <>
                          <FiClock /> <span className="pending-text">Pending</span>
                        </>
                      ) : (
                        <>
                          <FiUserCheck />
                          <span className="pending-text">Accepted</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="chat-item-actions">
                    {request.status === "pending" ? (
                      <>
                        <button className="accept" onClick={() => handleAccept(request._id)}>
                          <FiUserPlus />
                        </button>

                        <button className="reject" onClick={() => handleReject(request._id)}>
                          <FiUserX />
                        </button>
                      </>
                    ) : (
                      <span className={`status ${request.status}`}>
                        {request.status === "accepted" ? (
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
        </div>
      )}
    </div>
  );
}