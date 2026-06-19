import { useEffect } from "react";

/**
 * هوك عام: يقفل عنصر (زي الدروب داون منيو) لما يضغط المستخدم بره العنصر.
 *
 * @param {React.RefObject} ref - الـ ref بتاع العنصر اللي عايزين نراقب الضغط بره منه
 * @param {Function} onClickOutside - الفنكشن اللي تنفذ لما يحصل ضغط بره العنصر
 */
export default function useClickOutside(ref, onClickOutside) {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClickOutside();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, onClickOutside]);
}