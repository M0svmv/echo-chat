import { useState, useMemo, useEffect } from "react";

/**
 * هوك مسؤول عن البحث جوه رسايل المحادثة الحالية:
 * - فلترة الرسايل المطابقة لنص البحث
 * - التنقل بين النتائج (التالي/السابق)
 * - عمل سكرول للرسالة المطابقة لما تتغير
 */
export default function useMessageSearch({ messages, activeId }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const matchingMessages = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return messages.filter((msg) =>
      msg.text?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [messages, searchQuery]);

  useEffect(() => {
    if (matchingMessages.length > 0) {
      const targetMsgId = matchingMessages[currentMatchIndex]?._id;
      const targetElement = document.getElementById(`msg-${targetMsgId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [matchingMessages, currentMatchIndex]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery, activeId]);

  // قفل البحث وتصفيره لما تتغير المحادثة النشطة
  useEffect(() => {
    setShowSearch(false);
    setSearchQuery("");
  }, [activeId]);

  const handleNextMatch = () => {
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessages.length);
  };

  const handlePrevMatch = () => {
    setCurrentMatchIndex(
      (prev) => (prev - 1 + matchingMessages.length) % matchingMessages.length,
    );
  };

  const toggleSearch = () => {
    setShowSearch((prev) => !prev);
    setSearchQuery("");
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
  };

  return {
    showSearch,
    searchQuery,
    setSearchQuery,
    matchingMessages,
    currentMatchIndex,
    handleNextMatch,
    handlePrevMatch,
    toggleSearch,
    closeSearch,
  };
}