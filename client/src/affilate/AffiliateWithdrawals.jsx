import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import {
  fetchWithdrawalsList,
  fetchWithdrawalEarnings,
  requestWithdrawal,
  cancelWithdrawalRequest,
  setWithdrawalPage,
  setWithdrawalStatusFilter,
} from "../features/withdrawal/withdrawalSlice";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const AffiliateWithdrawals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const {
    withdrawals,
    earnings,
    pagination,
    statusFilter,
    loading,
    withdrawLoading,
  } = useSelector((state) => state.withdrawal);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [theme, setTheme] = useState(
    () => localStorage.getItem("dashboard-theme") || "day"
  );
  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  // Withdraw Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [paymentDetails, setPaymentDetails] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
    paypalEmail: "",
  });

  // Fetch 10 withdrawals when page or statusFilter changes (No loop!)
  useEffect(() => {
    dispatch(
      fetchWithdrawalsList({
        page: pagination.page,
        status: statusFilter,
      })
    );
  }, [dispatch, pagination.page, statusFilter]);

  // Fetch available balance once on mount
  useEffect(() => {
    dispatch(fetchWithdrawalEarnings());
  }, [dispatch]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amountNum = Number(parseFloat(amount));

    if (!Number.isFinite(amountNum) || amountNum < 100) {
      return toast.error("Minimum withdrawal is ₹100");
    }
    if (amountNum > 10000) {
      return toast.error("Maximum withdrawal is ₹10,000");
    }
    if (amountNum > earnings) {
      return toast.error("Insufficient balance");
    }

    if (paymentMethod === "paypal" && !paymentDetails.paypalEmail.trim()) {
      return toast.error("Please enter PayPal Email");
    }

    if (
      paymentMethod === "bank" &&
      (!paymentDetails.accountHolderName.trim() ||
        !paymentDetails.accountNumber.trim() ||
        !paymentDetails.ifsc.trim())
    ) {
      return toast.error("Please fill Account Holder Name, Account Number & IFSC");
    }

    if (paymentMethod === "upi" && !paymentDetails.upiId.trim()) {
      return toast.error("Please enter UPI ID");
    }

    const result = await dispatch(
      requestWithdrawal({
        amount: amountNum,
        paymentMethod,
        paymentDetails,
      })
    );

    if (requestWithdrawal.fulfilled.match(result)) {
      toast.success("Withdrawal request submitted!");
      setShowModal(false);
      setAmount("");
      setPaymentDetails({
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        ifsc: "",
        upiId: "",
      });
    } else {
      toast.error(result.payload || "Request failed");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this withdrawal request?")) return;
    const result = await dispatch(cancelWithdrawalRequest(id));
    if (cancelWithdrawalRequest.fulfilled.match(result)) {
      toast.success("Withdrawal cancelled");
    } else {
      toast.error(result.payload || "Cancel failed");
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={`min-h-screen ${t.page} pb-12`}>
      {!isAdmin && (
        <Navbar
          theme={theme}
          setTheme={setTheme}
          user={user}
          handleLogout={handleLogout}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Header + Available Balance */}
        <div
          className={`p-5 rounded-xl border ${t.card} ${t.border} flex flex-wrap items-center justify-between gap-4`}
        >
          <div>
            <button
              onClick={() => navigate("/affiliate")}
              className={`text-xs ${t.muted} hover:underline`}
            >
              ← Back
            </button>
            <h1 className={`text-xl font-bold mt-1 ${t.text}`}>Withdrawals</h1>
            <p className={`text-sm mt-1 ${t.muted}`}>
              Available Balance:{" "}
              <strong className={`text-lg ${t.text}`}>₹{earnings}</strong>
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            disabled={earnings < 100}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            + Withdraw Money
          </button>
        </div>

        {/* History Table Header + Status Filter */}
        <div className={`rounded-xl border ${t.card} ${t.border} overflow-hidden`}>
          <div
            className={`px-4 py-3 border-b ${t.border} flex items-center justify-between gap-3`}
          >
            <h2 className={`text-sm font-semibold ${t.text}`}>
              Withdrawal History ({pagination.total})
            </h2>

            <select
              value={statusFilter}
              onChange={(e) =>
                dispatch(setWithdrawalStatusFilter(e.target.value))
              }
              className={`px-3 py-1.5 rounded-lg border text-xs ${t.card} ${t.border} ${t.text}`}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <p className={`p-8 text-center text-sm ${t.muted}`}>Loading...</p>
          ) : withdrawals.length === 0 ? (
            <p className={`p-8 text-center text-sm ${t.muted}`}>
              No withdrawal history found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`border-b ${t.border} ${t.soft} text-xs`}>
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t.border}`}>
                  {withdrawals.map((item) => (
                    <tr key={item._id}>
                      <td className={`py-3 px-4 ${t.muted}`}>
                        {formatDate(item.createdAt)}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${t.text}`}>
                        ₹{item.amount}
                      </td>
                      <td className={`py-3 px-4 capitalize ${t.text}`}>
                        {item.paymentMethod}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${item.status === "completed" ||
                              item.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : item.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.status === "pending" ? (
                          <button
                            onClick={() => handleCancel(item._id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className={`text-xs ${t.muted}`}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Simple Pagination (10 per page) */}
          {pagination.pages > 1 && (
            <div
              className={`px-4 py-3 border-t ${t.border} flex items-center justify-between text-xs`}
            >
              <button
                onClick={() => dispatch(setWithdrawalPage(pagination.page - 1))}
                disabled={pagination.page <= 1}
                className={`px-3 py-1.5 rounded border ${t.border} ${t.text} disabled:opacity-40`}
              >
                ← Prev
              </button>

              <span className={t.muted}>
                Page {pagination.page} of {pagination.pages}
              </span>

              <button
                onClick={() => dispatch(setWithdrawalPage(pagination.page + 1))}
                disabled={pagination.page >= pagination.pages}
                className={`px-3 py-1.5 rounded border ${t.border} ${t.text} disabled:opacity-40`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`w-full max-w-md rounded-xl p-5 border ${t.card} ${t.border}`}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className={`text-base font-bold ${t.text}`}>
                Request Withdrawal
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={`text-sm ${t.muted}`}
              >
                ✕
              </button>
            </div>

            <p className={`text-xs mb-4 ${t.muted}`}>
              Available: <strong>₹{earnings}</strong> (Min ₹100 • Max ₹10,000)
            </p>

            <form onSubmit={handleWithdraw} className="space-y-3">
              <input
                type="number"
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
                required
              />

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
              >
                <option value="bank">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="paypal">PayPal</option>
              </select>

              {paymentMethod === "bank" && (
                <>
                  <input
                    type="text"
                    placeholder="Account Holder Name *"
                    value={paymentDetails.accountHolderName}
                    onChange={(e) =>
                      setPaymentDetails({
                        ...paymentDetails,
                        accountHolderName: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={paymentDetails.bankName}
                    onChange={(e) =>
                      setPaymentDetails({
                        ...paymentDetails,
                        bankName: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
                  />
                  <input
                    type="text"
                    placeholder="Account Number *"
                    value={paymentDetails.accountNumber}
                    onChange={(e) =>
                      setPaymentDetails({
                        ...paymentDetails,
                        accountNumber: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
                    required
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code *"
                    value={paymentDetails.ifsc}
                    onChange={(e) =>
                      setPaymentDetails({
                        ...paymentDetails,
                        ifsc: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
                    required
                  />
                </>
              )}

              {paymentMethod === "upi" && (
                <input
                  type="text"
                  placeholder="UPI ID (e.g. name@upi) *"
                  value={paymentDetails.upiId}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      upiId: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
                  required
                />
              )}

              {paymentMethod === "paypal" && (
                <input
                  type="email"
                  placeholder="PayPal Email *"
                  value={paymentDetails.paypalEmail}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      paypalEmail: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
                  required
                />
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 border rounded-lg text-sm ${t.border} ${t.text}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  {withdrawLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateWithdrawals;