import { useEffect, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { themes } from "../../constants/themes";

const WithdrawalFilters = ({
  filters,
  onFilterChange,
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    onFilterChange({
      ...filters,
      [name]: value,
    });
  };

  const handleClear = () => {
    onFilterChange({
      status: "",
      startDate: "",
      endDate: "",
      search: "",
      paymentMethod: "",
    });
  };

  const inputClass = `w-full min-w-0 h-10 px-3 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500`;

  return (
    <div
      className={`w-full min-w-0 ${t.card} rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${t.border} overflow-hidden transition-colors duration-200`}
    >
      <div className="w-full min-w-0">
        {/* SEARCH */}
        <div className="w-full min-w-0">
          <label
            className={`block text-xs font-semibold uppercase tracking-wide ${t.muted} mb-1.5`}
          >
            Search
          </label>

          <div className="relative w-full">
            <FaSearch
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.muted} text-sm pointer-events-none`}
            />

            <input
              type="text"
              name="search"
              placeholder="Search by transaction ID..."
              value={filters.search || ""}
              onChange={handleChange}
              className={`${inputClass} pl-9 pr-3`}
            />
          </div>
        </div>

        {/* SELECT FILTERS */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-2 gap-3 mt-3">
          {/* STATUS */}
          <div className="min-w-0">
            <label
              className={`block text-xs font-semibold uppercase tracking-wide ${t.muted} mb-1.5`}
            >
              Status
            </label>

            <select
              name="status"
              value={filters.status || ""}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="" className={`${t.card} ${t.text}`}>
                All Status
              </option>
              <option value="pending" className={`${t.card} ${t.text}`}>
                ⏳ Pending
              </option>
              <option value="approved" className={`${t.card} ${t.text}`}>
                ✅ Approved
              </option>
              <option value="processing" className={`${t.card} ${t.text}`}>
                🔄 Processing
              </option>
              <option value="completed" className={`${t.card} ${t.text}`}>
                🎉 Completed
              </option>
              <option value="failed" className={`${t.card} ${t.text}`}>
                ❌ Failed
              </option>
              <option value="cancelled" className={`${t.card} ${t.text}`}>
                🚫 Cancelled
              </option>
            </select>
          </div>

          {/* PAYMENT METHOD */}
          <div className="min-w-0">
            <label
              className={`block text-xs font-semibold uppercase tracking-wide ${t.muted} mb-1.5`}
            >
              Payment Method
            </label>

            <select
              name="paymentMethod"
              value={filters.paymentMethod || ""}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="" className={`${t.card} ${t.text}`}>
                All Methods
              </option>
              <option value="bank" className={`${t.card} ${t.text}`}>
                🏦 Bank
              </option>
              <option value="upi" className={`${t.card} ${t.text}`}>
                📱 UPI
              </option>
              <option value="paypal" className={`${t.card} ${t.text}`}>
                💳 PayPal
              </option>
            </select>
          </div>
        </div>

        {/* DATE FILTERS */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 mt-3">
          <div className="min-w-0">
            <label
              className={`block text-xs font-semibold uppercase tracking-wide ${t.muted} mb-1.5`}
            >
              Start Date
            </label>

            <input
              type="date"
              name="startDate"
              value={filters.startDate || ""}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
            <label
              className={`block text-xs font-semibold uppercase tracking-wide ${t.muted} mb-1.5`}
            >
              End Date
            </label>

            <input
              type="date"
              name="endDate"
              value={filters.endDate || ""}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleClear}
            className={`w-full sm:w-auto min-h-10 px-4 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} flex items-center justify-center gap-2 text-xs font-semibold transition-all active:scale-[0.98]`}
          >
            <FaTimes className="shrink-0" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalFilters;