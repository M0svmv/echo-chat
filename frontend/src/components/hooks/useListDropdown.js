import { useRef, useState, useEffect } from "react";

/**
 * هوك مسؤول عن منطق "دروب داون واحد مفتوح بس في المرة" جوه قايمة عناصر
 * (زي زرار الثلاث نقط في كل عنصر محادثة). يحافظ على نفس سلوك الكود
 * الأصلي: ref واحد بيتحط بس على العنصر المفتوح، وقفل تلقائي عند
 * الضغط بره العنصر.
 */
export default function useListDropdown() {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const closeMenu = () => setOpenMenuId(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return { openMenuId, menuRef, toggleMenu, closeMenu };
}