import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import {
  fetchAffiliateDashboard,
  joinAffiliateProgram,
  createAffiliateLink,
  deleteAffiliateLink,
  setLinkPage,
  setLinkLimit,
} from "../features/affiliate/affiliateSlice";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

import AffiliateHeader from "./components/AffiliateHeader";
import AffiliateStats from "./components/AffiliateStats";
import AffiliateCommission from "./components/AffiliateCommission";
import AffiliateLinks from "./components/AffiliateLinks";
import AffiliateReferrals from "./components/AffiliateReferrals";
import AffiliateJoin from "./components/AffiliateJoin";
import CreateLinkModal from "./components/CreateLinkModal";

const ALLOWED_LIMITS = [5, 10, 20, 50, 100, 200];

const AffiliateDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth || {});
  const {
    loading,
    hasLoadedOnce,
    affiliate,
    stats,
    links,
    linksPagination,
    referrals,
    earnings,
    withdrawals,
    isCreatingLink,
  } = useSelector((state) => state.affiliate);

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

  // UI-only local state
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    destination: "",
    slug: "",
  });

  const loadDashboard = useCallback(
    async (page = linksPagination.page, limit = linksPagination.limit) => {
      const activeToken = token || localStorage.getItem("token");
      if (!activeToken) return;

      const result = await dispatch(
        fetchAffiliateDashboard({ linkPage: page, linkLimit: limit })
      );

      if (fetchAffiliateDashboard.rejected.match(result)) {
        toast.error(result.payload || "Failed to load affiliate dashboard");
      }
    },
    [dispatch, token, linksPagination.page, linksPagination.limit]
  );

  useEffect(() => {
    loadDashboard(linksPagination.page, linksPagination.limit);
  }, [loadDashboard, linksPagination.page, linksPagination.limit]);

  const handleJoinAffiliate = async () => {
    const result = await dispatch(joinAffiliateProgram());
    if (joinAffiliateProgram.fulfilled.match(result)) {
      toast.success("Joined affiliate program successfully!");
      dispatch(setLinkPage(1));
      await loadDashboard(1, linksPagination.limit);
    } else {
      toast.error(result.payload || "Failed to join affiliate program");
    }
  };

  const handleLinkPageChange = (page) => {
    const newPage = Number(page);
    if (!Number.isInteger(newPage) || newPage < 1 || newPage === linksPagination.page) {
      return;
    }
    dispatch(setLinkPage(newPage));
  };

  const handleLinkLimitChange = (limit) => {
    const newLimit = Number(limit);
    if (!ALLOWED_LIMITS.includes(newLimit)) return;
    if (linksPagination.limit === newLimit && linksPagination.page === 1) return;
    dispatch(setLinkLimit(newLimit));
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();

    const name = newLink.name.trim();
    const destination = newLink.destination.trim();
    const slug = newLink.slug.trim();

    if (!name) {
      toast.error("Please enter a link name");
      return;
    }

    if (!destination) {
      toast.error("Please enter a destination URL");
      return;
    }

    const result = await dispatch(
      createAffiliateLink({
        name,
        destination,
        slug: slug || undefined,
      })
    );

    if (createAffiliateLink.fulfilled.match(result)) {
      setNewLink({ name: "", destination: "", slug: "" });
      setShowCreateLink(false);
      dispatch(setLinkPage(1));
      await loadDashboard(1, linksPagination.limit);
      toast.success("Affiliate link created successfully!");
    } else {
      toast.error(result.payload || "Failed to create affiliate link");
    }
  };

  const handleDeleteLink = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this affiliate link?"
    );
    if (!confirmed) return;

    const result = await dispatch(deleteAffiliateLink(id));
    if (deleteAffiliateLink.fulfilled.match(result)) {
      toast.success("Affiliate link deleted");
      await loadDashboard(linksPagination.page, linksPagination.limit);
    } else {
      toast.error(result.payload || "Failed to delete affiliate link");
    }
  };

  const handleCopyLink = async (slug, code) => {
    try {
      if (!slug) {
        toast.error("Affiliate slug is missing");
        return;
      }

      if (!code) {
        toast.error("Affiliate code is missing");
        return;
      }

      const envBackendUrl = import.meta.env.VITE_BACKEND_URL;
      const envApiUrl = import.meta.env.VITE_API_URL;

      const baseUrl =
        envBackendUrl ||
        envApiUrl?.replace(/\/api\/?$/, "") ||
        "http://localhost:5000";

      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      const url = `${cleanBaseUrl}/r/${encodeURIComponent(
        slug
      )}?ref=${encodeURIComponent(code)}`;

      await navigator.clipboard.writeText(url);
      toast.success("Affiliate link copied!");
    } catch {
      toast.error("Failed to copy affiliate link");
    }
  };

  if (loading && !hasLoadedOnce) {
    return (
      <div className={`min-h-screen ${t.page} transition-colors duration-300`}>
        {!isAdmin && (
          <Navbar
            theme={theme}
            setTheme={setTheme}
            user={user}
            handleLogout={handleLogout}
          />
        )}
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <FaSpinner
              className={`animate-spin text-4xl ${t.accentText} mx-auto mb-4`}
            />
            <p className={t.text}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className={`min-h-screen ${t.page} transition-colors duration-300`}>
        {!isAdmin && (
          <Navbar
            theme={theme}
            setTheme={setTheme}
            user={user}
            handleLogout={handleLogout}
          />
        )}
        <AffiliateJoin
          onJoin={handleJoinAffiliate}
          stats={stats}
          theme={t}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}
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
        className={`max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6 ${
          isAdmin ? "pt-6" : ""
        }`}
      >
        <AffiliateHeader
          affiliate={affiliate}
          onWithdraw={() => navigate("/affiliate/withdrawals")}
          onCreateLink={() => setShowCreateLink(true)}
          onToggleHistory={() => setShowHistory((prev) => !prev)}
          showHistory={showHistory}
          theme={t}
        />

        <AffiliateStats stats={stats} earnings={earnings} theme={t} />

        <AffiliateCommission affiliate={affiliate} stats={stats} theme={t} />

        {showHistory && (
          <div className={`rounded-2xl border ${t.card} ${t.border} p-5`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${t.text}`}>
                Withdrawal History
              </h3>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className={`text-xs font-semibold ${t.accentText}`}
              >
                Hide
              </button>
            </div>

            {withdrawals.length > 0 ? (
              <div className="space-y-2">
                {withdrawals.map((w) => (
                  <div
                    key={w._id}
                    className={`flex flex-wrap justify-between items-center gap-2 rounded-xl border ${t.border} ${t.soft} p-3 text-sm`}
                  >
                    <div>
                      <span className={`font-bold ${t.text}`}>
                        ₹{Number(w.amount || 0).toFixed(2)}
                      </span>
                      <span className={`ml-2 text-xs uppercase ${t.muted}`}>
                        ({w.paymentMethod || "N/A"})
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${t.accentText}`}>
                      {w.status || "pending"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${t.muted}`}>
                No withdrawal history found.
              </p>
            )}
          </div>
        )}

        <AffiliateLinks
          links={links}
          affiliateCode={affiliate?.affiliateCode}
          pagination={linksPagination}
          onPageChange={handleLinkPageChange}
          onLimitChange={handleLinkLimitChange}
          onCopyLink={handleCopyLink}
          onDeleteLink={handleDeleteLink}
          onOpenCreate={() => setShowCreateLink(true)}
          theme={t}
        />

        <AffiliateReferrals
          referrals={referrals}
          isServerPaginated={true}
          theme={t}
        />
      </div>

      <CreateLinkModal
        isOpen={showCreateLink}
        onClose={() => setShowCreateLink(false)}
        onSubmit={handleCreateLink}
        newLink={newLink}
        setNewLink={setNewLink}
        isCreating={isCreatingLink}
        theme={t}
      />
    </div>
  );
};

export default AffiliateDashboard;