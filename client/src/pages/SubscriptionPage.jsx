import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchPlans,
  fetchSubscriptionStatus,
  createSubscription,
  verifyPayment,
} from "../features/subscription/subscriptionSlice";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import api from "../api/axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const SubscriptionPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { plans, plan, status, endDate, loading } = useSelector(
    (s) => s.subscription
  );

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  // Past Subscriptions History + Pagination State (10 per page)
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

 const fetchSubscriptionHistory = async (targetPage = 1) => {
  // console.log("📡 [fetchSubscriptionHistory] Fetching history for page:", targetPage);
  setHistoryLoading(true);

  try {
    const res = await api.get("/subscriptions/history", {
      params: { page: targetPage, limit: 10 },
    });

    // console.log("res hisitoer =  ", res);
    // console.log("📦 [fetchSubscriptionHistory] res.data:", res.data);

    const list = Array.isArray(res.data)
      ? res.data
      : res.data?.data || res.data?.history || [];

    // console.log("📋 [fetchSubscriptionHistory] Extracted list count:", list.length, list);
    setHistory(list);

    if (res.data?.pagination) {
      // console.log("📄 [fetchSubscriptionHistory] Using server pagination:", res.data.pagination);
      setHistoryPagination(res.data.pagination);
    } else {
      const fallbackPagination = {
        page: targetPage,
        limit: 10,
        total: list.length,
        totalPages: Math.max(Math.ceil(list.length / 10), 1),
      };
      // console.log("📄 [fetchSubscriptionHistory] Using fallback pagination:", fallbackPagination);
      setHistoryPagination(fallbackPagination);
    }
  } catch (err) {
    console.warn("⚠️ Could not load subscription history:", err);
    console.warn("⚠️ [fetchSubscriptionHistory] Error details:", err.response?.data || err.message);
    setHistory([]);
  } finally {
    setHistoryLoading(false);
    // console.log("🏁 [fetchSubscriptionHistory] Completed for page:", targetPage);
  }
};

  useEffect(() => {
    // console.log("🔄 [SubscriptionPage] Fetching plans & subscription status...");
    dispatch(fetchPlans());
    dispatch(fetchSubscriptionStatus());
  }, [dispatch]);

  useEffect(() => {
    fetchSubscriptionHistory(historyPage);
  }, [historyPage]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const currentPlanId = String(plan || "free")
    .toLowerCase()
    .trim();
  const normalizedStatus = String(status || "active")
    .toLowerCase()
    .trim();
  const isPaidPlanActive =
    normalizedStatus === "active" && currentPlanId !== "free";

  useEffect(() => {
    // console.log("📊 [SubscriptionPage] State:", {
    //   plan,
    //   currentPlanId,
    //   status: normalizedStatus,
    //   isPaidPlanActive,
    //   loading,
    //   plansCount: plans?.length || 0,
    //   plans: plans?.map((pl) => ({ id: pl.id, _id: pl._id, name: pl.name, price: pl.price })),
    // });
  }, [plan, currentPlanId, normalizedStatus, isPaidPlanActive, loading, plans]);

  const handleSubscribe = async (planId) => {
    const cleanPlanId = String(planId || "").toLowerCase().trim();
    // console.log("🖱️ [SubscriptionPage] Subscribe clicked for:", cleanPlanId);

    if (!cleanPlanId || cleanPlanId === "free") {
      // console.log("ℹ️ [SubscriptionPage] Free plan clicked, skipping checkout");
      return;
    }

    try {
      // console.log("🚀 [Frontend: handleSubscribe] Creating order for:", cleanPlanId);
      const res = await dispatch(createSubscription(cleanPlanId));
      if (!createSubscription.fulfilled.match(res)) {
        console.error("❌ [Frontend: createSubscription failed]:", res.payload);
        return toast.error(res.payload || "Failed to initiate order");
      }

      const payloadData = res.payload?.data || res.payload || {};
      const {
        orderId,
        subscriptionId,
        amount,
        currency = "INR",
        keyId,
      } = payloadData;

      const rzpKey = keyId || window.__RAZORPAY_KEY_ID__;

      // console.log("📦 [Frontend: handleSubscribe] Opening Razorpay modal:", {
      //   orderId,
      //   subscriptionId,
      //   amount,
      //   hasKeyId: !!rzpKey,
      // });

      if (!rzpKey) {
        return toast.error("Razorpay Key ID missing");
      }

      if (!orderId && !subscriptionId) {
        return toast.error("Order ID missing from server response");
      }

      const options = {
        key: rzpKey,
        amount: amount,
        currency,
        ...(orderId ? { order_id: orderId } : { subscription_id: subscriptionId }),
        name: "BookEasy",
        description: `${cleanPlanId.toUpperCase()} Plan Subscription`,
        handler: async (response) => {
          // console.log("✅ [Frontend: Razorpay handler] Payment response:", response);

          const verifyRes = await dispatch(
            verifyPayment({
              orderId: response.razorpay_order_id || orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan: cleanPlanId,
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id:
                response.razorpay_subscription_id || subscriptionId,
              razorpay_signature: response.razorpay_signature,
            })
          );

          if (verifyPayment.fulfilled.match(verifyRes)) {
            toast.success("Subscription activated! 🎉");
            await dispatch(fetchSubscriptionStatus());
            setHistoryPage(1);
            await fetchSubscriptionHistory(1);
            navigate("/dashboard");
          } else {
            console.error("❌ [Frontend: verifyPayment rejected]:", verifyRes.payload);
            toast.error("Verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            console.warn("⚠️ [Frontend: Razorpay modal] Closed without completing payment");
          },
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#4F46E5" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (failureResponse) => {
        console.error("❌ [Frontend: rzp payment.failed]:", failureResponse?.error);
        toast.error(failureResponse?.error?.description || "Payment failed");
      });

      rzp.open();
    } catch (err) {
      console.error("❌ [Frontend: handleSubscribe] Unexpected error:", err);
      toast.error(err?.message || "Something went wrong");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel active paid subscription?")) return;
    try {
      await api.post("/subscriptions/cancel");
      toast.success("Subscription cancelled");
      await dispatch(fetchSubscriptionStatus());
      await fetchSubscriptionHistory(historyPage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancel failed");
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "—";
    return new Date(dateVal).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className={`min-h-screen ${t.page} pb-12 transition-colors duration-300`}
    >
      {/* Shared Navbar */}
      <Navbar
        theme={theme}
        setTheme={setTheme}
        user={user}
        handleLogout={handleLogout}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Top Back Link */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${t.text}`}>
              Subscription & Plans
            </h1>
            <p className={`text-sm mt-1 ${t.muted}`}>
              Manage your clinic plan, upgrades, and billing history
            </p>
          </div>

          <Link
            to="/dashboard"
            className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl border ${t.border} ${t.card} ${t.text} ${t.hover}`}
          >
            ← Dashboard
          </Link>
        </div>

        {/* Current Plan Banner */}
        <div
          className={`rounded-2xl border ${t.card} ${t.border} p-5 mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-l-4 ${
            normalizedStatus === "active"
              ? "border-l-green-500"
              : "border-l-yellow-500"
          }`}
        >
          <div>
            <p className={`text-xs font-semibold uppercase ${t.muted}`}>
              Current Active Plan
            </p>
            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
              <p className={`text-2xl font-bold capitalize ${t.text}`}>
                {currentPlanId} Plan
              </p>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  normalizedStatus === "active"
                    ? "bg-green-500/15 text-green-500"
                    : "bg-yellow-500/15 text-yellow-500"
                }`}
              >
                {normalizedStatus || "active"}
              </span>
            </div>
            {endDate && (
              <p className={`text-xs mt-1 ${t.muted}`}>
                Valid / Next Renewal: <strong>{formatDate(endDate)}</strong>
              </p>
            )}
          </div>

          {/* {isPaidPlanActive && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/15 text-red-500 hover:bg-red-500/25 transition self-start sm:self-auto"
            >
              Cancel Subscription
            </button>
          )} */}
        </div>

        {/* Plans Grid */}
        {loading && (!plans || plans.length === 0) ? (
          <p className={`text-center py-10 text-sm ${t.muted}`}>
            Loading plans...
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {(plans || []).map((p) => {
              const planKey = String(p.id || p._id || p.name || "")
                .toLowerCase()
                .trim();
              const isFreeTier = planKey === "free" || Number(p.price) === 0;
              const isCurrentPlan =
                currentPlanId === planKey &&
                (normalizedStatus === "active" || isFreeTier);

              // ✅ Upgrade button tabhi disabled hoga jab plan already current/active ho ya free tier ho
              const isDisabled = loading || isCurrentPlan || isFreeTier;

              let buttonLabel = "Upgrade Now";
              if (isCurrentPlan) {
                buttonLabel = "Current Plan ✓";
              } else if (isFreeTier) {
                buttonLabel = "Default Free Tier";
              } else if (currentPlanId === "free") {
                buttonLabel = `Upgrade to ${p.name}`;
              } else {
                buttonLabel = `Switch to ${p.name}`;
              }

              return (
                <div
                  key={planKey || p.name}
                  className={`rounded-2xl border ${t.card} ${
                    p.popular
                      ? "border-2 border-indigo-500"
                      : isCurrentPlan
                      ? "border-2 border-green-500"
                      : t.border
                  } p-6 relative flex flex-col`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] px-3 py-1 rounded-full font-bold whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  )}

                  {isCurrentPlan && !p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[11px] px-3 py-1 rounded-full font-bold whitespace-nowrap">
                      ACTIVE NOW
                    </span>
                  )}

                  <h3 className={`text-xl font-bold ${t.text}`}>{p.name}</h3>
                  <p className={`text-xs mt-1 min-h-[32px] ${t.muted}`}>
                    {p.description}
                  </p>

                  <div className="my-4">
                    <span className={`text-3xl font-bold ${t.accentText}`}>
                      ₹{p.price}
                    </span>
                    <span className={`text-xs ${t.muted}`}>/{p.period}</span>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {(p.features || []).map((f) => (
                      <li
                        key={f}
                        className={`text-xs flex items-start gap-2 ${t.text}`}
                      >
                        <span className="text-green-500 font-bold">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleSubscribe(p.id || p._id || p.name)}
                    disabled={isDisabled}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                      isCurrentPlan
                        ? "bg-green-500/15 text-green-500 cursor-default"
                        : isDisabled
                        ? `${t.soft} ${t.muted} cursor-not-allowed`
                        : `${t.accent} text-white hover:opacity-90`
                    }`}
                  >
                    {buttonLabel}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Past Subscriptions History Table (10 per page + Pagination) */}
        <div
          className={`rounded-2xl border ${t.card} ${t.border} overflow-hidden`}
        >
          <div
            className={`p-5 border-b ${t.border} ${t.soft} flex flex-wrap justify-between items-center gap-2`}
          >
            <div>
              <h2 className={`text-lg font-bold ${t.text}`}>
                Past Subscriptions ({historyPagination.total})
              </h2>
              <p className={`text-xs ${t.muted}`}>
                Showing 10 records per page
              </p>
            </div>
          </div>

          {historyLoading ? (
            <div className={`p-8 text-center text-sm ${t.muted}`}>
              Loading subscription history...
            </div>
          ) : history.length === 0 ? (
            <div className={`p-8 text-center text-sm ${t.muted}`}>
              Abhi koi past subscription record nahi hai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className={`border-b ${t.border} ${t.soft} text-[11px] uppercase ${t.muted}`}
                  >
                    <th className="py-3.5 px-5 font-semibold">Plan</th>
                    <th className="py-3.5 px-5 font-semibold">Amount</th>
                    <th className="py-3.5 px-5 font-semibold">Status</th>
                    <th className="py-3.5 px-5 font-semibold">Start Date</th>
                    <th className="py-3.5 px-5 font-semibold">End Date</th>
                    <th className="py-3.5 px-5 font-semibold">
                      Payment / Sub ID
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t.border} text-xs`}>
                  {history.map((item, idx) => (
                    <tr key={item._id || idx} className={`${t.hover}`}>
                      <td
                        className={`py-3.5 px-5 font-bold capitalize ${t.text}`}
                      >
                        {item.plan || "free"}
                      </td>
                      <td className={`py-3.5 px-5 font-semibold ${t.text}`}>
                        ₹{item.price ?? 0}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === "active"
                              ? "bg-green-500/15 text-green-500"
                              : item.status === "cancelled" ||
                                item.status === "expired"
                              ? "bg-red-500/15 text-red-500"
                              : "bg-yellow-500/15 text-yellow-500"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className={`py-3.5 px-5 ${t.muted}`}>
                        {formatDate(item.startDate || item.createdAt)}
                      </td>
                      <td className={`py-3.5 px-5 ${t.muted}`}>
                        {formatDate(item.endDate)}
                      </td>
                      <td className={`py-3.5 px-5 font-mono ${t.muted}`}>
                        {item.razorpayPaymentId ||
                          item.razorpaySubscriptionId ||
                          "Free Tier"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {historyPagination.totalPages > 1 && (
            <div
              className={`p-4 border-t ${t.border} flex justify-between items-center`}
            >
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${t.border} ${t.soft} ${t.text} disabled:opacity-50 ${t.hover}`}
              >
                ← Previous
              </button>

              <span className={`text-xs font-medium ${t.muted}`}>
                Page{" "}
                <strong className={t.accentText}>
                  {historyPagination.page}
                </strong>{" "}
                of {historyPagination.totalPages} ({historyPagination.total}{" "}
                total)
              </span>

              <button
                onClick={() =>
                  setHistoryPage((p) =>
                    Math.min(historyPagination.totalPages, p + 1)
                  )
                }
                disabled={historyPage === historyPagination.totalPages}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${t.border} ${t.soft} ${t.text} disabled:opacity-50 ${t.hover}`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;