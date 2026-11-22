import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "./Loader";

const getRoleHomePath = (role) => {
  if (role === "super_admin") return "/admin/super_admin";
  if (role === "admin") return "/admin";
  if (role === "staff") return "/doctor-dashboard";
  return "/dashboard";
};

const ProtectedRoute = ({ children, roleRequired }) => {
  const location = useLocation();
  const { user, token, initialized, loading } = useSelector(
    (state) => state.auth || {}
  );

  // Sirf tab loader dikhayein jab auth check chal raha ho aur user/token resolve na hua ho
  if (loading || (token && !initialized)) {
    return <Loader />;
  }

  if (!token && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!user && initialized) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roleRequired && user) {
    const allowedRoles = Array.isArray(roleRequired)
      ? roleRequired
      : [roleRequired];

    const effectiveRole = user.role;
    const isAllowed =
      allowedRoles.includes(effectiveRole) ||
      (!effectiveRole && location.pathname === "/dashboard");

    if (!isAllowed) {
      const targetPath = getRoleHomePath(effectiveRole);
      if (targetPath !== location.pathname) {
        return <Navigate to={targetPath} replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;