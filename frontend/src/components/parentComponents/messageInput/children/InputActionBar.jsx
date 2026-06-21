import { FiX } from "react-icons/fi";

/**
 * شريط الإجراء الظاهر فوق صندوق الكتابة، مستخدم في حالتين:
 * - وضع "تعديل رسالة" (variant="edit")
 * - وضع "رد على رسالة" (variant="reply")
 *
 * الفرق البصري الوحيد بينهم هو كلاس edit-line/edit-title الإضافي
 * في حالة التعديل، زي ما كان في الكود الأصلي.
 */
export default function InputActionBar({ variant, title, subtitle, onClose }) {
  const isEdit = variant === "edit";

  return (
    <div className="input-action-bar-preview">
      <div className={`bar-vertical-line${isEdit ? " edit-line" : ""}`}></div>
      <div className="action-bar-content">
        <span className={`action-title${isEdit ? " edit-title" : ""}`}>{title}</span>
        <span className="action-subtitle">{subtitle}</span>
      </div>
      <button className="close-action-bar" onClick={onClose}>
        <FiX />
      </button>
    </div>
  );
}