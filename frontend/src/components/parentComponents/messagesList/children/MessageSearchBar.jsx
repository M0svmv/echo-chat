import { FiX } from "react-icons/fi";

/**
 * شريط البحث جوه رسايل المحادثة الحالية، بيظهر تحت الهيدر لما المستخدم
 * يضغط على أيقونة البحث.
 */
export default function MessageSearchBar({
  searchQuery,
  onSearchChange,
  matchingMessages,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  onClose,
}) {
  return (
    <div className="message-search-bar-modern">
      <input
        type="text"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
      />
      {searchQuery && matchingMessages.length > 0 && (
        <div className="search-navigation">
          <span className="search-count">
            {currentMatchIndex + 1} of {matchingMessages.length}
          </span>
          <button className="search-nav-btn" onClick={onPrevMatch}>
            ▲
          </button>
          <button className="search-nav-btn" onClick={onNextMatch}>
            ▼
          </button>
        </div>
      )}
      {searchQuery && matchingMessages.length === 0 && (
        <span className="search-count no-matches">No results</span>
      )}
      <FiX className="close-search" onClick={onClose} />
    </div>
  );
}