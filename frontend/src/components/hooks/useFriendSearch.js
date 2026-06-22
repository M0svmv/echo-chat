import { useState } from "react";
import api from "../../api/axios";

/**
 * هوك مسؤول عن منطق صفحة "إضافة أصدقاء":
 * - البحث عن مستخدمين عبر API (بزرار البحث أو Enter)
 * - إرسال طلب صداقة وإزالة المستخدم من نتائج البحث فور الإرسال
 *
 * ملاحظة 1: الكتابة في الحقل لا تمسح النتائج تلقائيًا (نفس سلوك
 * الأصل بالضبط) - النتائج بتفضل زي ما هي لحد ما تضغط بحث/Enter
 * من جديد، أو يبقى الحقل فاضي وقت الضغط فهيمسحها handleSearch نفسها.
 *
 * ملاحظة 2: clearSearch (زرار X) إضافة جديدة غير موجودة في الكود
 * الأصلي - جاية تلقائيًا من استخدام SidebarSearchBar المشترك. تم
 * تفعيلها لتمسح النص والنتائج معًا بدل ما تترك نتائج بحث قديمة
 * ظاهرة لاستعلام ملوش وجود في الحقل.
 */
export default function useFriendSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/friends/search?query=${searchQuery}`);
      setSearchResults(res.data || []);
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const sendFriendRequest = async (receiver) => {
    const confirmed = window.confirm(
      `Send friend request to ${receiver.firstName} ${receiver.lastName}?`,
    );
    if (!confirmed) return;

    try {
      await api.post("/friends/request", { receiverId: receiver._id });
      alert("Friend request sent!");
      setSearchResults((prev) => prev.filter((user) => user._id !== receiver._id));
    } catch (error) {
      console.error("Failed to send friend request:", error);
      alert(error.response?.data?.message || "Could not send friend request.");
    }
  };

  return {
    searchQuery,
    searchResults,
    loading,
    setSearchQuery,
    handleSearch,
    handleKeyDown,
    clearSearch,
    sendFriendRequest,
  };
}