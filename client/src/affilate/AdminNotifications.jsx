import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaSpinner,
  FaWallet,
  FaGift,
  FaSyncAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";
import { themes } from "../constants/themes";

const ALLOWED_LIMITS = [5, 10, 20, 50, 100];

const AdminNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [readFilter, setReadFilter] = useState("all"); // "all" | "unread" | "read"
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const isFetchingRef = useRef(false);

  const [theme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: pageLimit,
      };
      if (readFilter === "unread") params.isRead = "false";
      if (readFilter === "read") params.isRead = "true";

      const response = await api.get("/notifications", { params });
      const root = response.data?.data || {};
      const pag = root.pagination || {};

      setNotifications(Array.isArray(root.notifications) ? root.notifications : []);
      setUnreadCount(Number(root.unreadCount) || 0);
      setPaginationMeta({
        total: Number(pag.total) || 0,
        pages: Math.max(1, Number(pag.pages) || 1),
        hasNext: Boolean(pag.hasNext),
        hasPrev: Boolean(pag.hasPrev),
      });

      // Sync page if backend clamped out-of-range page (e.g., after delete)
      if (Number(pag.page) > 0 && Number(pag.page) !== currentPage) {
        setCurrentPage(Number(pag.page));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [currentPage, pageLimit, readFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      toast.success("Notification deleted");
      fetchNotifications();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handlePageChange = (nextPage) => {
    const num = Number(nextPage);
    if (!Number.isInteger(num) || num < 1 || num > paginationMeta.pages || num === currentPage) {
      return;
    }
    setCurrentPage(num);
  };

  const handleLimitChange = (newLimit) => {
    const num = Number(newLimit);
    if (!ALLOWED_LIMITS.includes(num) || num === pageLimit) return;
    setPageLimit(num);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter) => {
    if (filter === readFilter) return;
    setReadFilter(filter);
    setCurrentPage(1);
  };

  const getIcon = (type) => {
    switch (type) {
      case "withdrawal_request":
        return <FaWallet className="text-yellow-500" />;
      case "withdrawal_approved":
        return <FaCheck className="text-blue-500" />;
      case "withdrawal_completed":
        return <FaWallet className="text-green-500" />;
      case "withdrawal_rejected":
        return <FaWallet className="text-red-500" />;
      case "affiliate_commission":
        return <FaGift className="text-purple-500" />;
      default:
        return <FaBell className={t.muted} />;
    }
  };

  const totalItems = paginationMeta.total;
  const totalPages = paginationMeta.pages;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageLimit + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * pageLimit, totalItems);

  if (loading && notifications.length === 0) {
    return (
      <div className={`flex justify-center items-center h-64 ${t.page}`}>
        <FaSpinner className={`animate-spin ${t.accentText} text-4xl`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.page} p-4 md:p-6 transition-colors duration-300`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div
          className={`flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-2xl border ${t.card} ${t.border} p-4 md:p-6`}
        >
          <div>
            <h1 className={`text-2xl font-bold ${t.text} flex items-center gap-2`}>
              <FaBell className="text-yellow-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className={`text-sm ${t.muted} mt-1`}>Manage all your notifications</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              className={`px-3 py-2 rounded-lg border ${t.border} ${t.text} text-sm font-medium flex items-center gap-2 hover:opacity-80 transition disabled:opacity-50`}
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className={`${t.accent} text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition`}
              >
                <FaCheck /> Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {[
            { key: "all", label: "All" },
            { key: "unread", label: `Unread (${unreadCount})` },
            { key: "read", label: "Read" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleFilterChange(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                readFilter === tab.key
                  ? `${t.accent} text-white border-transparent`
                  : `${t.card} ${t.border} ${t.text}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className={`${t.card} rounded-2xl border ${t.border} shadow overflow-hidden`}>
          {notifications.length === 0 ? (
            <div className={`text-center py-12 ${t.text}`}>
              <FaBell className={`text-6xl ${t.muted} opacity-40 mx-auto mb-4`} />
              <p className="text-lg font-medium">No notifications</p>
              <p className={`text-sm ${t.muted} mt-1`}>
                When you have notifications, they will appear here
              </p>
            </div>
          ) : (
            <div className={`divide-y ${t.border}`}>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 ${t.hover} transition-colors ${!n.isRead ? t.soft : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-xl">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h4 className={`font-semibold ${!n.isRead ? t.accentText : t.text}`}>
                            {n.title}
                          </h4>
                          <p className={`text-sm ${t.muted} mt-1`}>{n.message}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!n.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(n._id)}
                              className={`text-xs ${t.accentText} hover:underline`}
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(n._id)}
                            className={`${t.muted} hover:text-red-500 transition-colors`}
                            title="Delete"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className={`text-xs ${t.muted}`}>
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                        {n.priority === "high" && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            🔴 High Priority
                          </span>
                        )}
                        {!n.isRead && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>

                      {n.data && Object.keys(n.data).length > 0 && (
                        <div className={`mt-2 text-xs ${t.muted}`}>
                          <pre
                            className={`${t.soft} ${t.text} border ${t.border} p-2 rounded overflow-x-auto`}
                          >
                            {JSON.stringify(n.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          {totalItems > 0 && (
            <div
              className={`px-4 md:px-6 py-4 border-t ${t.border} flex flex-col lg:flex-row items-center justify-between gap-4`}
            >
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <span className={`text-xs sm:text-sm ${t.muted}`}>
                  Showing {startItem} to {endItem} of {totalItems}
                </span>

                <div className="flex items-center gap-2">
                  <span className={`text-xs sm:text-sm ${t.muted} whitespace-nowrap`}>
                    Items per page:
                  </span>
                  <select
                    value={pageLimit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border ${t.border} ${t.soft} ${t.text} text-sm font-medium outline-none cursor-pointer`}
                  >
                    {ALLOWED_LIMITS.map((lim) => (
                      <option key={lim} value={lim}>
                        {lim}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                  className={`px-3 py-1.5 rounded-lg border ${t.border} ${t.text} text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  First
                </button>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className={`px-3 py-1.5 rounded-lg border ${t.border} ${t.text} text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Previous
                </button>

                <span
                  className={`px-3 py-1.5 rounded-lg ${t.soft} ${t.accentText} text-xs sm:text-sm font-semibold`}
                >
                  Page {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className={`px-3 py-1.5 rounded-lg border ${t.border} ${t.text} text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Next
                </button>

                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || loading}
                  className={`px-3 py-1.5 rounded-lg border ${t.border} ${t.text} text-xs sm:text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;