import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Outlet } from "react-router-dom"; // 🔴 Outlet & useLocation import karo
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";

import { themes } from "../constants/themes";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // 🔴 URL check karne ke liye
  const { user } = useSelector((s) => s.auth || {});

  const [theme, setTheme] = useState(
    () => localStorage.getItem("dashboard-theme") || "day"
  );
  const t = themes[theme] || themes.day;

  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 1024
  );

  // 🔴 URL se active section nikalne ka logic
  // Agar URL "/admin" hai toh "overview", aur agar "/admin/users" hai toh "users"
  const pathParts = location.pathname.split("/");
  const activeSection = pathParts[2] || "overview";

  // 🔴 Sidebar click hone par URL change karne ka logic
  const handleSelectSection = (sectionId) => {
    if (sectionId === "overview") {
      navigate("/admin");
    } else {
      navigate(`/admin/${sectionId}`);
    }
  };

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  return (
    <div className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}>
      {/* 1. TOP NAVBAR */}
      <AdminNavbar
        theme={theme}
        setTheme={setTheme}
        user={user}
        handleLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* 2. SECOND SECTION: LEFT SIDEBAR + RIGHT MAIN SECTION */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col lg:flex-row gap-6 items-start">
        
        {/* SIDEBAR */}
        <AdminSidebar
          t={t}
          user={user}
          activeSection={activeSection} // 🔴 Auto-detected from URL
          onSelectSection={handleSelectSection} // 🔴 Navigates to URL
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 w-full">
          {/* 🔴 Yahan Outlet aayega jo App.jsx ke nested routes ko render karega */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}