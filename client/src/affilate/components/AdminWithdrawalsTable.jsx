import { useState, useEffect } from "react";
import {
  FaWallet,
  FaEye,
  FaCopy,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { themes } from "../../constants/themes";

const ALLOWED_LIMITS = [5, 10, 20, 50, 100, 200];

const AdminWithdrawalsTable = ({
  withdrawals = [],
  pagination = {},
  onPageChange,
  onLimitChange,
  onApprove,
  onComplete,
  onReject,
  onViewDetails,
  processing = false,
  theme: themeProp,
}) => {
  const fallbackKey = localStorage.getItem("dashboard-theme") || "day";
  const t = themeProp || themes[fallbackKey] || themes.day;

  const safeWithdrawals = Array.isArray(withdrawals)
    ? withdrawals.filter(Boolean)
    : [];

  const safePagination =
    pagination && typeof pagination === "object" ? pagination : {};

  const [internalPage, setInternalPage] = useState(1);
  const [internalLimit, setInternalLimit] = useState(10);

  useEffect(() => {
    const nextPage = Number(safePagination?.page);
    if (Number.isInteger(nextPage) && nextPage > 0) {
      setInternalPage((prev) => (prev === nextPage ? prev : nextPage));
    }
  }, [safePagination?.page]);

  useEffect(() => {
    const nextLimit = Number(safePagination?.limit);
    if (ALLOWED_LIMITS.includes(nextLimit)) {
      setInternalLimit((prev) => (prev === nextLimit ? prev : nextLimit));
    }
  }, [safePagination?.limit]);

  const currentPage =
    typeof onPageChange === "function" && Number(safePagination?.page) > 0
      ? Number(safePagination.page)
      : internalPage;

  const currentLimit =
    typeof onLimitChange === "function" && Number(safePagination?.limit) > 0
      ? Number(safePagination.limit)
      : internalLimit;

  const rawTotal = Number(safePagination?.total);
  const total =
    Number.isFinite(rawTotal) && rawTotal >= safeWithdrawals.length
      ? rawTotal
      : safeWithdrawals.length;

  const totalPages = Math.max(
    1,
    Number(safePagination?.pages) > 0 && rawTotal >= safeWithdrawals.length
      ? Number(safePagination.pages)
      : Math.ceil(total / currentLimit)
  );

  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const firstPage = 1;
  const lastPage = totalPages;

  const hasPreviousPage =
    validCurrentPage > 1 ||
    Boolean(safePagination?.hasPreviousPage || safePagination?.hasPrev);
  const hasNextPage =
    validCurrentPage < totalPages ||
    Boolean(safePagination?.hasNextPage || safePagination?.hasNext);

  const displayedWithdrawals =
    safeWithdrawals.length > currentLimit
      ? safeWithdrawals.slice(
          (validCurrentPage - 1) * currentLimit,
          validCurrentPage * currentLimit
        )
      : safeWithdrawals;

  const startItem = total === 0 ? 0 : (validCurrentPage - 1) * currentLimit + 1;
  const endItem = total === 0 ? 0 : Math.min(validCurrentPage * currentLimit, total);

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

    const safeStatus =
      typeof status === "string" ? status.toLowerCase() : "pending";
    const style = config[safeStatus] || config.pending;

    return (
      <span
        className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${style.color} flex items-center gap-1 w-fit`}
      >
        <span>{style.icon}</span>
        <span>{style.label}</span>
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const safeMethod = typeof method === "string" ? method.toLowerCase() : "";
    const icons = {
      bank: "🏦",
      upi: "📱",
      paypal: "💳",
    };
    return icons[safeMethod] || "💳";
  };

  const getPaymentMethodName = (method) => {
    const safeMethod = typeof method === "string" ? method.toLowerCase() : "";
    const names = {
      bank: "Bank Transfer",
      upi: "UPI",
      paypal: "PayPal",
    };
    return names[safeMethod] || (safeMethod ? safeMethod.toUpperCase() : "Unknown");
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    try {
      return parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatAmount = (amount) => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return "₹0.00";
    return `₹${numericAmount.toFixed(2)}`;
  };

  const copyToClipboard = async (text) => {
    if (!text) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(text));
        toast.success("Copied!");
      } else {
        toast.error("Copy is not supported in this browser");
      }
    } catch {
      toast.error("Failed to copy");
    }
  };

  const safePageChange = (page) => {
    const numericPage = Number(page);
    if (!Number.isFinite(numericPage) || numericPage < 1) return;

    const next = Math.min(Math.max(Math.floor(numericPage), 1), totalPages);
    setInternalPage(next);
    if (typeof onPageChange === "function") {
      onPageChange(next);
    }
  };

  const safeLimitChange = (limit) => {
    const numericLimit = Number(limit);
    if (!ALLOWED_LIMITS.includes(numericLimit)) return;

    setInternalLimit(numericLimit);
    setInternalPage(1);
    if (typeof onLimitChange === "function") {
      onLimitChange(numericLimit);
    }
  };

  const safeApprove = (id) => {
    if (id && typeof onApprove === "function") onApprove(id);
  };

  const safeComplete = (id) => {
    if (id && typeof onComplete === "function") onComplete(id);
  };

  const safeReject = (id) => {
    if (id && typeof onReject === "function") onReject(id);
  };

  const safeViewDetails = (withdrawal) => {
    if (withdrawal && typeof onViewDetails === "function") {
      onViewDetails(withdrawal);
    }
  };

  if (safeWithdrawals.length === 0) {
    return (
      <div className={`${t.card} rounded-2xl border ${t.border} overflow-hidden`}>
        <div className={`text-center py-12 ${t.text}`}>
          <FaWallet className="text-6xl mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No withdrawal requests</p>
          <p className={`text-sm ${t.muted} mt-1`}>
            When affiliates request withdrawals, they will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${t.card} rounded-2xl border ${t.border} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={t.soft}>
            <tr>
              <th
                className={`px-3 md:px-4 py-3 text-left text-xs font-medium ${t.muted} uppercase tracking-wider`}
              >
                User
              </th>
              <th
                className={`px-3 md:px-4 py-3 text-left text-xs font-medium ${t.muted} uppercase tracking-wider`}
              >
                Amount
              </th>
              <th
                className={`px-3 md:px-4 py-3 text-left text-xs font-medium ${t.muted} uppercase tracking-wider hidden sm:table-cell`}
              >
                Method
              </th>
              <th
                className={`px-3 md:px-4 py-3 text-left text-xs font-medium ${t.muted} uppercase tracking-wider`}
              >
                Status
              </th>
              <th
                className={`px-3 md:px-4 py-3 text-left text-xs font-medium ${t.muted} uppercase tracking-wider hidden md:table-cell`}
              >
                Date
              </th>
              <th
                className={`px-3 md:px-4 py-3 text-right text-xs font-medium ${t.muted} uppercase tracking-wider`}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayedWithdrawals.map((withdrawal, index) => {
              const w =
                withdrawal && typeof withdrawal === "object" ? withdrawal : {};
              const id = w?._id || w?.id || `withdrawal-${index}`;
              const user = w?.user && typeof w.user === "object" ? w.user : {};

              const userName = user?.name || w?.userName || "Unknown";
              const userEmail = user?.email || w?.userEmail || "No email";
              const amount = formatAmount(w?.amount);
              const paymentMethod = w?.paymentMethod || "unknown";
              const status = w?.status || "pending";
              const transactionId = w?.transactionId || "";

              return (
                <tr key={id} className={`${t.hover} transition-colors`}>
                  <td className="px-3 md:px-4 py-3">
                    <div>
                      <p className={`text-sm font-medium ${t.text}`}>
                        {userName}
                      </p>
                      <p
                        className={`text-xs md:text-sm ${t.muted} truncate max-w-[120px] md:max-w-none`}
                      >
                        {userEmail}
                      </p>
                    </div>
                  </td>

                  <td className="px-3 md:px-4 py-3">
                    <span className={`text-sm md:text-base font-bold ${t.text}`}>
                      {amount}
                    </span>
                  </td>

                  <td className="px-3 md:px-4 py-3 hidden sm:table-cell">
                    <span className={`text-sm ${t.text} flex items-center gap-1`}>
                      {getPaymentMethodIcon(paymentMethod)}
                      {getPaymentMethodName(paymentMethod)}
                    </span>
                  </td>

                  <td className="px-3 md:px-4 py-3">
                    {getStatusBadge(status)}
                  </td>

                  <td className="px-3 md:px-4 py-3 hidden md:table-cell">
                    <span className={`text-sm ${t.muted}`}>
                      {formatDate(w?.createdAt)}
                    </span>
                  </td>

                  <td className="px-3 md:px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 md:gap-2 flex-wrap">
                      {status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => safeApprove(w?._id)}
                            disabled={processing || !w?._id}
                            className={`px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors ${
                              processing || !w?._id
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            title="Approve"
                          >
                            <FaCheck size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => safeComplete(w?._id)}
                            disabled={processing || !w?._id}
                            className={`px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors ${
                              processing || !w?._id
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            title="Complete"
                          >
                            <FaCheck size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => safeReject(w?._id)}
                            disabled={processing || !w?._id}
                            className={`px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors ${
                              processing || !w?._id
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            title="Reject"
                          >
                            <FaTimes size={12} />
                          </button>
                        </>
                      )}

                      {status === "approved" && (
                        <button
                          type="button"
                          onClick={() => safeComplete(w?._id)}
                          disabled={processing || !w?._id}
                          className={`px-2 md:px-3 py-1 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors ${
                            processing || !w?._id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          Complete
                        </button>
                      )}

                      {transactionId && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(transactionId)}
                          className={`p-1 rounded-lg ${t.hover} transition-colors`}
                          title="Copy Transaction ID"
                        >
                          <FaCopy className={`text-sm ${t.muted}`} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => safeViewDetails(w)}
                        disabled={!w?._id}
                        className={`p-1 rounded-lg ${t.hover} transition-colors ${
                          !w?._id ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                        title="View Details"
                      >
                        <FaEye className={`text-sm ${t.muted}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div
        className={`px-4 md:px-6 py-4 border-t ${t.border} flex flex-col lg:flex-row items-center justify-between gap-4`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className={`text-xs sm:text-sm ${t.muted}`}>
            Showing {startItem} to {endItem} of {total}
          </span>

          <div className="flex items-center gap-2">
            <span className={`text-xs sm:text-sm ${t.muted} whitespace-nowrap`}>
              Items per page:
            </span>

            <select
              value={currentLimit}
              onChange={(e) => safeLimitChange(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-sm font-medium outline-none cursor-pointer`}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => safePageChange(firstPage)}
            disabled={validCurrentPage === firstPage}
            className={`px-3 py-2 rounded-lg border ${t.border} ${t.text} text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            First
          </button>

          <button
            type="button"
            onClick={() => safePageChange(validCurrentPage - 1)}
            disabled={!hasPreviousPage}
            className={`px-3 py-2 rounded-lg border ${t.border} ${t.text} text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Previous
          </button>

          <div
            className={`px-3 sm:px-4 py-2 rounded-lg ${t.soft} ${t.text} text-xs sm:text-sm font-semibold whitespace-nowrap`}
          >
            Page {validCurrentPage} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() => safePageChange(validCurrentPage + 1)}
            disabled={!hasNextPage}
            className={`px-3 py-2 rounded-lg border ${t.border} ${t.text} text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Next
          </button>

          <button
            type="button"
            onClick={() => safePageChange(lastPage)}
            disabled={validCurrentPage === lastPage}
            className={`px-3 py-2 rounded-lg border ${t.border} ${t.text} text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawalsTable;