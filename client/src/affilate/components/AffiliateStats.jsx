import { useEffect, useState } from "react";
import {
  FaLink,
  FaUsers,
  FaChartLine,
  FaMoneyBill,
} from "react-icons/fa";
import { themes } from "../../constants/themes";

const AffiliateStats = ({ stats, earnings, theme: propTheme }) => {
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

  const statsData = [
    {
      label: "Total Clicks",
      value: stats?.totalClicks ?? 0,
      icon: FaLink,
      iconColor: t.accentText,
      iconBg: t.soft,
    },
    {
      label: "Referrals",
      value: stats?.totalReferrals ?? 0,
      icon: FaUsers,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/15",
    },
    {
      label: "Conversion Rate",
      value: `${stats?.conversionRate ?? 0}%`,
      icon: FaChartLine,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/15",
    },
    {
      label: "Total Earnings",
      value: `₹${Number(earnings ?? 0).toFixed(2)}`,
      icon: FaMoneyBill,
      iconColor: "text-white",
      iconBg: t.accent,
      highlight: true,
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className={`w-full min-w-0 ${t.card} rounded-xl sm:rounded-2xl border ${
              stat.highlight ? "border-2 border-indigo-500/40" : t.border
            } p-3 sm:p-5 transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 min-w-0">
              {/* ICON */}
              <div
                className={`shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl border ${t.border} ${stat.iconBg}`}
              >
                <Icon
                  className={`${stat.iconColor} text-base sm:text-lg lg:text-xl`}
                />
              </div>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">
                <p
                  className={`${t.muted} text-[11px] sm:text-xs lg:text-sm leading-tight truncate`}
                >
                  {stat.label}
                </p>

                <p
                  className={`mt-1 font-bold leading-tight truncate text-base min-[360px]:text-lg sm:text-xl lg:text-2xl ${
                    stat.highlight ? t.accentText : t.text
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AffiliateStats;