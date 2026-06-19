import { useState, useEffect } from "react";
import api from "../../api/axios";

/**
 * هوك مسؤول عن كل منطق العلاقات الخاصة بالمحادثة الحالية:
 * - طلبات الصداقة (المرسلة والمستقبلة)
 * - قائمة الأصدقاء المحليين
 * - المستخدمين المحظورين
 * - الأصدقاء المقربين (close friends)
 *
 * كل الأكشنز (إضافة/حذف/حظر/قبول/رفض...) موجودة جوه الهوك
 * وترجع بره عشان تستخدم في الـ UI (مثلاً الدروب داون منيو)
 */
export default function useChatRelations({ active, currentUser, receiver, setShowDropdown }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [localFriends, setLocalFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);

  useEffect(() => {
    if (!active) return;
    const fetchRelations = async () => {
      try {
        const res = await api
          .get("/friends/summary")
          .catch(() => ({ data: {} }));
        const {
          friendsRes = [],
          requestsRes = [],
          receivedRes = [],
          blockedRes = [],
          closeFriendsRes = [],
        } = res.data;
        setPendingRequests(requestsRes);
        setReceivedRequests(receivedRes);
        setLocalFriends(friendsRes);
        setBlockedUsers(
          blockedRes.map((u) => (u.targetUser?._id || u._id || u).toString()),
        );
        setCloseFriends(
          closeFriendsRes.map((u) =>
            (u.targetUser?._id || u._id || u).toString(),
          ),
        );
      } catch (err) {
        console.error("Error syncing contextual features:", err);
      }
    };
    fetchRelations();
  }, [active?._id]);

  const handleMakePreference = async (type) => {
    if (!receiver) return;
    if (
      type === "block" &&
      !window.confirm(`Are you sure you want to block ${receiver.firstName}?`)
    )
      return;

    try {
      await api.post("/friends/preference", {
        type,
        targetUserId: receiver._id,
      });
      if (type === "block") {
        setBlockedUsers((prev) => [...prev, receiver._id.toString()]);
        setCloseFriends((prev) =>
          prev.filter((id) => id !== receiver._id.toString()),
        );
        alert("User blocked successfully");
      } else if (type === "close_friend") {
        setCloseFriends((prev) => [...prev, receiver._id.toString()]);
        alert("Added to close friends");
      }
      setShowDropdown(false);
    } catch (err) {
      console.error(err);
      alert("Action failed");
    }
  };

  const handleUnblockUser = async () => {
    if (!receiver) return;
    try {
      await api.post("/friends/preference", {
        type: "unblock",
        targetUserId: receiver._id,
      });
      setBlockedUsers((prev) =>
        prev.filter((id) => id !== receiver._id.toString()),
      );
      alert(`${receiver.firstName} has been unblocked.`);
      setShowDropdown(false);
    } catch (err) {
      alert("Could not unblock user.");
    }
  };

  const handleRemoveFriend = async () => {
    if (!receiver) return;
    if (
      !window.confirm(
        `Are you sure you want to remove ${receiver.firstName} from friends?`,
      )
    )
      return;

    try {
      await api.delete("/friends/remove", { data: { friendId: receiver._id } });
      setLocalFriends((prev) =>
        prev.filter(
          (f) =>
            (f.targetUser?._id || f._id || f).toString() !==
            receiver._id.toString(),
        ),
      );
      setCloseFriends((prev) =>
        prev.filter((id) => id !== receiver._id.toString()),
      );
      alert("Friend removed successfully");
      setShowDropdown(false);
    } catch (err) {
      alert("Action failed");
    }
  };

  const handleAddFriend = async () => {
    if (!receiver || !currentUser) return;
    try {
      const res = await api.post(`/friends/request/`, {
        receiverId: receiver._id,
      });
      const newRequest = res.data?.request || res.data || {};
      setPendingRequests((prev) => [
        ...prev,
        {
          _id: newRequest._id || Date.now().toString(),
          sender: currentUser._id,
          receiver: receiver._id,
          status: "pending",
        },
      ]);
      alert(`Friend request sent!`);
      setShowDropdown(false);
    } catch (err) {
      alert("Could not send friend request.");
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await api.delete(`/friends/request/delete/${requestId}`);
      setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
      alert("Friend request cancelled.");
      setShowDropdown(false);
    } catch (err) {
      alert("Could not cancel request.");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (!requestId || !receiver) return;
    try {
      await api.post(`/friends/request/respond/${requestId}`, {
        action: "accepted",
      });
      setLocalFriends((prev) => [...prev, receiver]);
      setReceivedRequests((prev) =>
        prev.filter((req) => req._id !== requestId),
      );
      alert(`You are now friends!`);
      setShowDropdown(false);
    } catch (err) {
      alert("Could not accept request.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await api.post(`/friends/request/respond/${requestId}`, {
        action: "rejected",
      });
      setReceivedRequests((prev) =>
        prev.filter((req) => req._id !== requestId),
      );
      alert("Request declined.");
      setShowDropdown(false);
    } catch (err) {
      alert("Could not decline request.");
    }
  };

  return {
    pendingRequests,
    receivedRequests,
    localFriends,
    blockedUsers,
    closeFriends,
    handleMakePreference,
    handleUnblockUser,
    handleRemoveFriend,
    handleAddFriend,
    handleCancelRequest,
    handleAcceptRequest,
    handleRejectRequest,
  };
}