import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "./Loader";

const getRoleHomePath = (role) => {
  if (role === "super_admin") return "/superadmin/users";
  if (role === "admin") return "/admin/users";
  if (role === "staff") return "/doctor-dashboard";
  return "/dashboard";
};

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, initialized, loading } = useSelector((state) => state.auth);

  if (loading || !initialized) return <Loader />;

  if (!user) return <Navigate to="/login" replace />;

  if (roleRequired) {
    const allowedRoles = Array.isArray(roleRequired)
      ? roleRequired
      : [roleRequired];

    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={getRoleHomePath(user.role)} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;