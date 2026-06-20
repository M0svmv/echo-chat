import { useState, useMemo } from "react";

/**
 * هوك بحث فوري (instant) بيفلتر القايمة على طول مع كل حرف بيتكتب،
 * بدون الحاجة لزرار بحث أو Enter. مستخدم في صفحات طلبات الصداقة.
 *
 * @param {Array} items - القايمة المراد فلترتها
 * @param {Function} getSearchableUser - فنكشن ترجع الـ user object من العنصر للفلترة عليه
 */
export default function useInstantSearch(items, getSearchableUser) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return items;

    return items.filter((item) => {
      const user = getSearchableUser(item);
      const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.toLowerCase();
      const username = user?.username?.toLowerCase() || "";
      return fullName.includes(query) || username.includes(query);
    });
  }, [items, searchQuery, getSearchableUser]);

  return { searchQuery, setSearchQuery, filteredItems };
}