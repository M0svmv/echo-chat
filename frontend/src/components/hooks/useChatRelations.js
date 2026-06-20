import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

/**
 * الهوك الموحد لإدارة العلاقات (الصداقة، الحظر، الأصدقاء المقربين)
 * يعمل في وضعيّن:
 * 1. وضع الشات النشط: عند تمرير (active, receiver, setShowDropdown)
 * 2. الوضع العام: عند استخدامه في القوائم وصفحات البحث (بدون تمرير معاملات الشات)
 */
export default function useChatRelations({
  currentUser,
  active,
  receiver,
  setShowDropdown,
  onActionDone,
} = {}) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [localFriends, setLocalFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [closeFriends, setCloseFriends] = useState([]);

  // دالة جلب البيانات معزولة لإعادة استخدامها
  const fetchRelations = useCallback(async () => {
    try {
      const res = await api.get("/friends/summary").catch(() => ({ data: {} }));
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
      setBlockedUsers(blockedRes.map((u) => (u.targetUser?._id || u._id || u).toString()));
      setCloseFriends(closeFriendsRes.map((u) => (u.targetUser?._id || u._id || u).toString()));
    } catch (err) {
      console.error("Failed to fetch relations data:", err);
    }
  }, []);

  // useEffect مرن: يشتغل عند فتح الصفحة، ويعيد الجلب لو الـ active chat تغيرت
  useEffect(() => {
    // لو الهوك مستخدم في سياق شات، ومفيش شات نشط حالياً.. ميعملش حاجة
    if (active !== undefined && !active) return;
    
    fetchRelations();
  }, [active?._id, fetchRelations]);

  // دالة مساعدة لإنهاء الأكشن وتقليل تكرار الكود
  const handleActionSuccess = (alertMessage) => {
    if (alertMessage) alert(alertMessage);
    setShowDropdown?.(false); // سيتم استدعاؤها فقط لو كانت ممررة للهوك
    onActionDone?.();        // سيتم استدعاؤها فقط لو كانت ممررة للهوك
  };

  // دالة مساعدة لتحديد المستخدم المستهدف (سواء ممرر للدالة أو مأخوذ من الهوك)
  const getTargetUser = (passedUser) => passedUser || receiver;

  const handleMakePreference = async (passedUserOrType, possibleType) => {
    // دعم الطريقتين: handleMakePreference(type) أو handleMakePreference(user, type)
    const hasPassedUser = typeof passedUserOrType === "object";
    const targetUser = hasPassedUser ? passedUserOrType : receiver;
    const type = hasPassedUser ? possibleType : passedUserOrType;

    if (!targetUser) return;
    if (type === "block" && !window.confirm(`Are you sure you want to block ${targetUser.firstName}?`)) return;

    try {
      await api.post("/friends/preference", { type, targetUserId: targetUser._id });
      
      if (type === "block") {
        setBlockedUsers((prev) => [...prev, targetUser._id.toString()]);
        setCloseFriends((prev) => prev.filter((id) => id !== targetUser._id.toString()));
        handleActionSuccess("User blocked successfully");
      } else if (type === "close_friend") {
        setCloseFriends((prev) => [...prev, targetUser._id.toString()]);
        handleActionSuccess("Added to close friends");
      }
    } catch (err) {
      console.error(`Failed preference action (${type}):`, err);
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleUnblockUser = async (passedUser) => {
    const targetUser = getTargetUser(passedUser);
    if (!targetUser) return;

    try {
      await api.post("/friends/preference", { type: "unblock", targetUserId: targetUser._id });
      setBlockedUsers((prev) => prev.filter((id) => id !== targetUser._id.toString()));
      handleActionSuccess(`${targetUser.firstName} has been unblocked.`);
    } catch (err) {
      alert(err.response?.data?.message || "Could not unblock user.");
    }
  };

  const handleRemoveFriend = async (passedUser) => {
    const targetUser = getTargetUser(passedUser);
    if (!targetUser) return;
    if (!window.confirm(`Are you sure you want to remove ${targetUser.firstName} from friends?`)) return;

    try {
      await api.delete("/friends/remove", { data: { friendId: targetUser._id } });
      setLocalFriends((prev) =>
        prev.filter((f) => (f.targetUser?._id || f._id || f).toString() !== targetUser._id.toString())
      );
      setCloseFriends((prev) => prev.filter((id) => id !== targetUser._id.toString()));
      handleActionSuccess("Friend removed successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleAddFriend = async (passedUser) => {
    const targetUser = getTargetUser(passedUser);
    if (!targetUser || !currentUser) return;

    try {
      const res = await api.post(`/friends/request/`, { receiverId: targetUser._id });
      const newRequest = res.data?.request || res.data || {};
      
      setPendingRequests((prev) => [
        ...prev,
        {
          _id: newRequest._id || Date.now().toString(),
          sender: currentUser._id,
          receiver: targetUser._id,
          status: "pending",
        },
      ]);
      handleActionSuccess(`Friend request sent to ${targetUser.firstName}!`);
    } catch (err) {
      alert(err.response?.data?.message || "Could not send friend request.");
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await api.delete(`/friends/request/delete/${requestId}`);
      setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
      handleActionSuccess("Friend request cancelled.");
    } catch (err) {
      alert(err.response?.data?.message || "Could not cancel request.");
    }
  };

  const handleAcceptRequest = async (passedUserOrRequestId, possibleRequestId) => {
    // دعم الطريقتين: handleAcceptRequest(requestId) أو handleAcceptRequest(user, requestId)
    const isObject = typeof passedUserOrRequestId === "object";
    const targetUser = isObject ? passedUserOrRequestId : receiver;
    const requestId = isObject ? possibleRequestId : passedUserOrRequestId;

    if (!requestId) return;

    try {
      await api.post(`/friends/request/respond/${requestId}`, { action: "accepted" });
      if (targetUser) setLocalFriends((prev) => [...prev, targetUser]);
      setReceivedRequests((prev) => prev.filter((req) => req._id !== requestId));
      handleActionSuccess(targetUser ? `You are now friends with ${targetUser.firstName}!` : "Request accepted!");
    } catch (err) {
      alert(err.response?.data?.message || "Could not accept request.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await api.post(`/friends/request/respond/${requestId}`, { action: "rejected" });
      setReceivedRequests((prev) => prev.filter((req) => req._id !== requestId));
      handleActionSuccess("Request declined.");
    } catch (err) {
      alert(err.response?.data?.message || "Could not decline request.");
    }
  };

  return {
    pendingRequests,
    receivedRequests,
    localFriends,
    blockedUsers,
    closeFriends,
    fetchRelations, // تم إضافتها لـ تتيح لك تحديث البيانات يدوياً لو احتجت
    handleMakePreference,
    handleUnblockUser,
    handleRemoveFriend,
    handleAddFriend,
    handleCancelRequest,
    handleAcceptRequest,
    handleRejectRequest,
  };
}