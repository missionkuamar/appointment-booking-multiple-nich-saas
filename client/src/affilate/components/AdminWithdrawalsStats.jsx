import { FaWallet, FaClock, FaCheckCircle } from "react-icons/fa";
import { themes } from "../../constants/themes";
const AdminWithdrawalsStats = ({ withdrawals = [], theme: themeProp }) => {
  const fallbackKey = localStorage.getItem("dashboard-theme") || "day";
  const t = themeProp || themes[fallbackKey] || themes.day;

  const list = Array.isArray(withdrawals) ? withdrawals : [];
  const total = list.length;
  const pending = list.filter((w) => w?.status === "pending").length;
  const completed = list.filter((w) => w?.status === "completed").length;
  const totalAmount = list.reduce(
    (sum, w) => sum + (Number(w?.amount) || 0),
    0
  );

  const stats = [
    {
      label: "Total Requests",
      value: total,
      icon: FaWallet,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Pending",
      value: pending,
      icon: FaClock,
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      textColor: "text-yellow-600 dark:text-yellow-400",
      highlight: pending > 0,
    },
    {
      label: "Completed",
      value: completed,
      icon: FaCheckCircle,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Total Amount",
      value: `₹${totalAmount.toFixed(2)}`,
      icon: FaWallet,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`${t.card} p-4 rounded-2xl border ${t.border} ${
              stat.highlight ? `ring-2 ring-yellow-500/40` : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`${stat.bgColor} p-2 md:p-3 rounded-xl`}>
                <Icon className={`${stat.textColor} text-lg md:text-xl`} />
              </div>
            </div>
            <p
              className={`text-xl md:text-2xl lg:text-3xl font-bold ${t.text} mt-2`}
            >
              {stat.value}
            </p>
            <p className={`text-xs md:text-sm ${t.muted}`}>{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default AdminWithdrawalsStats;