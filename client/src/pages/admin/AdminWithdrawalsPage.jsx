// src/pages/admin/AdminWithdrawalsPage.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";

const STATUS_BADGES = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/withdrawals").catch((err) => {
        if (err.response?.status === 404) return { data: [] };
        throw err;
      });

      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.withdrawals || res.data?.data || [];

      setWithdrawals(list);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load withdrawals");
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (id, newStatus) => {
    if (!window.confirm(`Mark this withdrawal as ${newStatus}?`)) return;
    try {
      await api.patch(`/admin/withdrawals/${id}`, { status: newStatus });
      toast.success(`Withdrawal ${newStatus}`);
      setWithdrawals((prev) =>
        prev.map((w) => (w._id === id ? { ...w, status: newStatus } : w))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const safeList = Array.isArray(withdrawals) ? withdrawals : [];

  const filtered = safeList.filter((w) => {
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      w.businessId?.businessName?.toLowerCase().includes(q) ||
      w.userId?.name?.toLowerCase().includes(q) ||
      w.upiId?.toLowerCase().includes(q) ||
      w.accountNumber?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-xl font-bold text-primary">
            ← Admin Panel
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-600">
            Withdrawals & Payouts
          </span>
        </div>
        <button
          onClick={fetchWithdrawals}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-700"
        >
          ↻ Refresh
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Withdrawal Requests
            </h1>
            <p className="text-sm text-gray-500">
              Total {safeList.length} payout requests
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search clinic, owner, UPI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary outline-none flex-1 md:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading withdrawals...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Abhi koi withdrawal request nahi hai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
                    <th className="py-3.5 px-4">Clinic / User</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payout Details</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filtered.map((w) => (
                    <tr key={w._id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-800">
                          {w.businessId?.businessName || w.userId?.name || "—"}
                        </p>
                        {w.userId?.email && (
                          <p className="text-xs text-gray-500">
                            {w.userId.email}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        ₹{w.amount ?? 0}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {w.upiId ? (
                          <span>UPI: {w.upiId}</span>
                        ) : w.accountNumber ? (
                          <span>
                            A/C: {w.accountNumber} ({w.ifsc || ""})
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {w.createdAt
                          ? new Date(w.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${
                            STATUS_BADGES[w.status] ||
                            "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {w.status || "pending"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {w.status === "pending" && (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleAction(w._id, "approved")}
                              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(w._id, "rejected")}
                              className="text-xs text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawalsPage;