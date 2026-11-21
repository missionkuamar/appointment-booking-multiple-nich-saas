import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import {
  fetchWithdrawalsList,
  fetchWithdrawalStats,
  fetchWithdrawalEarnings,
  requestWithdrawal,
  cancelWithdrawalRequest,
  setWithdrawalFilters,
  setWithdrawalPage,
  setWithdrawalLimit,
} from "../features/withdrawal/withdrawalSlice";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

// Components
import WithdrawalHeader from "./components/WithdrawalHeader";
import WithdrawalStats from "./components/WithdrawalStats";
import WithdrawalFilters from "./components/WithdrawalFilters";
import WithdrawalTable from "./components/WithdrawalTable";
import WithdrawModal from "./components/WithdrawModal";
import WithdrawalDetailModal from "./components/WithdrawalDetailModal";
import WithdrawalStatsModal from "./components/WithdrawalStatsModal";

const AffiliateWithdrawals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const {
    withdrawals,
    withdrawStats,
    earnings,
    pagination,
    filters,
    loading,
    withdrawLoading,
  } = useSelector((state) => state.withdrawal);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  // ============================================================
  // MODALS & FORM LOCAL STATE
  // ============================================================

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");

  const [paymentDetails, setPaymentDetails] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "savings",
    upiId: "",
    upiName: "",
    paypalEmail: "",
    paypalName: "",
  });

  const resetPaymentDetails = () => {
    setPaymentDetails({
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountType: "savings",
      upiId: "",
      upiName: "",
      paypalEmail: "",
      paypalName: "",
    });
  };

  // ============================================================
  // FETCH EFFECTS
  // ============================================================

  useEffect(() => {
    const loadList = async () => {
      const result = await dispatch(fetchWithdrawalsList());
      if (fetchWithdrawalsList.rejected.match(result)) {
        toast.error(result.payload || "Failed to load withdrawals");
      }
    };
    loadList();
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    filters.status,
    filters.paymentMethod,
    filters.search,
    filters.startDate,
    filters.endDate,
  ]);

  useEffect(() => {
    const loadMeta = async () => {
      const [statsRes, earningsRes] = await Promise.all([
        dispatch(fetchWithdrawalStats()),
        dispatch(fetchWithdrawalEarnings()),
      ]);

      if (fetchWithdrawalStats.rejected.match(statsRes)) {
        toast.error(statsRes.payload || "Failed to load withdrawal stats");
      }
      if (fetchWithdrawalEarnings.rejected.match(earningsRes)) {
        toast.error(earningsRes.payload || "Failed to load earnings");
      }
    };
    loadMeta();
  }, [dispatch]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleLimitChange = (newLimit) => {
    dispatch(setWithdrawalLimit(newLimit));
  };

  const handlePageChange = (newPage) => {
    const page = Number(newPage);
    if (!Number.isFinite(page)) return;
    if (page < 1 || (pagination.pages > 0 && page > pagination.pages)) return;
    dispatch(setWithdrawalPage(page));
  };

  const handleFilterChange = (newFilters) => {
    dispatch(setWithdrawalFilters(newFilters));
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

    const amountNum = Number(parseFloat(amount));
    const MIN_WITHDRAWAL = 100;
    const MAX_WITHDRAWAL = 10000;

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (amountNum < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAWAL}`);
      return;
    }

    if (amountNum > MAX_WITHDRAWAL) {
      toast.error(`Maximum per transaction is ₹${MAX_WITHDRAWAL}`);
      return;
    }

    if (amountNum > earnings) {
      toast.error("Insufficient earnings");
      return;
    }

    const normalizedPaymentDetails = {
      ...paymentDetails,
      accountHolderName: paymentDetails?.accountHolderName?.trim() || "",
      bankName: paymentDetails?.bankName?.trim() || "",
      accountNumber: paymentDetails?.accountNumber?.trim() || "",
      ifsc:
        paymentDetails?.ifsc?.trim() ||
        paymentDetails?.ifscCode?.trim() ||
        "",
      upiId: paymentDetails?.upiId?.trim() || "",
      upiName: paymentDetails?.upiName?.trim() || "",
      paypalEmail: paymentDetails?.paypalEmail?.trim() || "",
      paypalName: paymentDetails?.paypalName?.trim() || "",
    };

    if (paymentMethod === "bank") {
      if (
        !normalizedPaymentDetails.accountHolderName ||
        !normalizedPaymentDetails.accountNumber ||
        !normalizedPaymentDetails.ifsc
      ) {
        toast.error(
          "Please enter Account Holder Name, Account Number and IFSC Code"
        );
        return;
      }
    }

    if (paymentMethod === "upi") {
      if (!normalizedPaymentDetails.upiId) {
        toast.error("Please enter your UPI ID");
        return;
      }
    }

    const result = await dispatch(
      requestWithdrawal({
        amount: amountNum,
        paymentMethod,
        paymentDetails: normalizedPaymentDetails,
      })
    );

    if (requestWithdrawal.fulfilled.match(result)) {
      toast.success(
        "Withdrawal request submitted! Admin will process it shortly."
      );
      setShowWithdrawModal(false);
      setAmount("");
      resetPaymentDetails();
    } else {
      toast.error(result.payload || "Failed to request withdrawal");
    }
  };

  const handleCancelWithdrawal = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this withdrawal?"
    );
    if (!confirmed) return;

    const result = await dispatch(cancelWithdrawalRequest(id));
    if (cancelWithdrawalRequest.fulfilled.match(result)) {
      toast.success("Withdrawal cancelled successfully");
    } else {
      toast.error(result.payload || "Failed to cancel withdrawal");
    }
  };

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailModal(true);
  };

  const openWithdrawModal = () => {
    setShowWithdrawModal(true);
  };

  // ============================================================
  // INITIAL FULL PAGE LOADING
  // ============================================================

  if (loading && withdrawals.length === 0) {
    return (
      <div
        className={`min-h-screen w-full ${t.page} transition-colors duration-300`}
      >
        {!isAdmin && (
          <Navbar
            theme={theme}
            setTheme={setTheme}
            user={user}
            handleLogout={handleLogout}
          />
        )}
        <div className="flex items-center justify-center py-24 px-4">
          <div className="text-center">
            <FaSpinner
              className={`animate-spin text-3xl sm:text-4xl ${t.accentText} mx-auto mb-4`}
            />
            <p className={`text-sm sm:text-base ${t.text}`}>
              Loading withdrawals...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div
      className={`min-h-screen w-full min-w-0 ${t.page} overflow-x-hidden pb-10 transition-colors duration-300`}
    >
      {!isAdmin && (
        <Navbar
          theme={theme}
          setTheme={setTheme}
          user={user}
          handleLogout={handleLogout}
        />
      )}

      <div
        className={`w-full max-w-7xl mx-auto min-w-0 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 space-y-4 sm:space-y-5 md:space-y-6 ${
          isAdmin ? "pt-6" : ""
        }`}
      >
        <div className="w-full min-w-0">
          <WithdrawalHeader
            theme={theme}
            onBack={() => navigate("/affiliate")}
            onViewStats={() => setShowStatsModal(true)}
            onWithdraw={openWithdrawModal}
            earnings={earnings}
          />
        </div>

        <div className="w-full min-w-0">
          <WithdrawalStats
            theme={theme}
            withdrawStats={withdrawStats}
            withdrawals={withdrawals}
          />
        </div>

        <div className="w-full min-w-0">
          <WithdrawalFilters
            theme={theme}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        <div className="w-full min-w-0 overflow-hidden">
          <WithdrawalTable
            theme={theme}
            withdrawals={withdrawals}
            loading={loading}
            onLimitChange={handleLimitChange}
            pagination={pagination}
            onPageChange={handlePageChange}
            onViewDetails={handleViewDetails}
            onCancel={handleCancelWithdrawal}
            onWithdraw={openWithdrawModal}
            earnings={earnings}
          />
        </div>
      </div>

      <WithdrawModal
        theme={theme}
        isOpen={showWithdrawModal}
        onClose={() => {
          if (!withdrawLoading) {
            setShowWithdrawModal(false);
          }
        }}
        earnings={earnings}
        amount={amount}
        setAmount={setAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentDetails={paymentDetails}
        setPaymentDetails={setPaymentDetails}
        onSubmit={handleWithdraw}
        loading={withdrawLoading}
      />

      <WithdrawalDetailModal
        theme={theme}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        withdrawal={selectedWithdrawal}
      />

      <WithdrawalStatsModal
        theme={theme}
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        withdrawals={withdrawals}
      />
    </div>
  );
};

export default AffiliateWithdrawals;