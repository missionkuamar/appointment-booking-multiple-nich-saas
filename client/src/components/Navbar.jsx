import { Link } from "react-router-dom";
import { themes } from "../constants/themes";

const Navbar = ({ theme, setTheme, user, handleLogout }) => {
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

  const formatUserName = (rawName) => {
  if (!rawName) return "";
  return rawName
    .replace(/^\s*dr\.?\s+/i, "") // शुरू का "Dr." या "dr." हटाता है
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

  console.log("user name:", user)
  const nextThemeLabel =
    themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length] || "day";

  return (
    <nav
      className={`sticky top-0 z-20 border-b ${t.nav} px-4 md:px-8 py-4 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
        {/* Brand Logo */}
        <Link to="/dashboard" className={`text-xl font-bold ${t.accentText}`}>
          BookEasy.
        </Link>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Refer / Affiliate Button */}
          <Link
            to="/affiliate"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-500 border border-amber-500/30 hover:from-amber-500 hover:to-orange-500 hover:text-white transition-all"
          >
            <span>🎁</span>
            <span>Refer & Earn</span>
          </Link>

          {/* Single Theme Icon Switcher */}
          <button
            type="button"
            onClick={handleCycleTheme}
            title={`Switch to ${nextThemeLabel}`}
            aria-label={`Switch to ${nextThemeLabel}`}
            className={`p-2 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} text-base leading-none transition`}
          >
            {themeIcons[theme] || themeIcons.day}
          </button>

          {/* User Name */}
         <span className={`hidden md:block text-sm font-medium ${t.text}`}>
  {formatUserName(user?.name)}
</span>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 font-semibold hover:text-red-600 ml-1"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;