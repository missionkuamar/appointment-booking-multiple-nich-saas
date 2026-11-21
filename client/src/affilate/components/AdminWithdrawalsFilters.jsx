import { FaSearch } from "react-icons/fa";
import { themes } from "../../constants/themes";
const AdminWithdrawalsFilters = ({
  filters,
  searchTerm,
  onStatusChange,
  onSearch,
  onClearFilters,
  theme: themeProp,
}) => {
  const fallbackKey = localStorage.getItem("dashboard-theme") || "day";
  const t = themeProp || themes[fallbackKey] || themes.day;

  return (
    <div className={`${t.card} rounded-2xl p-4 border ${t.border}`}>
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <FaSearch
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.muted}`}
            />
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
            />
          </div>
        </div>

        <select
          value={filters?.status || ""}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full lg:w-auto`}
        >
          <option value="">📋 All Status</option>
          <option value="pending">⏳ Pending</option>
          <option value="approved">✅ Approved</option>
          <option value="processing">🔄 Processing</option>
          <option value="cancelled">🚫 Cancelled</option>
          <option value="completed">🎉 Completed</option>
          <option value="failed">❌ Failed</option>
        </select>

        <button
          type="button"
          onClick={onClearFilters}
          className={`px-4 py-2 rounded-xl border ${t.border} ${t.text} hover:${t.hover} transition-colors text-sm w-full lg:w-auto`}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default AdminWithdrawalsFilters;