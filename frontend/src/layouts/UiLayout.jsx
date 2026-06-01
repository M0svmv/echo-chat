
import Navbar from "../components/Navbar";
import {Outlet} from "react-router-dom";
import "../styles/UiLayout.css";

export default function UiLayout() {
  return (
    <div className="ui-layout">
      <Navbar />
      <Outlet />
    </div>
  );
}