import { useState } from "react";

/**
 * هوك مسؤول عن منطق loading + message المتكرر في كل فورمات
 * البروفايل (تحديث البروفايل، تغيير الباسورد...):
 * - loading: حالة الإرسال الحالية
 * - message: { type: "success" | "error" | "", text: string }
 *
 * بيرجع helpers جاهزة لتبسيط try/catch/finally في الكومبوننت.
 */
export default function useFormMessage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const clearMessage = () => setMessage({ type: "", text: "" });

  const setSuccess = (text) => setMessage({ type: "success", text });

  const setError = (text) => setMessage({ type: "error", text });

  /** يستخرج رسالة الخطأ من استجابة axios، أو يستخدم fallback لو مش موجودة */
  const setErrorFromResponse = (error, fallback) => {
    const errorMsg = error.response?.data?.message || fallback;
    setError(errorMsg);
  };

  return {
    loading,
    setLoading,
    message,
    clearMessage,
    setSuccess,
    setError,
    setErrorFromResponse,
  };
}