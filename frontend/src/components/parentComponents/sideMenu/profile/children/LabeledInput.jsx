/**
 * حقل إدخال موحد بلابل وأيقونة، مستخدم لـ username, email, firstName,
 * lastName, bio... يدعم وضع disabled (للعرض فقط زي Profile.jsx) أو
 * controlled input عادي (زي UpdateProfile.jsx).
 */
export default function LabeledInput({
  icon,
  label,
  type = "text",
  name,
  value,
  onChange,
  disabled = false,
  required = false,
}) {
  return (
    <div className="form-group">
      <label>
        {icon} {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
    </div>
  );
}