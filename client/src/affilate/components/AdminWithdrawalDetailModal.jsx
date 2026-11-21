import {
  FaTimes,
  FaUser,
  FaWallet,
  FaInfoCircle,
  FaCopy,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { themes } from "../../constants/themes";
const AdminWithdrawalDetailModal = ({
  isOpen,
  onClose,
  withdrawal,
  theme: themeProp,
}) => {
  const fallbackKey = localStorage.getItem("dashboard-theme") || "day";
  const t = themeProp || themes[fallbackKey] || themes.day;

  if (!isOpen || !withdrawal) return null;

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        color:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: "⏳",
        label: "Pending",
      },
      approved: {
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: "✅",
        label: "Approved",
      },
      processing: {
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        icon: "🔄",
        label: "Processing",
      },
      completed: {
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: "🎉",
        label: "Completed",
      },
      failed: {
        color:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: "❌",
        label: "Failed",
      },
      cancelled: {
        color:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        icon: "🚫",
        label: "Cancelled",
      },
    };
    const style = config[status] || config.pending;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${style.color} flex items-center gap-1 w-fit`}
      >
        {style.icon} {style.label}
      </span>
    );
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied!");
    }
  };

  const formattedDate = withdrawal.createdAt
    ? new Date(withdrawal.createdAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 md:px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div
          className={`relative ${t.card} rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto border ${t.border}`}
        >
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-inherit z-10 pb-2">
            <h3
              className={`text-lg font-semibold ${t.text} flex items-center gap-2`}
            >
              <FaWallet className="text-purple-500" />
              Withdrawal Details
            </h3>
            <button
              onClick={onClose}
              className={`${t.muted} hover:opacity-100 transition-opacity`}
            >
              <FaTimes />
            </button>
          </div>

          <div className="space-y-4">
            {/* User Info */}
            <div className={`p-4 rounded-xl ${t.soft} border ${t.border}`}>
              <h4
                className={`text-sm font-semibold ${t.text} mb-3 flex items-center gap-2`}
              >
                <FaUser className="text-blue-500" /> User Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className={`text-xs ${t.muted}`}>Name</p>
                  <p className={`font-medium ${t.text}`}>
                    {withdrawal.user?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${t.muted}`}>Email</p>
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${t.text}`}>
                      {withdrawal.user?.email || "No email"}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(withdrawal.user?.email)}
                      className={`p-1 rounded ${t.hover} transition-colors`}
                    >
                      <FaCopy className={`text-xs ${t.muted}`} />
                    </button>
                  </div>
                </div>
                {withdrawal.user?.phone && (
                  <div>
                    <p className={`text-xs ${t.muted}`}>Phone</p>
                    <p className={`font-medium ${t.text}`}>
                      {withdrawal.user.phone}
                    </p>
                  </div>
                )}
                <div>
                  <p className={`text-xs ${t.muted}`}>User ID</p>
                  <p className={`text-xs font-mono ${t.muted}`}>
                    {withdrawal.user?._id?.slice(-8) || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Withdrawal Details */}
            <div className={`p-4 rounded-xl ${t.soft} border ${t.border}`}>
              <h4
                className={`text-sm font-semibold ${t.text} mb-3 flex items-center gap-2`}
              >
                <FaWallet className="text-purple-500" /> Withdrawal Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={`text-xs ${t.muted}`}>Amount</p>
                  <p className={`text-lg md:text-xl font-bold ${t.accentText}`}>
                    ₹{Number(withdrawal.amount || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${t.muted}`}>Status</p>
                  {getStatusBadge(withdrawal.status)}
                </div>
                <div>
                  <p className={`text-xs ${t.muted}`}>Method</p>
                  <p className={`font-medium ${t.text} capitalize`}>
                    {withdrawal.paymentMethod || "N/A"}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${t.muted}`}>Requested</p>
                  <p className={`text-sm ${t.text}`}>{formattedDate}</p>
                </div>
                {withdrawal.transactionId && (
                  <div className="col-span-2">
                    <p className={`text-xs ${t.muted}`}>Transaction ID</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-mono ${t.text}`}>
                        {withdrawal.transactionId}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(withdrawal.transactionId)
                        }
                        className={`p-1 rounded ${t.hover} transition-colors`}
                      >
                        <FaCopy className={`text-xs ${t.muted}`} />
                      </button>
                    </div>
                  </div>
                )}
                {withdrawal.notes && (
                  <div className="col-span-2">
                    <p className={`text-xs ${t.muted}`}>Notes</p>
                    <p className={`text-sm ${t.text}`}>{withdrawal.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            {withdrawal.paymentDetails && (
              <div className={`p-4 rounded-xl ${t.soft} border ${t.border}`}>
                <h4
                  className={`text-sm font-semibold ${t.text} mb-3 flex items-center gap-2`}
                >
                  <FaInfoCircle className="text-green-500" /> Payment Details
                </h4>
                <div className={`p-3 rounded-lg ${t.card} border ${t.border}`}>
                  <pre
                    className={`text-xs ${t.text} overflow-x-auto whitespace-pre-wrap`}
                  >
                    {JSON.stringify(withdrawal.paymentDetails, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border ${t.border} ${t.text} hover:${t.hover} transition-colors text-sm`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawalDetailModal;