import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * حقل باسورد بـ label وأيقونة قفل، مع زرار إظهار/إخفاء (toggle)
 * في نفس النمط البصري المستخدم في الكود الأصلي (position: absolute).
 *
 * يستخدم 3 مرات في ChangePassword (current/new/confirm) بنفس
 * الشكل والمنطق تمامًا، فاستخراجه هنا يلغي التكرار الكامل.
 */
export default function PasswordField({ label, name, value, onChange, visible, onToggleVisible }) {
  return (
    <div className="form-group">
      <label>
        <FaLock /> {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          required
          style={{ width: "var(--full-percent)" }}
        />
        <span
          onClick={onToggleVisible}
          style={{
            position: "absolute",
            right: "12px",
            top: "35%",
            cursor: "pointer",
            color: "#888",
          }}
        >
          {visible ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>
    </div>
  );
}