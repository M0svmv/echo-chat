import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";

export default function ProtectedRoute() {
  const { user, initialized } = useSelector((state) => state.auth);

  // While auth initialization (hydration/refresh) is in progress, don't redirect.
  if (!initialized) {
    return null; // or a spinner component while checking auth
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
