import { FaSearch } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";

/**
 * شريط بحث "Apply on submit" (بزرار Enter أو زرار البحث)، مستخدم في
 * ConversationsList, ArchiveChats, GroupsList, FriendsList.
 *
 * للبحث الفوري (instant) المستخدم في FriendRequests/RequestsSent
 * شوف InstantSearchBar.
 */
export default function SidebarSearchBar({
  placeholder = "Search...",
  searchQuery,
  onChange,
  onKeyDown,
  onClear,
  onSearch,
}) {
  return (
    <div className="searchBar">
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {searchQuery && (
        <button className="clearButton" onClick={onClear}>
          <IoCloseCircle />
        </button>
      )}
      <button className="searchButton" onClick={onSearch}>
        <FaSearch />
      </button>
    </div>
  );
}