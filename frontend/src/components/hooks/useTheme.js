import { useState, useEffect } from "react";

/**
 * هوك مسؤول عن إدارة الثيم (لايت/دارك) واللوجو المرتبط به:
 * - يقرأ الثيم المحفوظ في localStorage عند التحميل (default: dark)
 * - يضيف/يشيل كلاس light-theme على الـ html root
 * - يحدث اللوجو المعروض حسب الثيم الحالي
 */
export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    // لو متسيف لايت خليه لايت، غير كدة ديفولت دارك نيون فخم
    return localStorage.getItem("theme") || "dark";
  });

  const [logo, setLogo] = useState(() => {
    return localStorage.getItem("logo");
  });

  useEffect(() => {
    // بنشيك على الـ State الحالية مباشرة بدل الـ localStorage
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("theme", "light");
      localStorage.setItem("logo", "/assets/echoLogoLight.png");
      setLogo("/assets/echoLogoLight.png");
    } else {
      document.documentElement.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("logo", "/assets/echoLogo.png");
      setLogo("/assets/echoLogo.png");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, logo, toggleTheme };
}