import { FiMoreVertical } from "react-icons/fi";

/**
 * زرار "المزيد" (الثلاث نقط) - مكون UI بسيط فقط. منطق فتح/قفل واحد
 * بس في نفس الوقت موجود في useListDropdown، والـ ref بيتمرر من الأب
 * بحيث يكون مربوط بالعنصر المفتوح فعلياً بس.
 */
export default function MoreOptionsButton({ menuRef, isOpen, onToggle, children }) {
  return (
    <div className="conv-more-options" ref={isOpen ? menuRef : null}>
      <button className="conv-more-btn" onClick={onToggle} title="More options">
        <FiMoreVertical />
      </button>
      {isOpen && children}
    </div>
  );
}