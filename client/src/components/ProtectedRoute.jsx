import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "./Loader";

const getRoleHomePath = (role) => {
  if (role === "super_admin") return "/superadmin/users";
  if (role === "admin") return "/admin/users";
  if (role === "staff") return "/doctor-dashboard";
  return "/dashboard";
};

const ProtectedRoute = ({ children, roleRequired }) => {
  const location = useLocation();
  const { user, initialized, loading } = useSelector((state) => state.auth || {});

  if (loading || !initialized) return <Loader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roleRequired) {
    const allowedRoles = Array.isArray(roleRequired)
      ? roleRequired
      : [roleRequired];

    // If role is undefined on newly registered user and target is /dashboard, allow through
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