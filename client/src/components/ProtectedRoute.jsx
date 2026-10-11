import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "./Loader";

const ProtectedRoute = ({ children }) => {
  const { user, initialized, loading } = useSelector((state) => state.auth);

  if (loading || !initialized) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;