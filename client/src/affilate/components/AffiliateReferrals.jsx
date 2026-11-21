import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaUsers,
  FaHistory,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaFilter,
  FaSpinner,
} from "react-icons/fa";
import {
  fetchPaginatedAffiliateList,
  setListItems,
  setListStatusFilter,
  DEFAULT_LIST_PAGINATION,
} from "../../features/affiliate/affiliateSlice";
import { themes } from "../../constants/themes";

const ALLOWED_LIMITS = [5, 10, 20, 50, 100, 200];
const EMPTY_ARRAY = [];

const AffiliateReferrals = ({
  title,
  items: initialItems = EMPTY_ARRAY,
  type = "referral",
  onClose,
  fetchUrl = null,
  availableStatuses = [],
  theme: propTheme,
}) => {
  const dispatch = useDispatch();

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

  const isReferral = type === "referral";
  const isServerPaginated = Boolean(fetchUrl);
  const listKey = isReferral ? "referral" : "withdrawal";

  const bucket = useSelector(
    (state) => state.affiliate?.listData?.[listKey]
  ) || {
    items: EMPTY_ARRAY,
    pagination: DEFAULT_LIST_PAGINATION,
    statusFilter: "",
    loading: false,
  };

  const items = isServerPaginated
    ? bucket.items
    : Array.isArray(initialItems)
    ? initialItems
    : EMPTY_ARRAY;
  const pagination = bucket.pagination;
  const statusFilter = bucket.statusFilter;
  const loading = bucket.loading;

  const [showFilters, setShowFilters] = useState(false);
  const prevInitialRef = useRef(initialItems);

  useEffect(() => {
    if (isServerPaginated) return;

    const nextItems = Array.isArray(initialItems) ? initialItems : EMPTY_ARRAY;
    const prevItems = Array.isArray(prevInitialRef.current)
      ? prevInitialRef.current
      : EMPTY_ARRAY;

    const isSameEmpty = nextItems.length === 0 && prevItems.length === 0;
    const isSameRef = prevInitialRef.current === initialItems;

    if (!isSameRef && !isSameEmpty) {
      dispatch(setListItems({ type: listKey, items: nextItems }));
    }

    prevInitialRef.current = initialItems;
  }, [initialItems, isServerPaginated, dispatch, listKey]);

  const fetchData = useCallback(
    (page = 1, limit = 5, status = "") => {
      if (!fetchUrl) return;
      dispatch(
        fetchPaginatedAffiliateList({
          fetchUrl,
          type: listKey,
          page,
          limit,
          status,
        })
      );
    },
    [dispatch, fetchUrl, listKey]
  );

  useEffect(() => {
    if (isServerPaginated) {
      fetchData(1, 5, "");
    }
  }, [isServerPaginated, fetchData]);

  const formatAmount = (amount) => {
    const value = Number(amount ?? 0);
    return Number.isFinite(value) ? value.toFixed(2) : "0.00";
  };

  const formatDate = (date) => {
    if (!date) return "—";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      subscribed: {
        label: "Subscribed",
        className: "bg-green-500/15 text-green-500",
      },
      registered: {
        label: "Registered",
        className: "bg-blue-500/15 text-blue-500",
      },
      pending: {
        label: "Pending",
        className: "bg-yellow-500/15 text-yellow-500",
      },
      approved: {
        label: "Approved",
        className: "bg-blue-500/15 text-blue-500",
      },
      completed: {
        label: "Completed",
        className: "bg-green-500/15 text-green-500",
      },
      failed: {
        label: "Failed",
        className: "bg-red-500/15 text-red-500",
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-gray-500/15 text-gray-500",
      },
      rejected: {
        label: "Rejected",
        className: "bg-red-500/15 text-red-500",
      },
      processing: {
        label: "Processing",
        className: "bg-purple-500/15 text-purple-500",
      },
    };

    const current = config[status] || config.pending;

    return (
      <span
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-semibold ${current.className}`}
      >
        {current.label}
      </span>
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-500",
      approved: "text-blue-500",
      processing: "text-purple-500",
      completed: "text-green-500",
      failed: "text-red-500",
      cancelled: "text-gray-500",
      rejected: "text-red-500",
    };

    return colors[status] || t.muted;
  };

  const handlePageChange = (page) => {
    const newPage = Number(page);
    if (
      !Number.isInteger(newPage) ||
      newPage < 1 ||
      newPage > pagination.pages ||
      newPage === pagination.page
    ) {
      return;
    }

    fetchData(newPage, pagination.limit, statusFilter);
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    if (!ALLOWED_LIMITS.includes(newLimit)) return;
    fetchData(1, newLimit, statusFilter);
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    dispatch(setListStatusFilter({ type: listKey, status: newStatus }));
    fetchData(1, pagination.limit, newStatus);
  };

  const getPageNumbers = () => {
    const total = pagination.pages;
    const current = pagination.page;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }

    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  const startItem =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;

  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  const statusOptions =
    availableStatuses.length > 0
      ? availableStatuses
      : [
          { value: "", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "processing", label: "Processing" },
          { value: "completed", label: "Completed" },
          { value: "failed", label: "Failed" },
          { value: "cancelled", label: "Cancelled" },
          { value: "rejected", label: "Rejected" },
        ];

  const baseBtn =
    "flex items-center justify-center transition-all duration-200 rounded-lg";

  return (
    <div
      className={`w-full min-w-0 ${t.card} rounded-xl sm:rounded-2xl border ${t.border} overflow-hidden transition-colors duration-200`}
    >
      {/* HEADER */}
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4 min-w-0 border-b ${t.border}`}
      >
        <h3
          className={`flex items-center gap-2 min-w-0 flex-1 ${t.text} text-sm sm:text-base font-bold`}
        >
          {isReferral ? (
            <FaUsers className={`${t.accentText} shrink-0`} />
          ) : (
            <FaHistory className={`${t.accentText} shrink-0`} />
          )}

          <span className="truncate">{title}</span>

          {pagination.total > 0 && (
            <span className={`hidden sm:inline-flex text-xs font-normal ${t.muted}`}>
              ({pagination.total})
            </span>
          )}
        </h3>

        <div className="flex items-center gap-2 shrink-0">
          {isServerPaginated && (
            <button
              type="button"
              onClick={() => setShowFilters((p) => !p)}
              className={`${baseBtn} w-8 h-8 ${t.text} ${t.hover}`}
              title="Filters"
              aria-label="Toggle filters"
            >
              <FaFilter className="text-xs" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`${baseBtn} w-8 h-8 ${t.text} ${t.hover}`}
            >
              <FaTimes className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* FILTERS PANEL */}
      {isServerPaginated && showFilters && (
        <div
          className={`px-4 py-3 sm:px-5 border-b ${t.border} ${t.soft} flex flex-wrap items-center gap-3 text-xs sm:text-sm`}
        >
          <label className={`flex items-center gap-2 ${t.text}`}>
            <span className={t.muted}>Status:</span>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className={`px-2.5 py-1.5 rounded-lg border ${t.border} ${t.card} ${t.text} text-xs sm:text-sm outline-none cursor-pointer`}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {statusFilter && (
            <button
              type="button"
              onClick={() => {
                dispatch(setListStatusFilter({ type: listKey, status: "" }));
                fetchData(1, pagination.limit, "");
              }}
              className={`text-xs font-semibold ${t.accentText} hover:underline`}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="px-4 py-12 text-center">
          <FaSpinner
            className={`animate-spin text-2xl mx-auto mb-2 ${t.accentText}`}
          />
          <p className={`text-sm ${t.muted}`}>Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-8 sm:px-5 sm:py-10">
          <p className={`text-center text-sm ${t.muted}`}>
            No {isReferral ? "referrals" : "withdrawals"}
            {statusFilter ? ` with status "${statusFilter}"` : ""} yet
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[360px] sm:max-h-[420px] lg:max-h-[500px] overflow-y-auto overflow-x-hidden overscroll-contain">
            <div className="px-4 sm:px-5">
              {items.map((item, index) => {
                const name = item.referredUser?.name || "Anonymous User";
                const amount = formatAmount(item.amount);
                const commission = Number(item.commission ?? 0);

                return (
                  <div
                    key={item._id || `${item.createdAt}-${index}`}
                    className={`w-full min-w-0 py-3.5 sm:py-4 border-b ${t.border} last:border-b-0`}
                  >
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`${t.text} text-sm font-medium truncate`}
                          title={isReferral ? name : `₹${amount}`}
                        >
                          {isReferral ? name : `₹${amount}`}
                        </p>
                        <p className={`mt-0.5 text-[11px] sm:text-xs ${t.muted}`}>
                          {formatDate(item.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 min-w-0">
                        {isReferral ? (
                          <>
                            {getStatusBadge(item.status)}
                            {commission > 0 && (
                              <span className="whitespace-nowrap text-xs sm:text-sm font-bold text-green-500">
                                +₹{formatAmount(commission)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span
                            className={`whitespace-nowrap text-[10px] sm:text-xs font-bold ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {String(item.status || "pending").toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isServerPaginated && pagination.total > 0 && (
            <div
              className={`px-4 sm:px-5 py-3 border-t ${t.border} flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3`}
            >
              <div
                className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm ${t.muted}`}
              >
                <span>
                  Showing <strong className={t.text}>{startItem}</strong> to{" "}
                  <strong className={t.text}>{endItem}</strong> of{" "}
                  <strong className={t.text}>{pagination.total}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <span>Per page:</span>
                  <select
                    value={pagination.limit}
                    onChange={handleLimitChange}
                    className={`px-2 py-1 rounded-lg border ${t.border} ${t.card} ${t.text} text-xs sm:text-sm outline-none cursor-pointer`}
                  >
                    {ALLOWED_LIMITS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => handlePageChange(1)}
                  className={`${baseBtn} w-8 h-8 border ${t.border} ${t.text} ${
                    !pagination.hasPreviousPage
                      ? "opacity-30 cursor-not-allowed"
                      : `${t.hover} hover:scale-105`
                  }`}
                  title="First page"
                  aria-label="First page"
                >
                  <FaAngleDoubleLeft className="text-xs" />
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className={`${baseBtn} w-8 h-8 border ${t.border} ${t.text} ${
                    !pagination.hasPreviousPage
                      ? "opacity-30 cursor-not-allowed"
                      : `${t.hover} hover:scale-105`
                  }`}
                  title="Previous"
                  aria-label="Previous page"
                >
                  <FaChevronLeft className="text-xs" />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) => {
                    if (page === "...") {
                      return (
                        <span
                          key={`dots-${idx}`}
                          className={`w-8 h-8 flex items-center justify-center text-xs ${t.muted}`}
                        >
                          ...
                        </span>
                      );
                    }

                    const active = page === pagination.page;

                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={`${baseBtn} w-8 h-8 text-xs font-bold ${
                          active
                            ? `${t.accent} text-white shadow-sm`
                            : `${t.text} ${t.hover}`
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className={`${baseBtn} w-8 h-8 border ${t.border} ${t.text} ${
                    !pagination.hasNextPage
                      ? "opacity-30 cursor-not-allowed"
                      : `${t.hover} hover:scale-105`
                  }`}
                  title="Next"
                  aria-label="Next page"
                >
                  <FaChevronRight className="text-xs" />
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => handlePageChange(pagination.pages)}
                  className={`${baseBtn} w-8 h-8 border ${t.border} ${t.text} ${
                    !pagination.hasNextPage
                      ? "opacity-30 cursor-not-allowed"
                      : `${t.hover} hover:scale-105`
                  }`}
                  title="Last page"
                  aria-label="Last page"
                >
                  <FaAngleDoubleRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AffiliateReferrals;