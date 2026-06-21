/**
 * رسالة نجاح/خطأ تظهر فوق الفورم بعد عملية إرسال (نجاح أو فشل).
 * لا تُعرض شيء لو الرسالة فاضية.
 */
export default function FormMessage({ message }) {
  if (!message?.text) return null;

  return <div className={`form-message ${message.type}`}>{message.text}</div>;
}