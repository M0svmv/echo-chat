import { FaSearch } from "react-icons/fa";

/**
 * شريط بحث فوري (instant) بدون زرار مسح، مستخدم في FriendRequests
 * و RequestsSent حيث الفلترة بتحصل مع كل حرف بيتكتب.
 */
export default function InstantSearchBar({
  placeholder = "Search friend requests...",
  searchQuery,
  onChange,
}) {
  return (
    <div className="searchBar">
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onChange(e.target.value)}
      />
      <button className="searchButton">
        <FaSearch />
      </button>
    </div>
  );
}