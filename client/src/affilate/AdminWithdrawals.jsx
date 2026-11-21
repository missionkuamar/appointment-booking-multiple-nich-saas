import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

import AdminWithdrawalsHeader from "./components/AdminWithdrawalsHeader";
import AdminWithdrawalsStats from "./components/AdminWithdrawalsStats";
import AdminWithdrawalsFilters from "./components/AdminWithdrawalsFilters";
import AdminWithdrawalsTable from "./components/AdminWithdrawalsTable";
import AdminWithdrawalDetailModal from "./components/AdminWithdrawalDetailModal";

const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];
const ALLOWED_LIMITS = [5, 10, 20, 50, 100, 200];

const AdminWithdrawals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Direct selectors (prevents unnecessary Redux re-render warnings)
  const reduxWithdrawals = useSelector(
    (state) => state.withdrawals?.withdrawals
  );
  const reduxStats = useSelector((state) => state.withdrawals?.stats);
  const reduxPagination = useSelector(
    (state) => state.withdrawals?.pagination
  );
  const loading = Boolean(
    useSelector((state) => state.withdrawals?.loading)
  );
  const processing = Boolean(
    useSelector((state) => state.withdrawals?.processing)
  );
  const error = useSelector((state) => state.withdrawals?.error);
  const reduxTotal = useSelector(
    (state) => state.withdrawals?.totalWithdrawals
  );
  const user = useSelector((state) => state.auth?.user);

  const [localData, setLocalData] = useState({
    withdrawals: EMPTY_ARRAY,
    stats: null,
    pagination: EMPTY_OBJECT,
    total: 0,
  });

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [theme, setTheme] = useState(
    () => localStorage.getItem("dashboard-theme") || "day"
  );
  const t = themes[theme] || themes.day;

  const [filters, setFilters] = useState({ status: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchingRef = useRef(false);

  const withdrawals = Array.isArray(reduxWithdrawals)
    ? reduxWithdrawals
    : localData.withdrawals;

  const stats = reduxStats || localData.stats;
  const pagination =
    reduxPagination && Object.keys(reduxPagination).length > 0
      ? reduxPagination
      : localData.pagination;
  const totalWithdrawals =
    reduxTotal ?? pagination?.total ?? localData.total ?? withdrawals.length;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const fetchWithdrawalsData = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const params = {
        page: currentPage,
        limit: pageLimit,
      };
      if (filters.status) params.status = filters.status;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const result = await dispatch(fetchWithdrawals(params));

      if (fetchWithdrawals.fulfilled.match(result)) {
        const root = result.payload?.data || result.payload || {};
        const list = Array.isArray(root)
          ? root
          : root.withdrawals || root.data || EMPTY_ARRAY;

        setLocalData({
          withdrawals: list,
          stats: root.stats || null,
          pagination: root.pagination || EMPTY_OBJECT,
          total: root.pagination?.total ?? list.length,
        });
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [dispatch, filters.status, currentPage, pageLimit, searchTerm]);

  useEffect(() => {
    fetchWithdrawalsData();
  }, [fetchWithdrawalsData]);

  // Auto-refresh only when browser tab is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchWithdrawalsData();
      }
    }, 1000000);
    return () => clearInterval(interval);
  }, [fetchWithdrawalsData]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearWithdrawalError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetWithdrawalState());
    };
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

  const handlePageChange = useCallback(
    (page) => {
      const nextPage = Number(page);
      if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage === currentPage) {
        return;
      }
      setCurrentPage(nextPage);
    },
    [currentPage]
  );

  const handleLimitChange = useCallback(
    (limit) => {
      const nextLimit = Number(limit);
      if (!ALLOWED_LIMITS.includes(nextLimit) || nextLimit === pageLimit) {
        return;
      }
      setPageLimit(nextLimit);
      setCurrentPage(1);
    },
    [pageLimit]
  );

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowModal(true);
  };

  const handleRefresh = () => {
    fetchWithdrawalsData();
    toast.success("Refreshed!");
  };

  const effectivePagination = useMemo(() => {
    const totalCount =
      Number(pagination?.total) >= 0
        ? Number(pagination.total)
        : Number(totalWithdrawals) || 0;

    const calculatedPages = Math.max(1, Math.ceil(totalCount / pageLimit));
    const totalPages =
      Number(pagination?.pages) > 0
        ? Number(pagination.pages)
        : calculatedPages;

    return {
      ...pagination,
      page: currentPage,
      limit: pageLimit,
      total: totalCount,
      pages: totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    };
  }, [pagination, currentPage, pageLimit, totalWithdrawals]);

  if (loading && withdrawals.length === 0) {
    return (
      <div className={`min-h-screen ${t.page} transition-colors duration-300`}>
        {isAdmin && (
          <AdminNavbar
            theme={theme}
            setTheme={setTheme}
            user={user}
            handleLogout={handleLogout}
          />
        )}
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <FaSpinner
              className={`animate-spin text-4xl ${t.accentText} mx-auto mb-4`}
            />
            <p className={t.text}>Loading withdrawals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.page} transition-colors duration-300`}>
      {isAdmin && (
        <AdminNavbar
          theme={theme}
          setTheme={setTheme}
          user={user}
          handleLogout={handleLogout}
        />
      )}

      <div
        className={`max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6 ${
          isAdmin ? "pt-6" : ""
        }`}
      >
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
          onLimitChange={handleLimitChange}
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