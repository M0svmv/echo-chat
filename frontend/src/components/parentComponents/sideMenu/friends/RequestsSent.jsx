import { useEffect, useState } from "react";
import api from "../../../../api/axios";

import { FaXmark } from "react-icons/fa6";
import { FiClock, FiUserCheck } from "react-icons/fi";

import "../../../../styles/chat.css";

import Avatar from "../children/Avatar";
import InstantSearchBar from "../children/InstantSearchBar";
import EmptyState from "../../../shared/EmptyState";
import LoadingSpinner from "../../../shared/LoadingSpinner";

import useInstantSearch from "../../../hooks/useInstantSearch";

export default function RequestsSent() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCancel = async (requestId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this friend request?",
      );
      if (!confirmed) return;

      await api.delete(`/friends/request/delete/${requestId}`);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));

      alert("Friend request cancelled");
    } catch (error) {
      console.error("Failed to cancel request:", error);
    }
  };

  async function fetchRequests() {
    try {
      setLoading(true);
      const res = await api.get("/friends/requests/sent");
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

      <h3>Request Sent</h3>

      {loading ? (
        <LoadingSpinner />
      ) : filteredRequests.length === 0 ? (
        <EmptyState message="No friend requests found" />
      ) : (
        <ul>
          {filteredRequests.map((request) => {
            const user = request.receiver;

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
                    <button className="reject" onClick={() => handleCancel(request._id)}>
                      <FaXmark />
                    </button>
                  ) : (
                    ""
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