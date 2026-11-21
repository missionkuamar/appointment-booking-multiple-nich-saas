import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const REFERRAL_LIMIT = 10;

const AffiliateDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth || {});
  const {
    loading,
    hasLoadedOnce,
    affiliate,
    stats,
    links = [],
    linksPagination = { page: 1, limit: 10, total: 0, pages: 1 },
    referrals = [],
    earnings = 0,
    withdrawals = [],
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

  // Modals & toggles
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWithdrawals, setShowWithdrawals] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    destination: "",
    slug: "",
  });

  // Referrals state: 10 per page + status filter
  const [refList, setRefList] = useState([]);
  const [refStatus, setRefStatus] = useState("");
  const [refPage, setRefPage] = useState(1);
  const [refTotal, setRefTotal] = useState(0);
  const [refTotalPages, setRefTotalPages] = useState(1);
  const [refLoading, setRefLoading] = useState(false);

  const linkPage = Number(linksPagination?.page) || 1;
  const linkLimit = Number(linksPagination?.limit) || 10;

  // Prevent duplicate calls for exact same (token, page, limit)
  const lastFetchedRef = useRef("");

  const loadDashboard = useCallback(
    async (page = 1, limit = 10, force = false) => {
      const activeToken = token || localStorage.getItem("token");
      if (!activeToken) return;

      const key = `${activeToken}|${page}|${limit}`;
      if (!force && lastFetchedRef.current === key) return;
      lastFetchedRef.current = key;

      const result = await dispatch(
        fetchAffiliateDashboard({ linkPage: page, linkLimit: limit })
      );
      if (fetchAffiliateDashboard.rejected.match(result)) {
        lastFetchedRef.current = "";
        toast.error(result.payload || "Failed to load dashboard");
      }
    },
    [dispatch, token]
  );

  useEffect(() => {
    loadDashboard(linkPage, linkLimit, false);
  }, [loadDashboard, linkPage, linkLimit]);

  const loadReferrals = useCallback(
    async (targetPage = 1, targetStatus = "") => {
      const activeToken = token || localStorage.getItem("token");
      if (!activeToken) return;

      setRefLoading(true);
      try {
        const params = { page: targetPage, limit: REFERRAL_LIMIT };
        if (targetStatus) params.status = targetStatus;

        const res = await api.get("/affiliate/referrals", { params });
        const data = res?.data?.data || res?.data || {};

        const rawItems = Array.isArray(data.referrals)
          ? data.referrals
          : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        const pag = data.pagination || {};
        const serverTotal =
          pag.total ?? data.total ?? data.totalCount ?? rawItems.length;

        if (rawItems.length > REFERRAL_LIMIT && !pag.limit) {
          const filtered = targetStatus
            ? rawItems.filter(
                (r) =>
                  String(r.status || "").toLowerCase() ===
                  targetStatus.toLowerCase()
              )
            : rawItems;
          const start = (targetPage - 1) * REFERRAL_LIMIT;
          setRefList(filtered.slice(start, start + REFERRAL_LIMIT));
          setRefTotal(filtered.length);
          setRefTotalPages(
            Math.max(1, Math.ceil(filtered.length / REFERRAL_LIMIT))
          );
        } else {
          setRefList(rawItems);
          setRefTotal(Number(serverTotal) || 0);
          setRefTotalPages(
            Number(pag.pages || pag.totalPages) ||
              Math.max(1, Math.ceil((Number(serverTotal) || 0) / REFERRAL_LIMIT))
          );
        }
      } catch {
        const fallback = Array.isArray(referrals) ? referrals : [];
        const filtered = targetStatus
          ? fallback.filter(
              (r) =>
                String(r.status || "").toLowerCase() ===
                targetStatus.toLowerCase()
            )
          : fallback;
        const start = (targetPage - 1) * REFERRAL_LIMIT;
        setRefList(filtered.slice(start, start + REFERRAL_LIMIT));
        setRefTotal(filtered.length);
        setRefTotalPages(Math.max(1, Math.ceil(filtered.length / REFERRAL_LIMIT)));
      } finally {
        setRefLoading(false);
      }
    },
    [token, referrals]
  );

  useEffect(() => {
    if (!affiliate) return;
    loadReferrals(refPage, refStatus);
  }, [affiliate, loadReferrals, refPage, refStatus]);

  const handleJoin = async () => {
    const result = await dispatch(joinAffiliateProgram());
    if (joinAffiliateProgram.fulfilled.match(result)) {
      toast.success("Joined affiliate program!");
      dispatch(setLinkPage(1));
      await loadDashboard(1, linkLimit, true);
      await loadReferrals(1, refStatus);
    } else {
      toast.error(result.payload || "Failed to join");
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    const name = newLink.name.trim();
    const destination = newLink.destination.trim();
    const slug = newLink.slug.trim();

    if (!name || !destination) {
      return toast.error("Name and Destination URL are required");
    }

    const result = await dispatch(
      createAffiliateLink({ name, destination, slug: slug || undefined })
    );

    if (createAffiliateLink.fulfilled.match(result)) {
      setNewLink({ name: "", destination: "", slug: "" });
      setShowCreateModal(false);
      dispatch(setLinkPage(1));
      await loadDashboard(1, linkLimit, true);
      toast.success("Link created!");
    } else {
      toast.error(result.payload || "Failed to create link");
    }
  };

  const handleDeleteLink = async (id) => {
    if (!id || !window.confirm("Delete this affiliate link?")) return;
    const result = await dispatch(deleteAffiliateLink(id));
    if (deleteAffiliateLink.fulfilled.match(result)) {
      toast.success("Link deleted");
      await loadDashboard(linkPage, linkLimit, true);
    } else {
      toast.error(result.payload || "Failed to delete link");
    }
  };

  const handleCopyCode = async () => {
    if (!affiliate?.affiliateCode) return;
    try {
      await navigator.clipboard.writeText(affiliate.affiliateCode);
      toast.success("Code copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyLink = async (slug, code) => {
    if (!slug || !code) return toast.error("Slug or code missing");
    try {
      const base =
        import.meta.env.VITE_BACKEND_URL ||
        import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
        "http://localhost:5000";
      const url = `${base.replace(/\/$/, "")}/r/${encodeURIComponent(
        slug
      )}?ref=${encodeURIComponent(code)}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy");
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

  if (loading && !hasLoadedOnce) {
    return (
      <div className={`min-h-screen ${t.page}`}>
        {!isAdmin && (
          <Navbar
            theme={theme}
            setTheme={setTheme}
            user={user}
            handleLogout={handleLogout}
          />
        )}
        <p className={`py-20 text-center text-sm ${t.muted}`}>Loading...</p>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className={`min-h-screen ${t.page}`}>
        {!isAdmin && (
          <Navbar
            theme={theme}
            setTheme={setTheme}
            user={user}
            handleLogout={handleLogout}
          />
        )}
        <div className="max-w-lg mx-auto px-4 py-14">
          <div
            className={`p-6 rounded-xl border ${t.card} ${t.border} text-center space-y-4`}
          >
            <h1 className={`text-xl font-bold ${t.text}`}>
              Join Affiliate Program
            </h1>
            <p className={`text-sm ${t.muted}`}>
              Earn {stats?.commissionRate || 10}% commission on referrals.
            </p>
            <button
              type="button"
              onClick={handleJoin}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
            >
              Join Free
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalLinkPages = Math.max(1, Number(linksPagination?.pages) || 1);

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

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div
          className={`p-4 rounded-xl border ${t.card} ${t.border} flex flex-wrap items-center justify-between gap-3`}
        >
          <div>
            <h1 className={`text-xl font-bold ${t.text}`}>
              Affiliate Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className={t.muted}>Code:</span>
              <code
                className={`px-2 py-0.5 rounded border font-mono ${t.soft} ${t.border} ${t.text}`}
              >
                {affiliate.affiliateCode}
              </code>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-indigo-600 hover:underline"
              >
                Copy
              </button>
              <span className={t.muted}>
                - {affiliate?.commissionRate || 10}%
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowWithdrawals((p) => !p)}
              className={`px-3 py-1.5 rounded-lg border text-xs ${t.border} ${t.text}`}
            >
              {showWithdrawals ? "Hide" : "Withdrawals"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/affiliate/withdrawals")}
              className={`px-3 py-1.5 rounded-lg border text-xs ${t.border} ${t.text}`}
            >
              Withdraw
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
            >
              + Create Link
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-4 rounded-xl border ${t.card} ${t.border}`}>
            <p className={`text-xs ${t.muted}`}>Clicks</p>
            <p className={`text-lg font-bold mt-1 ${t.text}`}>
              {stats?.totalClicks ?? 0}
            </p>
          </div>
          <div className={`p-4 rounded-xl border ${t.card} ${t.border}`}>
            <p className={`text-xs ${t.muted}`}>Referrals</p>
            <p className={`text-lg font-bold mt-1 ${t.text}`}>
              {stats?.totalReferrals ?? 0}
            </p>
          </div>
          <div className={`p-4 rounded-xl border ${t.card} ${t.border}`}>
            <p className={`text-xs ${t.muted}`}>Conversion</p>
            <p className={`text-lg font-bold mt-1 ${t.text}`}>
              {stats?.conversionRate ?? 0}%
            </p>
          </div>
          <div className={`p-4 rounded-xl border ${t.card} ${t.border}`}>
            <p className={`text-xs ${t.muted}`}>Earnings</p>
            <p className={`text-lg font-bold mt-1 ${t.text}`}>
              ₹{Number(earnings ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Quick Withdrawals Toggle */}
        {showWithdrawals && (
          <div className={`p-4 rounded-xl border ${t.card} ${t.border}`}>
            <h2 className={`text-sm font-semibold mb-2 ${t.text}`}>
              Recent Withdrawals
            </h2>
            {withdrawals.length === 0 ? (
              <p className={`text-xs ${t.muted}`}>No withdrawals yet.</p>
            ) : (
              <div className={`divide-y ${t.border} text-sm`}>
                {withdrawals.map((w) => (
                  <div key={w._id} className="py-2 flex justify-between">
                    <span className={t.text}>
                      ₹{Number(w.amount || 0).toFixed(2)} ({w.paymentMethod})
                    </span>
                    <span className={`text-xs capitalize ${t.muted}`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Links Table */}
        <div
          className={`rounded-xl border ${t.card} ${t.border} overflow-hidden`}
        >
          <div
            className={`px-4 py-3 border-b ${t.border} flex items-center justify-between`}
          >
            <h2 className={`text-sm font-semibold ${t.text}`}>
              Links ({linksPagination?.total ?? links.length})
            </h2>
            <select
              value={linkLimit}
              onChange={(e) => dispatch(setLinkLimit(Number(e.target.value)))}
              className={`px-2 py-1 rounded border text-xs ${t.card} ${t.border} ${t.text}`}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {links.length === 0 ? (
            <p className={`p-6 text-center text-sm ${t.muted}`}>No links yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`border-b ${t.border} ${t.soft} text-xs`}>
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Slug</th>
                    <th className="py-2.5 px-4">Clicks</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t.border}`}>
                  {links.map((link) => (
                    <tr key={link._id}>
                      <td className={`py-2.5 px-4 ${t.text}`}>{link.name}</td>
                      <td className={`py-2.5 px-4 font-mono text-xs ${t.text}`}>
                        /{link.slug}
                      </td>
                      <td className={`py-2.5 px-4 ${t.text}`}>
                        {link.clicks ?? 0}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-xs capitalize ${t.muted}`}
                      >
                        {link.status || "active"}
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyLink(link.slug, affiliate.affiliateCode)
                          }
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link._id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalLinkPages > 1 && (
            <div
              className={`px-4 py-2.5 border-t ${t.border} flex items-center justify-between text-xs`}
            >
              <button
                type="button"
                disabled={linkPage <= 1}
                onClick={() => dispatch(setLinkPage(linkPage - 1))}
                className={`px-2.5 py-1 rounded border ${t.border} ${t.text} disabled:opacity-40`}
              >
                ← Prev
              </button>
              <span className={t.muted}>
                Page {linkPage} of {totalLinkPages}
              </span>
              <button
                type="button"
                disabled={linkPage >= totalLinkPages}
                onClick={() => dispatch(setLinkPage(linkPage + 1))}
                className={`px-2.5 py-1 rounded border ${t.border} ${t.text} disabled:opacity-40`}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Referrals (10 per page + Filter) */}
        <div
          className={`rounded-xl border ${t.card} ${t.border} overflow-hidden`}
        >
          <div
            className={`px-4 py-3 border-b ${t.border} flex flex-wrap items-center justify-between gap-2`}
          >
            <h2 className={`text-sm font-semibold ${t.text}`}>
              Referrals ({refTotal})
            </h2>

            <select
              value={refStatus}
              onChange={(e) => {
                setRefStatus(e.target.value);
                setRefPage(1);
              }}
              className={`px-2.5 py-1 rounded border text-xs ${t.card} ${t.border} ${t.text}`}
            >
              <option value="">All Status</option>
              <option value="subscribed">Subscribed</option>
              <option value="registered">Registered</option>
              <option value="clicked">Clicked</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {refLoading ? (
            <p className={`p-6 text-center text-sm ${t.muted}`}>Loading...</p>
          ) : refList.length === 0 ? (
            <p className={`p-6 text-center text-sm ${t.muted}`}>
              No referrals found.
            </p>
          ) : (
            <div className={`divide-y ${t.border} text-sm`}>
              {refList.map((ref, idx) => (
                <div
                  key={ref._id || idx}
                  className="px-4 py-2.5 flex justify-between items-center"
                >
                  <div>
                    <p className={`font-medium ${t.text}`}>
                      {ref.referredUser?.name || "Anonymous User"}
                    </p>
                    <p className={`text-xs ${t.muted}`}>
                      {formatDate(ref.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`capitalize ${t.muted}`}>
                      {ref.status || "clicked"}
                    </span>
                    {Number(ref.commission) > 0 && (
                      <span className="font-semibold text-green-600">
                        +₹{Number(ref.commission).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {refTotalPages > 1 && (
            <div
              className={`px-4 py-2.5 border-t ${t.border} flex items-center justify-between text-xs`}
            >
              <button
                type="button"
                disabled={refPage <= 1}
                onClick={() => setRefPage((p) => Math.max(1, p - 1))}
                className={`px-2.5 py-1 rounded border ${t.border} ${t.text} disabled:opacity-40`}
              >
                ← Prev
              </button>
              <span className={t.muted}>
                Page {refPage} of {refTotalPages} (10 / page)
              </span>
              <button
                type="button"
                disabled={refPage >= refTotalPages}
                onClick={() => setRefPage((p) => Math.min(refTotalPages, p + 1))}
                className={`px-2.5 py-1 rounded border ${t.border} ${t.text} disabled:opacity-40`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className={`w-full max-w-md rounded-xl p-5 border ${t.card} ${t.border}`}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className={`text-base font-bold ${t.text}`}>Create Link</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={`text-sm ${t.muted}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-3">
              <input
                type="text"
                placeholder="Link Name *"
                value={newLink.name}
                onChange={(e) =>
                  setNewLink({ ...newLink, name: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
                required
              />
              <input
                type="url"
                placeholder="Destination URL *"
                value={newLink.destination}
                onChange={(e) =>
                  setNewLink({ ...newLink, destination: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
                required
              />
              <input
                type="text"
                placeholder="Custom Slug (optional)"
                value={newLink.slug}
                onChange={(e) =>
                  setNewLink({ ...newLink, slug: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm ${t.card} ${t.border} ${t.text}`}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-3.5 py-1.5 border rounded-lg text-sm ${t.border} ${t.text}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLink}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  {isCreatingLink ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateDashboard;