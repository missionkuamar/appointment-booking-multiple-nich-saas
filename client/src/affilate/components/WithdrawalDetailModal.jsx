import { useEffect, useState } from "react";
import {
  FaTimes,
  FaFileInvoice,
  FaCopy,
  FaMobile,
  FaPaypal,
  FaWallet,
} from "react-icons/fa";
import { CiBank } from "react-icons/ci";
import toast from "react-hot-toast";
import { themes } from "../../constants/themes";

const WithdrawalDetailModal = ({
  isOpen,
  onClose,
  withdrawal,
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

  if (!isOpen || !withdrawal) return null;

  const t =
    propTheme && typeof propTheme === "object"
      ? propTheme
      : themes[activeThemeName] || themes.day;

  const getPaymentMethodIcon = (method) => {
    const icons = {
      bank: <CiBank className="text-blue-500 text-lg" />,
      upi: <FaMobile className="text-green-500 text-lg" />,
      paypal: <FaPaypal className="text-blue-400 text-lg" />,
    };
    return icons[method] || <FaWallet className={`${t.muted} text-lg`} />;
  };

  const getPaymentMethodName = (method) => {
    const names = {
      bank: "Bank Transfer",
      upi: "UPI",
      paypal: "PayPal",
    };
    return names[method] || method || "Unknown";
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        color: "bg-yellow-500/15 text-yellow-500",
        icon: "⏳",
        label: "Pending",
      },
      approved: {
        color: "bg-blue-500/15 text-blue-500",
        icon: "✅",
        label: "Approved",
      },
      processing: {
        color: "bg-purple-500/15 text-purple-500",
        icon: "🔄",
        label: "Processing",
      },
      completed: {
        color: "bg-green-500/15 text-green-500",
        icon: "🎉",
        label: "Completed",
      },
      failed: {
        color: "bg-red-500/15 text-red-500",
        icon: "❌",
        label: "Failed",
      },
      cancelled: {
        color: "bg-gray-500/15 text-gray-500",
        icon: "🚫",
        label: "Cancelled",
      },
    };
    const style = config[status] || config.pending;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${style.color} flex items-center gap-1 w-fit`}
      >
        {style.icon} {style.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 md:px-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
          onClick={onClose}
        />

        <div
          className={`relative ${t.card} rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6 border ${t.border} transition-colors duration-200`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className={`text-lg font-bold ${t.text} flex items-center gap-2`}
            >
              <FaFileInvoice className={t.accentText} />
              Withdrawal Details
            </h3>
            <button
              type="button"
              onClick={onClose}
              className={`${t.text} ${t.hover} p-1.5 rounded-lg transition`}
              aria-label="Close details modal"
            >
              <FaTimes />
            </button>
          </div>

          <div
            className={`p-4 rounded-xl ${t.soft} border ${t.border}`}
          >
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <p className={`text-xs ${t.muted}`}>Transaction ID</p>
                <p className={`text-sm font-mono font-semibold ${t.text} mt-0.5`}>
                  #{withdrawal._id?.slice(-8) || "N/A"}
                </p>
              </div>

              <div>
                <p className={`text-xs ${t.muted}`}>Amount</p>
                <p className={`text-lg font-bold ${t.accentText} mt-0.5`}>
                  ₹{Number(withdrawal.amount || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <p className={`text-xs ${t.muted}`}>Payment Method</p>
                <div className="flex items-center gap-2 mt-1">
                  {getPaymentMethodIcon(withdrawal.paymentMethod)}
                  <span className={`text-sm font-medium ${t.text}`}>
                    {getPaymentMethodName(withdrawal.paymentMethod)}
                  </span>
                </div>
              </div>

              <div>
                <p className={`text-xs ${t.muted}`}>Status</p>
                <div className="mt-1">{getStatusBadge(withdrawal.status)}</div>
              </div>

              <div className="col-span-2">
                <p className={`text-xs ${t.muted}`}>Date</p>
                <p className={`text-sm font-medium ${t.text} mt-0.5`}>
                  {withdrawal.createdAt
                    ? new Date(withdrawal.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>

              {withdrawal.transactionId && (
                <div className="col-span-2">
                  <p className={`text-xs ${t.muted}`}>
                    Gateway / Reference ID
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-sm font-mono ${t.text} break-all`}>
                      {withdrawal.transactionId}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(withdrawal.transactionId);
                        toast.success("Copied!");
                      }}
                      className={`p-1.5 rounded-lg ${t.hover} transition-colors shrink-0`}
                      title="Copy ID"
                    >
                      <FaCopy className={`text-xs ${t.muted}`} />
                    </button>
                  </div>
                </div>
              )}

              {withdrawal.remarks && (
                <div className="col-span-2">
                  <p className={`text-xs ${t.muted}`}>Remarks</p>
                  <p className={`text-sm ${t.text} mt-0.5`}>
                    {withdrawal.remarks}
                  </p>
                </div>
              )}
            </div>
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

export default WithdrawalDetailModal;