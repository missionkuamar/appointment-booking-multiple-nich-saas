import { useEffect, useState } from "react";
import { FaTimes, FaChartLine } from "react-icons/fa";
import { themes } from "../../constants/themes";

const WithdrawalStatsModal = ({
  isOpen,
  onClose,
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
  }, [propTheme, isOpen]);

  if (!isOpen) return null;

  const t =
    propTheme && typeof propTheme === "object"
      ? propTheme
      : themes[activeThemeName] || themes.day;

  const safeList = Array.isArray(withdrawals) ? withdrawals : [];
  const totalAmount = safeList.reduce(
    (sum, w) => sum + (Number(w?.amount) || 0),
    0
  );
  const averageAmount = safeList.length > 0 ? totalAmount / safeList.length : 0;
  const highestAmount =
    safeList.length > 0
      ? Math.max(...safeList.map((w) => Number(w?.amount) || 0))
      : 0;

  const statusColors = {
    pending: "bg-yellow-500",
    processing: "bg-purple-500",
    completed: "bg-green-500",
    failed: "bg-red-500",
    cancelled: "bg-gray-500",
  };

  const statusLabels = {
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 md:px-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
          onClick={onClose}
        />

        <div
          className={`relative ${t.card} rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 border ${t.border} transition-colors duration-200`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className={`text-lg font-bold ${t.text} flex items-center gap-2`}
            >
              <FaChartLine className={t.accentText} />
              Withdrawal Statistics
            </h3>
            <button
              type="button"
              onClick={onClose}
              className={`${t.text} ${t.hover} p-1.5 rounded-lg transition`}
              aria-label="Close statistics modal"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl ${t.soft} border ${t.border}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${t.muted}`}>
                Total Withdrawals
              </p>
              <p className={`text-2xl font-bold ${t.text} mt-1`}>
                {safeList.length}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${t.soft} border ${t.border}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${t.muted}`}>
                Total Amount
              </p>
              <p className={`text-2xl font-bold ${t.accentText} mt-1`}>
                ₹{totalAmount.toFixed(2)}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${t.soft} border ${t.border}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${t.muted}`}>
                Average Amount
              </p>
              <p className={`text-2xl font-bold ${t.text} mt-1`}>
                ₹{averageAmount.toFixed(2)}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${t.soft} border ${t.border}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${t.muted}`}>
                Highest Withdrawal
              </p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                ₹{highestAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className={`mt-4 p-4 rounded-xl ${t.soft} border ${t.border}`}>
            <h4 className={`text-sm font-bold ${t.text} mb-3`}>
              Status Breakdown
            </h4>

            {safeList.length === 0 ? (
              <p className={`text-xs ${t.muted}`}>
                No withdrawal records available for breakdown.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(statusLabels).map(([status, label]) => {
                  const count = safeList.filter(
                    (w) => w.status === status
                  ).length;
                  if (count === 0) return null;
                  const widthPct = Math.max(
                    8,
                    Math.round((count / safeList.length) * 100)
                  );

                  return (
                    <div
                      key={status}
                      className={`p-2.5 rounded-xl ${t.card} border ${t.border} text-center`}
                    >
                      <div className={`w-full h-2 rounded-full ${t.soft} overflow-hidden mb-2`}>
                        <div
                          className={`h-full rounded-full ${statusColors[status]}`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <p className={`text-xs ${t.muted}`}>{label}</p>
                      <p className={`text-sm font-bold ${t.text} mt-0.5`}>
                        {count}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} transition-colors text-xs font-semibold`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalStatsModal;