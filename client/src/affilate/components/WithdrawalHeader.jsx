import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaWallet,
  FaChartLine,
} from "react-icons/fa";
import { themes } from "../../constants/themes";

const WithdrawalHeader = ({
  onBack,
  onViewStats,
  onWithdraw,
  earnings = 0,
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

  const availableEarnings = Number(earnings) || 0;
  const canWithdraw = availableEarnings >= 100;

  return (
    <div
      className={`w-full min-w-0 ${t.card} rounded-xl sm:rounded-2xl border ${t.border} overflow-hidden transition-colors duration-200`}
    >
      <div className="p-4 sm:p-5 md:p-6">
        {/* TOP SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          {/* LEFT SIDE */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border ${t.border} ${t.soft} ${t.hover} flex items-center justify-center transition-all hover:scale-105 active:scale-95`}
            >
              <FaArrowLeft className={`${t.text} text-sm sm:text-base`} />
            </button>

            <div className="min-w-0">
              <h1
                className={`${t.text} text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 leading-tight`}
              >
                <span className="shrink-0">💰</span>
                <span className="truncate">Withdrawals</span>
              </h1>

              <p className={`mt-1 ${t.muted} text-xs sm:text-sm leading-relaxed max-w-xl`}>
                Manage your withdrawals and track earnings
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={onViewStats}
              className={`w-full sm:w-auto min-h-[40px] px-4 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} flex items-center justify-center gap-2 text-xs font-semibold transition-all active:scale-[0.98] whitespace-nowrap`}
            >
              <FaChartLine className={`shrink-0 ${t.accentText}`} />
              <span>View Stats</span>
            </button>

            <button
              type="button"
              onClick={onWithdraw}
              disabled={!canWithdraw}
              title={
                !canWithdraw
                  ? "Minimum withdrawal amount is ₹100"
                  : "Withdraw your earnings"
              }
              className={`w-full sm:w-auto min-h-[40px] px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-white whitespace-nowrap transition-all ${
                canWithdraw
                  ? `${t.accent} hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]`
                  : `${t.accent} opacity-50 cursor-not-allowed`
              }`}
            >
              <FaWallet className="shrink-0" />
              <span>Withdraw Now</span>
            </button>
          </div>
        </div>

        {/* EARNINGS INFO */}
        <div className={`mt-4 pt-4 border-t ${t.border}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-[11px] sm:text-xs ${t.muted}`}>
                Available Earnings
              </p>
              <p className={`mt-0.5 text-lg sm:text-xl font-bold ${t.text}`}>
                ₹{availableEarnings.toFixed(2)}
              </p>
            </div>

            <div
              className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                canWithdraw
                  ? "bg-green-500/15 text-green-500"
                  : "bg-yellow-500/15 text-yellow-500"
              }`}
            >
              {canWithdraw
                ? "Eligible for withdrawal"
                : "Minimum ₹100 required"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalHeader;