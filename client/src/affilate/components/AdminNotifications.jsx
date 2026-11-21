import { useState, useEffect, useCallback } from 'react';
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaSpinner,
  FaWallet,
  FaGift,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { themes } from '../../constants/themes';

const AdminNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const [theme] = useState(() => {
    return localStorage.getItem('dashboard-theme') || 'day';
  });

  const t = themes[theme] || themes.day;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications', {
        params: { page: pagination.page, limit: pagination.limit },
      });
      setNotifications(response.data.data.notifications || []);
      setUnreadCount(response.data.data.unreadCount || 0);
      setPagination(
        response.data.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        }
      );
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Notification deleted');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'withdrawal_request':
        return <FaWallet className="text-yellow-500" />;
      case 'withdrawal_approved':
        return <FaCheck className="text-blue-500" />;
      case 'withdrawal_completed':
        return <FaWallet className="text-green-500" />;
      case 'withdrawal_rejected':
        return <FaWallet className="text-red-500" />;
      case 'affiliate_commission':
        return <FaGift className="text-purple-500" />;
      default:
        return <FaBell className={t.muted} />;
    }
  };

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
        <div className={`flex justify-between items-center rounded-2xl border ${t.card} ${t.border} p-4 md:p-6`}>
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
                  className={`p-4 ${t.hover} transition-colors ${!n.isRead ? t.soft : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-xl">{getIcon(n.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-semibold ${!n.isRead ? t.accentText : t.text}`}>
                            {n.title}
                          </h4>
                          <p className={`text-sm ${t.muted} mt-1`}>{n.message}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
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
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-xs ${t.muted}`}>
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                        {n.priority === 'high' && (
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
                      {n.data && (
                        <div className={`mt-2 text-xs ${t.muted}`}>
                          <pre className={`${t.soft} ${t.text} border ${t.border} p-2 rounded overflow-x-auto`}>
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className={`px-4 py-3 border-t ${t.border} flex justify-between items-center`}>
              <span className={`text-sm ${t.muted}`}>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded border ${t.border} ${t.text} disabled:opacity-50`}
                >
                  Previous
                </button>
                <span className={`px-3 py-1 ${t.soft} ${t.accentText} rounded text-sm font-semibold`}>
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  type="button"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-1 rounded border ${t.border} ${t.text} disabled:opacity-50`}
                >
                  Next
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