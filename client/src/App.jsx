import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "./features/auth/authSlice";
import { fetchMyBusiness } from "./features/business/businessSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import SlotManager from "./pages/SlotManager";
import Appointments from "./pages/Appointments";
import PublicBooking from "./pages/PublicBooking";
import StaffManager from "./pages/StaffManager";
import Settings from "./pages/Settings";
import RescheduleBooking from "./pages/RescheduleBooking";

function App() {
  const dispatch = useDispatch();
  const { user, token, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMe()).then((res) => {
        if (fetchMe.fulfilled.match(res)) {
          dispatch(fetchMyBusiness());
        }
      });
    } else if (!token) {
      dispatch({ type: "auth/fetchMe/rejected" });
    }
  }, [dispatch, token, user]);

  if (token && !initialized) return <Loader />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Public routes */}
      <Route path="/book/:slug" element={<PublicBooking />} />
      <Route path="/manage/:token" element={<RescheduleBooking />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/slots"
        element={
          <ProtectedRoute>
            <SlotManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <StaffManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;