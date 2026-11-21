import { useEffect, useState } from "react";
import {
  FaChartLine,
  FaWallet,
  FaDownload,
  FaClock,
} from "react-icons/fa";
import { themes } from "../../constants/themes";

const WithdrawalStats = ({
  withdrawStats,
  withdrawals = [],
  theme: propTheme,
}) => {
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

  const totalEarnings = Number(withdrawStats?.totalEarnings) || 0;
  const availableBalance = Number(withdrawStats?.availableBalance) || 0;
  const totalWithdrawn = Number(withdrawStats?.totalWithdrawn) || 0;
  const pendingWithdrawals = Number(withdrawStats?.pendingWithdrawals) || 0;

  const statsData = [
    {
      label: "Total Earnings",
      value: `₹${totalEarnings.toFixed(2)}`,
      icon: FaChartLine,
      iconBg: t.accent,
      iconColor: "text-white",
      textColor: t.accentText,
    },
    {
      label: "Available Balance",
      value: `₹${availableBalance.toFixed(2)}`,
      icon: FaWallet,
      iconBg: "bg-green-500/15",
      iconColor: "text-green-500",
      textColor: "text-green-500",
    },
    {
      label: "Total Withdrawn",
      value: `₹${totalWithdrawn.toFixed(2)}`,
      icon: FaDownload,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
      textColor: "text-blue-500",
    },
    {
      label: "Pending Withdrawals",
      value: `₹${pendingWithdrawals.toFixed(2)}`,
      icon: FaClock,
      iconBg: "bg-yellow-500/15",
      iconColor: "text-yellow-500",
      textColor: "text-yellow-500",
      highlight: true,
    },
  ];

  const statusCounts = [
    {
      label: "Total",
      value: withdrawals.length,
      color: t.text,
    },
    {
      label: "Pending",
      value: withdrawals.filter((w) => w.status === "pending").length,
      color: "text-yellow-500",
    },
    {
      label: "Processing",
      value: withdrawals.filter((w) => w.status === "processing").length,
      color: "text-purple-500",
    },
    {
      label: "Completed",
      value: withdrawals.filter((w) => w.status === "completed").length,
      color: "text-green-500",
    },
    {
      label: "Failed",
      value: withdrawals.filter((w) => w.status === "failed").length,
      color: "text-red-500",
    },
    {
      label: "Cancelled",
      value: withdrawals.filter((w) => w.status === "cancelled").length,
      color: t.muted,
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-3 sm:space-y-4">
      {/* MAIN STATS CARDS */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className={`${t.card} w-full min-w-0 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border ${
                stat.highlight ? "border-2 border-indigo-500/35" : t.border
              } transition-colors duration-200`}
            >
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[11px] sm:text-xs md:text-sm ${t.muted} truncate`}
                    title={stat.label}
                  >
                    {stat.label}
                  </p>

                  <p
                    className={`mt-1 text-base sm:text-lg md:text-2xl font-bold ${stat.textColor} truncate`}
                    title={stat.value}
                  >
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl ${stat.iconBg} border ${t.border} flex items-center justify-center`}
                >
                  <Icon
                    className={`text-sm sm:text-base md:text-xl ${stat.iconColor}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK STATUS SUMMARY */}
      <div
        className={`w-full min-w-0 ${t.soft} rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${t.border} overflow-hidden transition-colors duration-200`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {statusCounts.map((status, index) => (
            <div
              key={index}
              className={`min-w-0 text-center rounded-lg sm:rounded-xl px-2 py-2 sm:py-3 ${t.card} border ${t.border}`}
            >
              <p
                className={`text-[10px] sm:text-xs ${t.muted} truncate`}
                title={status.label}
              >
                {status.label}
              </p>

              <p
                className={`mt-0.5 text-sm sm:text-base md:text-lg font-bold ${status.color}`}
              >
                {status.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalStats;