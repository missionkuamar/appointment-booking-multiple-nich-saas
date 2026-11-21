import { FaWallet, FaSpinner } from "react-icons/fa";
import { themes } from "../../constants/themes";
const AdminWithdrawalsHeader = ({
  onRefresh,
  loading,
  totalWithdrawals,
  theme: themeProp,
}) => {
  const fallbackKey = localStorage.getItem("dashboard-theme") || "day";
  const t = themeProp || themes[fallbackKey] || themes.day;

  return (
    <div className={`${t.card} rounded-2xl p-4 md:p-6 border ${t.border}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-2xl md:text-3xl font-bold ${t.text} flex items-center gap-2`}
          >
            <FaWallet className="text-purple-500" />
            Withdrawal Management
          </h1>
          <p className={`text-sm md:text-base ${t.muted} mt-1`}>
            {totalWithdrawals ?? 0} withdrawals found
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${t.border} ${t.text} hover:${t.hover} transition-colors text-sm w-full sm:w-auto justify-center disabled:opacity-50`}
        >
          <FaSpinner className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default AdminWithdrawalsHeader;