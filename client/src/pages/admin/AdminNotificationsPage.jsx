// src/pages/admin/AdminNotificationsPage.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", message: "" });
  const [sending, setSending] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/notifications").catch((err) => {
        if (err.response?.status === 404) return { data: [] };
        throw err;
      });
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.notifications || res.data?.data || [];
      setNotifications(list);
    } catch (err) {
      toast.error("Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      return toast.error("Title aur message dono required hain");
    }
    setSending(true);
    try {
      await api.post("/admin/notifications", form);
      toast.success("Notification sent!");
      setForm({ title: "", message: "" });
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center mb-6">
        <Link to="/admin" className="text-xl font-bold text-primary">
          ← Admin Panel
        </Link>
        <span className="text-sm font-semibold text-gray-600">
          Notifications
        </span>
      </nav>

      <div className="max-w-4xl mx-auto px-6">
        {/* Send Notification Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Send Announcement / Notification
          </h2>
          <form onSubmit={handleSend} className="space-y-3">
            <input
              type="text"
              placeholder="Notification Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
              required
            />
            <textarea
              placeholder="Write your message here... *"
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </form>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800">
              Recent Notifications ({notifications.length})
            </h3>
          </div>

          {loading ? (
            <p className="p-8 text-center text-gray-500">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="p-10 text-center text-gray-500">
              Abhi koi notification nahi hai.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n, idx) => (
                <div key={n._id || idx} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-gray-800">{n.title}</h4>
                    {n.createdAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;