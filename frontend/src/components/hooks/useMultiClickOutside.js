import { useEffect } from "react";

/**
 * هوك عام: يقفل أكتر من عنصر (زي يوزر منيو وسيتنجز منيو) في نفس الوقت
 * عند الضغط بره أي واحد منهم، بنفس منطق الـ listener الواحد المستخدم
 * في الكود الأصلي.
 *
 * @param {Array<{ ref: React.RefObject, onClickOutside: Function }>} entries
 */
export default function useMultiClickOutside(entries) {
  useEffect(() => {
    const handleClickOutside = (e) => {
      entries.forEach(({ ref, onClickOutside }) => {
        if (ref.current && !ref.current.contains(e.target)) {
          onClickOutside();
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}