import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { themes } from "../constants/themes";

export default function AdminNavbar({
  theme,
  setTheme,
  user,
  handleLogout,
  sidebarOpen,
  onToggleSidebar,
}) {
  const t = themes[theme] || themes.day;

  const themeOrder = ["day", "night", "midnight"];
  const themeIcons = {
    day: "☀️",
    night: "🌙",
    midnight: "🌌",
  };

  const handleCycleTheme = () => {
    const currentIdx = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIdx + 1) % themeOrder.length] || "day";
    setTheme(nextTheme);
  };

  const nextThemeLabel =
    themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length] || "day";

  return (
    <header
      className={`sticky top-0 z-30 w-full border-b ${t.nav} px-4 md:px-8 py-3.5 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
        {/* Left: Sidebar Toggle + Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            className={`p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} text-sm transition cursor-pointer`}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          <Link
            to="/admin/users"
            className={`text-xl font-bold flex items-center gap-2 ${t.accentText}`}
          >
            <span>BookEasy.</span>
            <span
              className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${t.border} ${t.soft} ${t.text}`}
            >
              {user?.role === "super_admin" ? "Super Admin" : "Admin"}
            </span>
          </Link>
        </div>

        {/* Right: Theme Switcher + User + Logout */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCycleTheme}
            title={`Switch to ${nextThemeLabel}`}
            aria-label={`Switch to ${nextThemeLabel}`}
            className={`p-2 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} text-base leading-none transition cursor-pointer`}
          >
            {themeIcons[theme] || themeIcons.day}
          </button>

          <div className="hidden sm:flex flex-col text-right">
            <span className={`text-sm font-semibold leading-tight ${t.text}`}>
              {user?.name || "Admin"}
            </span>
            <span className={`text-[11px] uppercase ${t.muted}`}>
              {user?.role || "admin"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}