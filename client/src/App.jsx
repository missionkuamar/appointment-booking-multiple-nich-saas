import {
  Routes, Route, Navigate, useParams, useLocation, useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "./features/auth/authSlice";
import { fetchMyBusiness } from "./features/business/businessSlice";

// Layouts & Auth
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";
import AdminLayout from "./pages/AdminLayout";

// Public Pages
import Register from "./pages/Register";
import Login from "./pages/Login";
import PublicBooking from "./pages/PublicBooking";
import RescheduleBooking from "./pages/RescheduleBooking";
import BookingConfirmation from "./pages/BookingConfirmation";

// Owner/Staff Pages
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import SlotManager from "./pages/SlotManager";
import Appointments from "./pages/Appointments";
import DoctorManager from "./pages/DoctorManager";
import StaffManager from "./pages/StaffManager";
import Settings from "./pages/Settings";
import DoctorDashboard from "./pages/DoctorDashboard";
import SubscriptionPage from "./pages/SubscriptionPage";

// Affiliate Pages
import AffiliateDashboard from "./affilate/AffiliateDashboard";
import AffiliateWithdrawals from "./affilate/AffiliateWithdrawals";
import AdminWithdrawals from "./affilate/AdminWithdrawals";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminBusinessesPage from "./pages/admin/AdminBusinessesPage";
import AdminDoctorsPage from "./pages/admin/AdminDoctorsPage";
import AdminAppointmentsPage from "./pages/admin/AdminAppointmentsPage";
import AdminSlotsPage from "./pages/admin/AdminSlotsPage";
import AdminHolidaysPage from "./pages/admin/AdminHolidaysPage";
import AdminSubscriptionsPage from "./pages/admin/AdminSubscriptionsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import SuperAdminUsersPage from "./pages/SuperAdminUsersPage";
import AdminNotifications from "./affilate/AdminNotifications";

export const AffiliateRedirect = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("affiliateRef", ref);
    navigate("/login", { replace: true });
  }, [slug, location.search, navigate]);

  return (
    <div className="flex justify-center items-center h-64">
      <Loader />
    </div>
  );
};

function App() {
  const dispatch = useDispatch();
  const { user, token, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMe()).then((res) => {
        if (fetchMe.fulfilled.match(res)) dispatch(fetchMyBusiness());
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

      {/* Public */}
      <Route path="/book/:slug" element={<PublicBooking />} />
      <Route path="/booking-confirmed" element={<BookingConfirmation />} />
      <Route path="/manage/:token" element={<RescheduleBooking />} />
      <Route path="/r/:slug" element={<AffiliateRedirect />} />

      {/* 🔴 ADMIN ROUTES (NESTED) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roleRequired={["admin", "super_admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="businesses" element={<AdminBusinessesPage />} />
        <Route path="doctors" element={<AdminDoctorsPage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        <Route path="slots" element={<AdminSlotsPage />} />
        <Route path="holidays" element={<AdminHolidaysPage />} />
        <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="affiliate" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />
        <Route path="super_admin" element={<SuperAdminUsersPage />} />
        
      </Route>

      {/* Protected Owner/Staff */}
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute roleRequired="owner"><Dashboard /></ProtectedRoute>} />
      <Route path="/slots" element={<ProtectedRoute roleRequired="owner"><SlotManager /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
      <Route path="/doctors" element={<ProtectedRoute><DoctorManager /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><StaffManager /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/doctor-dashboard" element={<ProtectedRoute roleRequired="staff"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute roleRequired="owner"><SubscriptionPage /></ProtectedRoute>} />
      
      {/* 🔴 AFFILIATE ROUTES (Bahar nikal diye) */}
      <Route path="/affiliate" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />
      <Route path="/affiliate/withdrawals" element={<ProtectedRoute><AffiliateWithdrawals /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;