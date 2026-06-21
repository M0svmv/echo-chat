import { NavLink } from "react-router-dom";

/**
 * رابط أيقونة واحد في شريط النافبار الرئيسي (هوم، جروبات، أرشيف...).
 * يقلل تكرار منطق "isActive ? active class : normal class" المتكرر
 * في كل عنصر من عناصر القايمة.
 *
 * @param {string} to - مسار الرابط
 * @param {string} activeClassSuffix - الجزء المتغير من اسم الكلاس (home, archive, add, Requests...)
 */
export default function NavIconLink({ to, activeClassSuffix, children }) {
  const baseClass = `nav-link nav-${activeClassSuffix}`;

  return (
    <li className="nav-item">
      <NavLink
        className={({ isActive }) => (isActive ? `${baseClass} active` : baseClass)}
        to={to}
      >
        {children}
      </NavLink>
    </li>
  );
}