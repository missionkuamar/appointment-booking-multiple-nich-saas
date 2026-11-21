import { useEffect, useState } from "react";
import {
  FaEye,
  FaTimes,
  FaCopy,
  FaHistory,
  FaWallet,
  FaMobile,
  FaPaypal,
} from "react-icons/fa";
import { CiBank } from "react-icons/ci";
import toast from "react-hot-toast";
import { themes } from "../../constants/themes";

const WithdrawalTable = ({
  withdrawals,
  pagination,
  onPageChange,
  onViewDetails,
  onCancel,
  onWithdraw,
  earnings,
  onLimitChange,
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
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style.color}`}
      >
        <span>{style.icon}</span>
        <span>{style.label}</span>
      </span>
    );
  };

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

  const handleCopy = (transactionId) => {
    if (!transactionId) return;

    navigator.clipboard
      .writeText(transactionId)
      .then(() => {
        toast.success("Transaction ID copied!");
      })
      .catch(() => {
        toast.error("Failed to copy");
      });
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const currentPage = Number(pagination?.page) || 1;
  const currentLimit = Number(pagination?.limit) || 5;
  const totalItems = Number(pagination?.total) || 0;
  const totalPages = Math.max(
    1,
    Number(pagination?.pages) || Math.ceil(totalItems / currentLimit) || 1
  );
  const startItem =
    pagination?.startItem ??
    (totalItems === 0 ? 0 : (currentPage - 1) * currentLimit + 1);
  const endItem =
    pagination?.endItem ?? Math.min(currentPage * currentLimit, totalItems);
  const hasPrevious = pagination?.hasPreviousPage ?? currentPage > 1;
  const hasNext = pagination?.hasNextPage ?? currentPage < totalPages;

  if (!withdrawals || withdrawals.length === 0) {
    return (
      <div
        className={`${t.card} rounded-2xl border ${t.border} overflow-hidden transition-colors duration-200`}
      >
        <div className="text-center py-10 sm:py-14 px-4">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl ${t.soft} border ${t.border} flex items-center justify-center`}
          >
            <FaHistory className={`text-2xl sm:text-3xl ${t.accentText}`} />
          </div>

          <p className={`text-base sm:text-lg font-bold ${t.text}`}>
            No withdrawals yet
          </p>

          <p className={`text-xs sm:text-sm ${t.muted} mt-1 max-w-sm mx-auto`}>
            You haven&apos;t made any withdrawal requests yet.
          </p>

          <button
            type="button"
            onClick={onWithdraw}
            disabled={earnings < 100}
            className={`mt-5 ${t.accent} text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs font-bold transition-all w-full max-w-xs disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90`}
          >
            Make your first withdrawal
          </button>

          {earnings < 100 && (
            <p className="text-xs text-red-500 mt-2">
              Minimum withdrawal amount is ₹100
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${t.card} rounded-2xl border ${t.border} overflow-hidden transition-colors duration-200`}
    >
      {/* DESKTOP TABLE */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full min-w-[760px] text-left border-collapse">
          <thead className={`${t.soft} border-b ${t.border}`}>
            <tr>
              <th
                className={`px-4 lg:px-5 py-3.5 text-left text-[11px] font-semibold ${t.muted} uppercase tracking-wider`}
              >
                ID
              </th>
              <th
                className={`px-4 lg:px-5 py-3.5 text-left text-[11px] font-semibold ${t.muted} uppercase tracking-wider`}
              >
                Amount
              </th>
              <th
                className={`px-4 lg:px-5 py-3.5 text-left text-[11px] font-semibold ${t.muted} uppercase tracking-wider`}
              >
                Method
              </th>
              <th
                className={`px-4 lg:px-5 py-3.5 text-left text-[11px] font-semibold ${t.muted} uppercase tracking-wider`}
              >
                Status
              </th>
              <th
                className={`px-4 lg:px-5 py-3.5 text-left text-[11px] font-semibold ${t.muted} uppercase tracking-wider`}
              >
                Date
              </th>
              <th
                className={`px-4 lg:px-5 py-3.5 text-right text-[11px] font-semibold ${t.muted} uppercase tracking-wider`}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className={`divide-y ${t.border}`}>
            {withdrawals.map((withdrawal) => (
              <tr
                key={withdrawal._id}
                className={`${t.hover} transition-colors`}
              >
                <td className="px-4 lg:px-5 py-4">
                  <span className={`text-xs font-mono ${t.muted}`}>
                    #{withdrawal._id?.slice(-8) || "N/A"}
                  </span>
                </td>

                <td className="px-4 lg:px-5 py-4">
                  <span className={`text-sm lg:text-base font-bold ${t.text}`}>
                    ₹{Number(withdrawal.amount || 0).toFixed(2)}
                  </span>
                </td>

                <td className="px-4 lg:px-5 py-4">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(withdrawal.paymentMethod)}
                    <span
                      className={`text-sm ${t.text} whitespace-nowrap`}
                    >
                      {getPaymentMethodName(withdrawal.paymentMethod)}
                    </span>
                  </div>
                </td>

                <td className="px-4 lg:px-5 py-4">
                  {getStatusBadge(withdrawal.status)}
                </td>

                <td className="px-4 lg:px-5 py-4">
                  <span
                    className={`text-sm ${t.muted} whitespace-nowrap`}
                  >
                    {formatDate(withdrawal.createdAt)}
                  </span>
                </td>

                <td className="px-4 lg:px-5 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onViewDetails(withdrawal)}
                      className={`p-2 rounded-lg ${t.hover} transition-colors`}
                      title="View Details"
                    >
                      <FaEye className={`text-sm ${t.text} opacity-80`} />
                    </button>

                    {withdrawal.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => onCancel(withdrawal._id)}
                        className="p-2 rounded-lg hover:bg-red-500/15 transition-colors"
                        title="Cancel"
                      >
                        <FaTimes className="text-sm text-red-500" />
                      </button>
                    )}

                    {withdrawal.transactionId && (
                      <button
                        type="button"
                        onClick={() => handleCopy(withdrawal.transactionId)}
                        className={`p-2 rounded-lg ${t.hover} transition-colors`}
                        title="Copy Transaction ID"
                      >
                        <FaCopy className={`text-sm ${t.muted}`} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className={`md:hidden divide-y ${t.border}`}>
        {withdrawals.map((withdrawal) => (
          <div
            key={withdrawal._id}
            className={`p-4 ${t.hover} transition-colors`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={`text-[11px] uppercase tracking-wide ${t.muted}`}
                >
                  Transaction
                </p>
                <p className={`text-xs font-mono ${t.text} mt-0.5 truncate`}>
                  #{withdrawal._id?.slice(-8) || "N/A"}
                </p>
              </div>

              <div className="shrink-0">
                {getStatusBadge(withdrawal.status)}
              </div>
            </div>

            <div className="mt-4">
              <p className={`text-xs ${t.muted}`}>Amount</p>
              <p className={`text-xl font-bold ${t.text} mt-0.5`}>
                ₹{Number(withdrawal.amount || 0).toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className={`rounded-xl p-3 ${t.soft} border ${t.border}`}>
                <p className={`text-[11px] ${t.muted}`}>Payment Method</p>
                <div className="flex items-center gap-2 mt-1">
                  {getPaymentMethodIcon(withdrawal.paymentMethod)}
                  <span className={`text-xs font-medium ${t.text} truncate`}>
                    {getPaymentMethodName(withdrawal.paymentMethod)}
                  </span>
                </div>
              </div>

              <div className={`rounded-xl p-3 ${t.soft} border ${t.border}`}>
                <p className={`text-[11px] ${t.muted}`}>Date</p>
                <p className={`text-xs font-medium ${t.text} mt-1`}>
                  {formatDate(withdrawal.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => onViewDetails(withdrawal)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} text-xs font-semibold ${t.hover} transition-colors`}
              >
                <FaEye />
                View Details
              </button>

              {withdrawal.status === "pending" && (
                <button
                  type="button"
                  onClick={() => onCancel(withdrawal._id)}
                  className="px-3 py-2 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/15 transition-colors"
                  title="Cancel"
                >
                  <FaTimes />
                </button>
              )}

              {withdrawal.transactionId && (
                <button
                  type="button"
                  onClick={() => handleCopy(withdrawal.transactionId)}
                  className={`px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} transition-colors`}
                  title="Copy Transaction ID"
                >
                  <FaCopy />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div
        className={`px-4 sm:px-5 py-4 border-t ${t.border} flex flex-col lg:flex-row items-center justify-between gap-4`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className={`text-xs sm:text-sm ${t.muted}`}>
            Showing <strong className={t.text}>{startItem}</strong>
            {" – "}
            <strong className={t.text}>{endItem}</strong>
            {" of "}
            <strong className={t.text}>{totalItems}</strong>
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs sm:text-sm ${t.muted} whitespace-nowrap`}
            >
              Items per page:
            </span>

            <select
              value={currentLimit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className={`px-3 py-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-xs sm:text-sm font-medium outline-none cursor-pointer`}
            >
              <option value={5} className={`${t.card} ${t.text}`}>5</option>
              <option value={10} className={`${t.card} ${t.text}`}>10</option>
              <option value={20} className={`${t.card} ${t.text}`}>20</option>
              <option value={50} className={`${t.card} ${t.text}`}>50</option>
              <option value={100} className={`${t.card} ${t.text}`}>100</option>
              <option value={200} className={`${t.card} ${t.text}`}>200</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => onPageChange(pagination?.firstPage || 1)}
            disabled={!hasPrevious}
            className={`px-3 py-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${t.hover} transition`}
          >
            First
          </button>

          <button
            type="button"
            onClick={() =>
              onPageChange(pagination?.previousPage || currentPage - 1)
            }
            disabled={!hasPrevious}
            className={`px-3 py-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${t.hover} transition`}
          >
            Previous
          </button>

          <div
            className={`px-3 sm:px-4 py-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-xs sm:text-sm font-semibold whitespace-nowrap`}
          >
            Page {currentPage} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() =>
              onPageChange(pagination?.nextPage || currentPage + 1)
            }
            disabled={!hasNext}
            className={`px-3 py-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${t.hover} transition`}
          >
            Next
          </button>

          <button
            type="button"
            onClick={() => onPageChange(pagination?.lastPage || totalPages)}
            disabled={!hasNext}
            className={`px-3 py-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${t.hover} transition`}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalTable;