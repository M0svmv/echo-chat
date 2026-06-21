/**
 * هوك مسؤول عن منطق تكبير/تصغير الـ textarea تلقائيًا حسب طول النص:
 * - عند الكتابة: يضبط الارتفاع على scrollHeight
 * - عند الخروج من الحقل وهو فاضي: يرجع للارتفاع الافتراضي
 *
 * بيرجع دوال جاهزة للربط مباشرة بـ onChange و onBlur في الـ textarea.
 */
export default function useAutoResizeTextarea(textareaRef) {
  const resetHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const growToFit = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleChangeResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleBlurReset = (e, text) => {
    if (!text.trim()) {
      e.target.style.height = "var(--avatar-size, 40px)";
    }
  };

  return { resetHeight, growToFit, handleChangeResize, handleBlurReset };
}