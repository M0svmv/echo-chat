import { useState } from "react";

/**
 * هوك مسؤول عن منطق البحث المتكرر في قوائم السايد بار:
 * - مربوط بـ state للنص المكتوب (searchQuery) و state للبحث المُفعّل (activeSearch)
 * - دعم البحث بزرار "Enter" أو بزرار البحث، ومسح البحث بزرار الـ X
 *
 * البحث هنا "Apply on submit" يعني الفلترة بتاخد activeSearch لحد ما تضغط
 * Enter أو زرار البحث - زي ما كان شغال في الكود الأصلي.
 */
export default function useSearchFilter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const handleSearch = () => setActiveSearch(searchQuery);

  const handleClear = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return {
    searchQuery,
    setSearchQuery,
    activeSearch,
    setActiveSearch,
    handleSearch,
    handleClear,
    handleKeyDown,
  };
}