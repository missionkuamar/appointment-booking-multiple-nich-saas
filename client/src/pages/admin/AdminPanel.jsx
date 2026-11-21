import { useState } from "react";
import { useSelector } from "react-redux";
import { themes } from "../../constants/themes";
import AdminLayout from "../../components/AdminLayout";

// Import all admin pages
import AdminDashboard from "./AdminDashboard";
import AdminUsersPage from "./AdminUsersPage";
import AdminDoctorsPage from "./AdminDoctorsPage";
import AdminAppointmentsPage from "./AdminAppointmentsPage";
import AdminBusinessesPage from "./AdminBusinessesPage";
import AdminHolidaysPage from "./AdminHolidaysPage";
import AdminSlotsPage from "./AdminSlotsPage";
import AdminSubscriptionsPage from "./AdminSubscriptionsPage";
import AdminWithdrawalsPage from "./AdminWithdrawalsPage";
import AdminNotificationsPage from "./AdminNotificationsPage";

export default function AdminPanel() {
  const [theme] = useState(() => localStorage.getItem("dashboard-theme") || "day");
  const t = themes[theme] || themes.day;
  const [activeSection, setActiveSection] = useState("overview");

  // Router for Admin
  const renderSection = () => {
    switch (activeSection) {
      case "overview": return <AdminDashboard t={t} />;
      case "users": return <AdminUsersPage />;
      case "doctors": return <AdminDoctorsPage t={t} />;
      case "businesses": return <AdminBusinessesPage t={t} />;
      case "appointments": return <AdminAppointmentsPage t={t} />;
      case "slots": return <AdminSlotsPage t={t} />;
      case "holidays": return <AdminHolidaysPage t={t} />;
      case "subscriptions": return <AdminSubscriptionsPage t={t} />;
      case "withdrawals": return <AdminWithdrawalsPage t={t} />;
      case "notifications": return <AdminNotificationsPage t={t} />;
      default: return <AdminDashboard t={t} />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSelectSection={setActiveSection}>
      {renderSection()}
    </AdminLayout>
  );
}