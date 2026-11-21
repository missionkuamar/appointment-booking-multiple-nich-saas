import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchAdminSubscriptions,
  fetchSubscriptionStats,
  updateSubscriptionStatusById,
} from "../../features/admin/adminSlice";
import { FaSearch, FaMoneyBillWave, FaUsers, FaCheckCircle } from "react-icons/fa";

const DEFAULT_THEME = {
  text: "text-gray-800",
  muted: "text-gray-500",
  card: "bg-white",
  soft: "bg-gray-50",
  border: "border-gray-200",
};

const statusColors = {
  active: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-200 text-gray-700",
  past_due: "bg-yellow-100 text-yellow-700",
};

export default function AdminSubscriptionsPage({ t }) {
  const theme = { ...DEFAULT_THEME, ...(t || {}) };
  const dispatch = useDispatch();

  const { 
    subscriptions, 
    subscriptionPagination, 
    subscriptionStats, 
    subscriptionLoading 
  } = useSelector((s) => s.admin);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchSubscriptionStats());
  }, [dispatch]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      dispatch(fetchAdminSubscriptions({ 
        search, 
        plan: planFilter, 
        status: statusFilter, 
        page, 
        limit: 10 
      }));
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [dispatch, search, planFilter, statusFilter, page]);

  const handleStatusChange = async (id, newStatus) => {
    const res = await dispatch(updateSubscriptionStatusById({ id, status: newStatus }));
    if (updateSubscriptionStatusById.fulfilled.match(res)) {
      toast.success("Status updated");
      dispatch(fetchSubscriptionStats()); // Update revenue
    } else {
      toast.error(res.payload);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${theme.text}`}>Subscriptions</h1>
        <p className={`text-sm ${theme.muted}`}>Manage all platform subscriptions and revenue</p>
      </div>

      {/* Stats Cards */}
      {subscriptionStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-5 rounded-2xl border ${theme.card} ${theme.border} flex items-center gap-4 shadow-sm`}>
            <div className="p-3 rounded-xl bg-green-100 text-green-600 text-xl"><FaMoneyBillWave /></div>
            <div>
              <p className={`text-xs font-medium ${theme.muted}`}>Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{subscriptionStats.monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
          <div className={`p-5 rounded-2xl border ${theme.card} ${theme.border} flex items-center gap-4 shadow-sm`}>
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600 text-xl"><FaCheckCircle /></div>
            <div>
              <p className={`text-xs font-medium ${theme.muted}`}>Active Subscriptions</p>
              <p className="text-2xl font-bold text-blue-600">{subscriptionStats.activeSubscriptions}</p>
            </div>
          </div>
          <div className={`p-5 rounded-2xl border ${theme.card} ${theme.border} flex items-center gap-4 shadow-sm`}>
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600 text-xl"><FaUsers /></div>
            <div>
              <p className={`text-xs font-medium ${theme.muted}`}>Total Subscriptions</p>
              <p className="text-2xl font-bold text-purple-600">{subscriptionStats.totalSubscriptions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 w-full">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.muted}`} />
          <input
            type="text"
            placeholder="Search by clinic name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.border} ${theme.card} ${theme.text} outline-none focus:ring-2 focus:ring-primary text-sm`}
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className={`px-4 py-2.5 rounded-xl border ${theme.border} ${theme.card} ${theme.text} outline-none text-sm font-medium`}
        >
          <option value="all">All Plans</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className={`px-4 py-2.5 rounded-xl border ${theme.border} ${theme.card} ${theme.text} outline-none text-sm font-medium`}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border ${theme.card} ${theme.border} overflow-hidden shadow-sm`}>
        {subscriptionLoading ? (
          <div className="p-10 text-center"><p className={theme.muted}>Loading subscriptions...</p></div>
        ) : subscriptions.length === 0 ? (
          <div className="p-10 text-center"><p className={theme.muted}>No subscriptions found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${theme.soft} border-b ${theme.border} text-xs font-bold uppercase ${theme.muted}`}>
                  <th className="p-4">Clinic / Owner</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className={`font-bold ${theme.text}`}>{sub.businessId?.businessName || "N/A"}</p>
                      <p className={`text-xs ${theme.muted}`}>{sub.userId?.email || "-"}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-bold text-xs uppercase">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      ₹{sub.price?.toLocaleString() || 0}
                    </td>
                    <td className="p-4">
                      <p className={`text-xs ${theme.text}`}>Start: {new Date(sub.startDate).toLocaleDateString()}</p>
                      {sub.endDate && <p className={`text-xs ${theme.muted}`}>End: {new Date(sub.endDate).toLocaleDateString()}</p>}
                    </td>
                    <td className="p-4">
                      <select
                        value={sub.status}
                        onChange={(e) => handleStatusChange(sub._id, e.target.value)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg outline-none border-none cursor-pointer ${statusColors[sub.status] || "bg-gray-100"}`}
                      >
                        <option value="active">ACTIVE</option>
                        <option value="cancelled">CANCELLED</option>
                        <option value="expired">EXPIRED</option>
                        <option value="past_due">PAST DUE</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {subscriptionPagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 border rounded-2xl">
          <span className="text-sm text-gray-500">
            Page {subscriptionPagination.page} of {subscriptionPagination.totalPages} ({subscriptionPagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg bg-white text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(subscriptionPagination.totalPages, p + 1))}
              disabled={page === subscriptionPagination.totalPages}
              className="px-4 py-2 border rounded-lg bg-white text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}