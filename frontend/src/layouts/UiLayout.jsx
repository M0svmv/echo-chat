import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux"; // 🌟 استيراد الـ useSelector
import "../styles/UiLayout.css";

export default function UiLayout() {
  // 🌟 بنراقب الشات النشط هنا جوه الـ Layout المشترك
  const activeConversation = useSelector((state) => state.chat.activeConversation);

  return (
    /* 🌟 لو فيه شات مفتوح بنضيف كلاس has-active-chat للأب الكبير بالكامل */
    <div className={`ui-layout ${activeConversation ? "has-active-chat" : ""}`}>
      <Navbar />
      <Outlet />
    </div>
  );
}