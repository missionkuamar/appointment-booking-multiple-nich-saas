import { useEffect, useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { themes } from "../../constants/themes";

const AffiliateCommission = ({ affiliate, theme: propTheme }) => {
  const [activeThemeName, setActiveThemeName] = useState(() => {
    if (typeof propTheme === "string" && themes[propTheme]) {
      return propTheme;
    }
    return localStorage.getItem("dashboard-theme") || "day";
  });

  useEffect(() => {
    if (typeof propTheme === "string" && themes[propTheme]) {
      setActiveThemeName(propTheme);
      return;
    }
    const saved = localStorage.getItem("dashboard-theme");
    if (saved && themes[saved]) {
      setActiveThemeName(saved);
    }
  }, [propTheme]);

  const t =
    propTheme && typeof propTheme === "object"
      ? propTheme
      : themes[activeThemeName] || themes.day;

  const rate = affiliate?.commissionRate || 10;
  const isRecurring = affiliate?.commissionType === "recurring";

  return (
    <div
      className={`${t.card} rounded-2xl p-4 sm:p-5 border ${t.border} transition-colors duration-200`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl ${t.soft} border ${t.border} flex items-center justify-center shrink-0`}
        >
          <FaInfoCircle className={`${t.accentText} text-lg`} />
        </div>

        <div>
          <p className={`font-bold text-sm sm:text-base ${t.text}`}>
            {isRecurring ? "🔄 Recurring Commission" : "💰 One-time Commission"}
          </p>
          <p className={`text-xs sm:text-sm ${t.muted} mt-0.5`}>
            {isRecurring
              ? `You earn ${rate}% every time your referral renews or upgrades their subscription`
              : `You earn ${rate}% once when your referral subscribes to a paid plan`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateCommission;