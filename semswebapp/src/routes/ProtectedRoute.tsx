import { Navigate, Outlet } from "react-router-dom";
import { tokenStore } from "../lib/api";

// Solo deja pasar si hay token; si no, redirige al login.
export default function ProtectedRoute() {
  return tokenStore.get() ? <Outlet /> : <Navigate to="/login" replace />;
}
