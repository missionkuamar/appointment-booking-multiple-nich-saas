import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import {
  fetchWithdrawals,
  approveWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  clearWithdrawalError,
  resetWithdrawalState,
} from "../features/adminwithdrawal/withdrawal";
import AdminNavbar from "../components/AdminNavbar";
import { themes } from "../constants/themes";

// Import components
import AdminWithdrawalsHeader from "./components/AdminWithdrawalsHeader";
import AdminWithdrawalsStats from "./components/AdminWithdrawalsStats";
import AdminWithdrawalsFilters from "./components/AdminWithdrawalsFilters";
import AdminWithdrawalsTable from "./components/AdminWithdrawalsTable";
import AdminWithdrawalDetailModal from "./components/AdminWithdrawalDetailModal";

const AdminWithdrawals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    withdrawals = [],
    stats,
    pagination = {},
    loading,
    processing,
    error,
    totalWithdrawals,
  } = useSelector((state) => state.withdrawals || {});

  const { user } = useSelector((state) => state.auth || {});
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  const [filters, setFilters] = useState({ status: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const pageLimit = pagination?.limit || 10;

  const fetchWithdrawalsData = useCallback(async () => {
    const params = {
      status: filters.status || "",
      page: currentPage,
      limit: pageLimit,
      search: searchTerm.trim(),
    };

    Object.keys(params).forEach((key) => {
      if (!params[key] || params[key] === "") delete params[key];
    });

    await dispatch(fetchWithdrawals(params));
  }, [dispatch, filters.status, currentPage, pageLimit, searchTerm]);

  useEffect(() => {
    fetchWithdrawalsData();
  }, [fetchWithdrawalsData]);

  useEffect(() => {
    const interval = setInterval(fetchWithdrawalsData, 30000);
    return () => clearInterval(interval);
  }, [fetchWithdrawalsData]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearWithdrawalError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => dispatch(resetWithdrawalState());
  }, [dispatch]);

  const handleApprove = async (id) => {
    try {
      await dispatch(
        approveWithdrawal({
          id,
          notes: `Approved by ${user?.name || "Admin"}`,
        })
      ).unwrap();
      toast.success("✅ Withdrawal approved!");
      await fetchWithdrawalsData();
    } catch (err) {
      toast.error(err || "Failed to approve");
    }
  };

  const handleComplete = async (id) => {
    const transactionId = prompt("Enter Bank Transaction ID:");
    if (!transactionId) return;

    try {
      await dispatch(
        completeWithdrawal({
          id,
          transactionId,
          notes: "Payment sent successfully",
        })
      ).unwrap();
      toast.success("🎉 Withdrawal completed!");
      await fetchWithdrawalsData();
    } catch (err) {
      toast.error(err || "Failed to complete");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;

    try {
      await dispatch(
        rejectWithdrawal({
          id,
          notes: reason,
        })
      ).unwrap();
      toast.success("❌ Withdrawal rejected");
      await fetchWithdrawalsData();
    } catch (err) {
      toast.error(err || "Failed to reject");
    }
  };

  const handleStatusChange = (status) => {
    setFilters((prev) => ({ ...prev, status }));
    setCurrentPage(1);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ status: "" });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowModal(true);
  };

  const handleRefresh = () => {
    fetchWithdrawalsData();
    toast.success("Refreshed!");
  };

  const effectivePagination = {
    ...pagination,
    page: pagination?.page || currentPage,
    limit: pageLimit,
  };

   if (loading && withdrawals.length === 0) {
    return (
      <div className={`min-h-screen ${t.page} transition-colors duration-300`}>
        {/* 🔴 Conditional AdminNavbar */}
        {!isAdmin && (
          <AdminNavbar
            theme={theme}
            setTheme={setTheme}
            user={user}
            handleLogout={handleLogout}
          />
        )}
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <FaSpinner className={`animate-spin text-4xl ${t.accentText} mx-auto mb-4`} />
            <p className={t.text}>Loading withdrawals...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className={`min-h-screen ${t.page} transition-colors duration-300`}>
      {/* 🔴 Conditional AdminNavbar */}
      {!isAdmin && (
        <AdminNavbar
          theme={theme}
          setTheme={setTheme}
          user={user}
          handleLogout={handleLogout}
        />
      )}

      <div className={`max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6 ${isAdmin ? "pt-6" : ""}`}>
        <AdminWithdrawalsHeader
          onRefresh={handleRefresh}
          loading={loading}
          totalWithdrawals={totalWithdrawals}
          theme={t}
        />

        <AdminWithdrawalsStats
          withdrawals={withdrawals}
          stats={stats}
          theme={t}
        />

        <AdminWithdrawalsFilters
          filters={filters}
          searchTerm={searchTerm}
          onStatusChange={handleStatusChange}
          onSearch={handleSearch}
          onClearFilters={handleClearFilters}
          theme={t}
        />

        <AdminWithdrawalsTable
          withdrawals={withdrawals}
          pagination={effectivePagination}
          onPageChange={handlePageChange}
          onApprove={handleApprove}
          onComplete={handleComplete}
          onReject={handleReject}
          onViewDetails={handleViewDetails}
          processing={processing}
          theme={t}
        />
      </div>

      <AdminWithdrawalDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        withdrawal={selectedWithdrawal}
        theme={t}
      />
    </div>
  );
};

export default AdminWithdrawals;